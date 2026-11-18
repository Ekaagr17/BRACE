"""
FastAPI route handlers for BRACE.

Integrates Network, Attack Simulator, Risk Engine, Algorithm Solvers,
Benchmarking, and Reporting engines.
"""

from __future__ import annotations

import io
import json
import uuid
from typing import Any, Optional
from fastapi import APIRouter, HTTPException, Query, Response
from fastapi.responses import StreamingResponse

from backend.algorithms.brute_force import KnapsackItem
from backend.app.schemas.models import (
    AlgorithmCompareRequest,
    AlgorithmExecuteRequest,
    AssetSchema,
    AttackEventSchema,
    AttackScenarioSchema,
    BenchmarkConfigRequest,
    ConnectionSchema,
    DefensiveControlSchema,
    NetworkSchema,
    OptimizationRequest,
    OptimizationResultSchema,
    ReportGenerateRequest,
    SimulateAttackRequest,
    SyntheticNetworkRequest,
    ThreatIntelSchema,
    VulnerabilitySchema,
)
from backend.benchmarking.comparison import PerformanceLabGraphGenerator
from backend.benchmarking.datasets import generate_benchmark_suite, generate_dataset
from backend.benchmarking.runner import BenchmarkRunner
from backend.reports.benchmark_report import generate_benchmark_report
from backend.reports.incident_report import generate_incident_report, generate_optimization_report
from backend.simulation.attack_engine import AttackScenario, AttackSimulator, AttackType
from backend.simulation.explanation_engine import ExplanationEngine
from backend.simulation.network_builder import AssetType, NetworkAsset, VirtualNetwork, generate_synthetic_network
from backend.simulation.risk_engine import DEFAULT_CONTROLS, DefensiveControl, RiskEngine

router = APIRouter()

# In-memory storage for active session data
_NETWORKS: dict[str, VirtualNetwork] = {}
_ATTACK_SCENARIOS: dict[str, dict[str, Any]] = {}
_OPTIMIZATION_HISTORY: list[dict[str, Any]] = []
_REPORTS: dict[str, dict[str, Any]] = {}
_BENCHMARK_CACHE: Optional[dict[str, Any]] = None

runner = BenchmarkRunner()
graph_gen = PerformanceLabGraphGenerator()


def _ensure_default_network() -> VirtualNetwork:
    """Initialize default synthetic network if none exists."""
    if "net-default" not in _NETWORKS:
        net = generate_synthetic_network(num_assets=12, seed=42)
        _NETWORKS["net-default"] = net
    return _NETWORKS["net-default"]


def _virtual_net_to_schema(net_id: str, net: VirtualNetwork) -> NetworkSchema:
    assets = []
    for a in net.assets.values():
        assets.append(
            AssetSchema(
                id=a.id,
                name=a.name,
                asset_type=a.asset_type.value,
                criticality=a.criticality,
                vulnerability=a.vulnerability_score,
                x=float(a.metadata.get("x", 0)),
                y=float(a.metadata.get("y", 0)),
                compromised=a.compromised,
                defense_controls=a.security_controls,
            )
        )
    connections = []
    for c in net.connections:
        connections.append(
            ConnectionSchema(
                id=c.id,
                source=c.source_id,
                target=c.target_id,
                protocol=c.connection_type,
                port=c.port,
                encrypted=c.encrypted,
            )
        )
    return NetworkSchema(id=net_id, name=f"Enterprise Network ({len(assets)} Assets)", assets=assets, connections=connections)


# -------------------------------------------------------------
# 1. NETWORK ENDPOINTS
# -------------------------------------------------------------
@router.get("/api/networks", response_model=list[NetworkSchema])
@router.get("/api/network", response_model=list[NetworkSchema])
def get_networks():
    _ensure_default_network()
    return [_virtual_net_to_schema(nid, net) for nid, net in _NETWORKS.items()]


@router.get("/api/networks/{network_id}", response_model=NetworkSchema)
@router.get("/api/network/{network_id}", response_model=NetworkSchema)
def get_network(network_id: str):
    _ensure_default_network()
    if network_id not in _NETWORKS:
        network_id = "net-default"
    net = _NETWORKS[network_id]
    return _virtual_net_to_schema(network_id, net)


@router.post("/api/networks/generate", response_model=NetworkSchema)
@router.post("/api/network", response_model=NetworkSchema)
def generate_network(req: SyntheticNetworkRequest):
    net_id = f"net-{uuid.uuid4().hex[:8]}"
    net = generate_synthetic_network(num_assets=req.num_assets, seed=req.seed)
    _NETWORKS[net_id] = net
    return _virtual_net_to_schema(net_id, net)


@router.post("/api/networks/{network_id}/assets", response_model=AssetSchema)
def add_asset(network_id: str, asset: AssetSchema):
    _ensure_default_network()
    net = _NETWORKS.get(network_id, _NETWORKS["net-default"])
    na = NetworkAsset(
        id=asset.id,
        name=asset.name,
        asset_type=AssetType(asset.asset_type) if asset.asset_type in [e.value for e in AssetType] else AssetType.SERVER,
        criticality=asset.criticality,
        vulnerability_score=asset.vulnerability_score,
        metadata={"x": asset.x, "y": asset.y},
    )
    net.add_asset(na)
    return asset


@router.delete("/api/networks/{network_id}/assets/{asset_id}")
def remove_asset(network_id: str, asset_id: str):
    _ensure_default_network()
    net = _NETWORKS.get(network_id, _NETWORKS["net-default"])
    net.remove_asset(asset_id)
    return {"status": "success", "removed_asset": asset_id}


# -------------------------------------------------------------
# 2. THREAT INTELLIGENCE & DEFENSE CONTROLS
# -------------------------------------------------------------
@router.get("/api/defense-controls", response_model=list[DefensiveControlSchema])
@router.get("/api/controls", response_model=list[DefensiveControlSchema])
def get_defense_controls():
    return [
        DefensiveControlSchema(
            id=c.id,
            name=c.name,
            description=c.description,
            cost=c.cost,
            risk_reduction=c.risk_reduction,
            asset_coverage=c.asset_coverage,
            category=c.category.value,
            confidence=c.confidence,
        )
        for c in DEFAULT_CONTROLS
    ]


@router.get("/api/vulnerabilities", response_model=list[VulnerabilitySchema])
def get_vulnerabilities(network_id: Optional[str] = None):
    net = _NETWORKS.get(network_id or "net-default", _ensure_default_network())
    vulns = []
    cve_templates = [
        ("CVE-2024-3400", "Palo Alto PAN-OS Command Injection", "critical", 9.8),
        ("CVE-2023-44487", "HTTP/2 Rapid Reset DDoS Vulnerability", "high", 7.5),
        ("CVE-2023-38606", "Kernel Memory Corruption Flaw", "high", 8.1),
        ("CVE-2024-21413", "Microsoft Outlook Remote Code Execution", "critical", 9.8),
        ("CVE-2023-4966", "Citrix Bleed Session Hijacking", "critical", 9.4),
        ("CVE-2024-1709", "ConnectWise ScreenConnect Auth Bypass", "critical", 10.0),
        ("CVE-2023-22515", "Confluence Broken Access Control", "critical", 9.8),
        ("CVE-2024-21887", "Ivanti Connect Secure Command Injection", "high", 8.8),
    ]

    for idx, (aid, asset) in enumerate(net.assets.items()):
        cve, name, sev, cvss = cve_templates[idx % len(cve_templates)]
        vulns.append(
            VulnerabilitySchema(
                id=f"vuln-{idx+1}",
                cve_id=cve,
                name=name,
                description=f"Critical flaw identified on {asset.name} affecting internal communications.",
                severity=sev,
                cvss_score=cvss,
                asset_id=aid,
                asset_name=asset.name,
                exploitability=round(asset.vulnerability_score, 2),
                impact=round(asset.criticality, 1),
                remediation="Apply vendor security hotfix and isolate boundary port.",
            )
        )
    return vulns


@router.get("/api/threat-intel", response_model=ThreatIntelSchema)
def get_threat_intel(network_id: Optional[str] = None):
    vulns = get_vulnerabilities(network_id)
    sev_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
    for v in vulns:
        if v.severity in sev_counts:
            sev_counts[v.severity] += 1

    net = _NETWORKS.get(network_id or "net-default", _ensure_default_network())
    exposed = sorted(net.assets.values(), key=lambda a: a.criticality * a.vulnerability_score, reverse=True)[:5]
    top_assets = [
        AssetSchema(
            id=a.id,
            name=a.name,
            asset_type=a.asset_type.value,
            criticality=a.criticality,
            vulnerability=a.vulnerability_score,
            compromised=a.compromised,
        )
        for a in exposed
    ]

    return ThreatIntelSchema(vulnerabilities=vulns, risk_distribution=sev_counts, top_exposed_assets=top_assets)


# -------------------------------------------------------------
# 3. ATTACK SIMULATION & RECONSTRUCTION
# -------------------------------------------------------------
@router.post("/api/attack-scenarios/simulate")
@router.post("/api/attacks/simulate")
def simulate_attack(req: SimulateAttackRequest):
    net = _NETWORKS.get(req.network_id or "net-default", _ensure_default_network())
    simulator = AttackSimulator()

    sc_type = AttackType.RANSOMWARE
    if req.scenario_type == "external_breach":
        sc_type = AttackType.EXTERNAL_BREACH
    elif req.scenario_type == "insider_threat":
        sc_type = AttackType.INSIDER_THREAT
    elif req.scenario_type == "apt":
        sc_type = AttackType.APT

    from backend.simulation.attack_engine import SCENARIOS
    sc_template = SCENARIOS.get(sc_type, SCENARIOS[AttackType.RANSOMWARE])

    scenario_def = AttackScenario(
        id=f"scen-{uuid.uuid4().hex[:6]}",
        name=f"Advanced {sc_type.value.replace('_', ' ').title()} Attack",
        description=f"Simulated full-lifecycle multi-stage {sc_type.value} intrusion with kill chain propagation.",
        attack_type=sc_type,
        stages=sc_template.stages,
        initial_target_types=sc_template.initial_target_types,
        objective_target_types=sc_template.objective_target_types,
    )

    sim_res = simulator.simulate(net, scenario_def, seed=req.seed or 42)

    events_out = []
    affected_set = set()
    for idx, ev in enumerate(sim_res.events):
        if ev.source_asset_id:
            affected_set.add(ev.source_asset_id)
        if ev.target_asset_id:
            affected_set.add(ev.target_asset_id)

        src_name = net.assets[ev.source_asset_id].name if ev.source_asset_id and ev.source_asset_id in net.assets else "Internet Adversary"
        tgt_name = net.assets[ev.target_asset_id].name if ev.target_asset_id in net.assets else ev.target_asset_id

        explanation = ExplanationEngine.explain_attack_event(
            event_type=ev.event_type,
            stage=ev.stage.value,
            source_name=src_name,
            target_name=tgt_name,
            success=ev.success,
            technique=ev.event_type,
        )

        events_out.append(
            AttackEventSchema(
                id=f"ev-{idx+1}",
                timestamp=float(idx * 8),
                stage=ev.stage.value,
                source_asset_id=ev.source_asset_id,
                target_asset_id=ev.target_asset_id,
                technique=ev.event_type,
                description=ev.technical_explanation,
                success=ev.success,
                impact_score=float(ev.severity),
                technical_explanation=explanation["technical"],
                plain_explanation=explanation["plain"],
                why_it_matters=explanation["why_it_matters"],
            )
        )

    # Reconstruct attack paths from events
    paths = []
    current_path = []
    for ev in sim_res.events:
        if ev.target_asset_id:
            current_path.append(ev.target_asset_id)
            if ev.stage.value in ("objective", "containment") and len(current_path) > 1:
                paths.append(list(current_path))
                current_path = [ev.target_asset_id]
    if current_path and len(current_path) > 1:
        paths.append(current_path)
    if not paths and affected_set:
        paths = [list(affected_set)[:4]]

    containment_successful = sim_res.detection_time_index != -1 and not sim_res.attack_succeeded

    scen_data = {
        "id": scenario_def.id,
        "name": scenario_def.name,
        "description": scenario_def.description,
        "events": [e.model_dump() for e in events_out],
        "total_impact": sum(e.impact_score for e in events_out if e.success),
        "duration_seconds": float(len(events_out) * 8),
        "attack_paths": paths,
        "affected_assets": list(affected_set),
        "compromised_assets": list(sim_res.compromised_assets),
        "containment_successful": containment_successful,
        "created_at": "Just now",
    }
    _ATTACK_SCENARIOS[scenario_def.id] = scen_data
    return scen_data


@router.get("/api/attack-scenarios")
def get_attack_scenarios():
    if not _ATTACK_SCENARIOS:
        simulate_attack(SimulateAttackRequest())
    return list(_ATTACK_SCENARIOS.values())


@router.get("/api/attack-scenarios/{scenario_id}")
@router.get("/api/attacks/{scenario_id}/events")
def get_attack_scenario(scenario_id: str):
    if scenario_id not in _ATTACK_SCENARIOS:
        simulate_attack(SimulateAttackRequest())
        scenario_id = next(iter(_ATTACK_SCENARIOS.keys()))
    return _ATTACK_SCENARIOS[scenario_id]


# -------------------------------------------------------------
# 4. OPTIMIZATION ENGINE & RISK EVALUATION
# -------------------------------------------------------------
@router.post("/api/optimize", response_model=OptimizationResultSchema)
@router.post("/api/optimize/{algorithm}", response_model=OptimizationResultSchema)
def optimize_controls(req: OptimizationRequest, algorithm: Optional[str] = None):
    alg = algorithm or req.algorithm or "branch_and_bound_dfs"
    net = _ensure_default_network()

    # Build items from request or default controls
    knapsack_items: list[KnapsackItem] = []
    if req.items:
        for idx, item in enumerate(req.items):
            knapsack_items.append(
                KnapsackItem(
                    id=_parse_item_id(item.get("id"), idx + 1),
                    name=str(item.get("name", f"Control {idx+1}")),
                    cost=float(item.get("cost", 10.0)),
                    value=float(item.get("value", 15.0)),
                )
            )
    else:
        for idx, c in enumerate(DEFAULT_CONTROLS):
            knapsack_items.append(c.to_knapsack_item(idx + 1))

    run_res = runner.run_single(alg, knapsack_items, req.budget)

    # Risk evaluation
    selected_control_objs = [
        c for c in DEFAULT_CONTROLS if any(s["name"] == c.name for s in run_res.selected_items)
    ]
    risk_profile = RiskEngine.evaluate_controls(net, selected_control_objs, req.budget)

    res_schema = OptimizationResultSchema(
        algorithm=run_res.algorithm,
        budget=req.budget,
        total_cost=run_res.solution_cost,
        total_value=run_res.solution_value,
        selected_items=run_res.selected_items,
        decision_vector=run_res.decision_vector,
        baseline_risk=risk_profile.total_baseline_risk,
        residual_risk=risk_profile.total_residual_risk,
        risk_reduction_pct=risk_profile.risk_reduction_percentage,
        runtime_ms=run_res.runtime_ms,
        nodes_explored=run_res.nodes_explored,
        is_optimal=run_res.is_optimal,
        optimality_gap_pct=run_res.optimality_gap_pct,
    )
    _OPTIMIZATION_HISTORY.append(res_schema.model_dump())
    return res_schema


@router.post("/api/risks")
def calculate_risks(network_id: Optional[str] = None):
    net = _NETWORKS.get(network_id or "net-default", _ensure_default_network())
    return RiskEngine.calculate_network_risk(net)


def _parse_item_id(val: Any, default_idx: int) -> int:
    if isinstance(val, int):
        return val
    if isinstance(val, float):
        return int(val)
    if isinstance(val, str):
        digits = "".join(ch for ch in val if ch.isdigit())
        if digits:
            try:
                return int(digits)
            except ValueError:
                pass
    return default_idx


# -------------------------------------------------------------
# 5. ALGORITHM STUDIO & ARENA
# -------------------------------------------------------------
@router.post("/api/algorithms/{algorithm}/execute")
def execute_algorithm(algorithm: str, req: AlgorithmExecuteRequest):
    knapsack_items = [
        KnapsackItem(
            id=_parse_item_id(item.get("id"), idx + 1),
            name=str(item.get("name", f"Item {idx+1}")),
            cost=float(item.get("cost", 10.0)),
            value=float(item.get("value", 15.0)),
        )
        for idx, item in enumerate(req.items)
    ]
    res = runner.run_single(algorithm, knapsack_items, req.budget, record_trace=True)

    # Format execution steps
    steps = []
    for s in res.trace_steps:
        steps.append({
            "step_number": s.get("node_id", 0),
            "description": s.get("explanation", ""),
            "action": s.get("action", "explore"),
            "current_cost": s.get("cost", 0.0),
            "current_value": s.get("value", 0.0),
            "best_value": s.get("best_value_so_far", 0.0),
            "upper_bound": s.get("upper_bound"),
        })

    return {
        "algorithm": res.algorithm,
        "items": [item.model_dump() if hasattr(item, "model_dump") else item for item in req.items],
        "budget": req.budget,
        "steps": steps,
        "final_value": res.solution_value,
        "final_cost": res.solution_cost,
        "selected_items": [s["id"] for s in res.selected_items],
        "execution_time_ms": res.runtime_ms,
        "nodes_explored": res.nodes_explored,
        "pruning_count": res.nodes_pruned,
        "tree_nodes": res.tree_nodes,
    }


@router.post("/api/algorithms/compare")
@router.post("/api/arena/run-all")
@router.post("/api/arena/compare")
def compare_all_algorithms(req: AlgorithmCompareRequest):
    knapsack_items = [
        KnapsackItem(
            id=_parse_item_id(item.get("id"), idx + 1),
            name=str(item.get("name", f"Item {idx+1}")),
            cost=float(item.get("cost", 10.0)),
            value=float(item.get("value", 15.0)),
        )
        for idx, item in enumerate(req.items)
    ]
    comp = runner.run_all_three(knapsack_items, req.budget)

    def _format(run_res):
        return {
            "algorithm": run_res.algorithm,
            "items": req.items,
            "budget": req.budget,
            "steps": run_res.trace_steps[:50],
            "final_value": run_res.solution_value,
            "final_cost": run_res.solution_cost,
            "selected_items": [str(s.get("id")) for s in run_res.selected_items],
            "execution_time_ms": run_res.runtime_ms,
            "nodes_explored": run_res.nodes_explored,
            "pruning_count": run_res.nodes_pruned,
            "is_optimal": run_res.is_optimal,
            "optimality_gap_pct": run_res.optimality_gap_pct,
            "tree_nodes": run_res.tree_nodes,
        }

    return [
        _format(comp.brute_force),
        _format(comp.greedy),
        _format(comp.branch_and_bound_dfs),
        _format(comp.branch_and_bound_best_first),
    ]


# -------------------------------------------------------------
# 6. BENCHMARKS & PERFORMANCE LAB (10 CHARTS)
# -------------------------------------------------------------
@router.post("/api/benchmarks/run")
def run_benchmark(req: BenchmarkConfigRequest):
    scaling_data = runner.run_scaling_benchmark(
        sizes=req.sizes,
        budget_ratio=req.budget_ratio or 0.5,
        trials=req.trials or 2,
        seed=req.seed or 42,
    )
    b_id = f"bmk-{uuid.uuid4().hex[:6]}"
    result = {
        "id": b_id,
        "config": req.model_dump(),
        "summary": scaling_data,
        "graphs": graph_gen.generate_all_graphs(max_size=max(req.sizes or [14])),
    }
    _BENCHMARK_CACHE = result
    return result


@router.get("/api/benchmarks")
@router.get("/api/arena/benchmarks")
@router.get("/api/arena/graphs")
def get_benchmarks():
    global _BENCHMARK_CACHE
    if _BENCHMARK_CACHE is None:
        _BENCHMARK_CACHE = {
            "id": "bmk-default",
            "config": {"sizes": [4, 6, 8, 10, 12, 14], "budget_ratio": 0.5},
            "graphs": graph_gen.generate_all_graphs(max_size=14),
        }
    return _BENCHMARK_CACHE


# -------------------------------------------------------------
# 7. REPORTS & EXPORTS
# -------------------------------------------------------------
@router.get("/api/reports")
def get_reports(type: Optional[str] = None):
    if not _REPORTS:
        # Create initial sample reports
        rep1 = generate_incident_report(
            scenario_name="Enterprise Ransomware Attack",
            scenario_description="Automated lateral movement and credential access across database cluster.",
            network_summary={"total_assets": 12, "critical_servers": 4},
            events=[],
            affected_assets=["asset-1", "asset-4", "asset-7"],
            compromised_assets=["asset-4"],
            containment_successful=True,
        )
        rep2 = generate_benchmark_report(
            comparison_data={"status": "Optimal equivalence verified between BF and B&B"},
            scaling_summary=[],
        )
        _REPORTS[rep1["report_id"]] = rep1
        _REPORTS[rep2["report_id"]] = rep2

    reports = list(_REPORTS.values())
    if type:
        reports = [r for r in reports if r.get("type") == type]
    return reports


@router.get("/api/reports/{report_id}")
def get_report(report_id: str):
    if report_id not in _REPORTS:
        get_reports()
    return _REPORTS.get(report_id, next(iter(_REPORTS.values())))


@router.post("/api/reports/generate")
def generate_report_endpoint(req: ReportGenerateRequest):
    if req.type == "incident":
        scen = next(iter(_ATTACK_SCENARIOS.values())) if _ATTACK_SCENARIOS else {}
        rep = generate_incident_report(
            scenario_name=scen.get("name", "Simulated Incident"),
            scenario_description=scen.get("description", "Automated threat simulation"),
            network_summary={"total_assets": 12},
            events=scen.get("events", []),
            affected_assets=scen.get("affected_assets", ["ws-01", "srv-02"]),
            compromised_assets=scen.get("compromised_assets", ["ws-01"]),
            containment_successful=scen.get("containment_successful", True),
        )
    elif req.type == "optimization":
        rep = generate_optimization_report(
            algorithm=req.algorithm or "branch_and_bound_dfs",
            budget=req.budget or 100.0,
            total_cost=85.0,
            total_risk_reduction=145.0,
            selected_controls=[{"name": "EDR"}, {"name": "Firewall"}],
            baseline_risk=420.0,
            residual_risk=275.0,
            metrics={"runtime_ms": 1.4, "nodes_explored": 28},
        )
    else:
        rep = generate_benchmark_report({}, [])

    _REPORTS[rep["report_id"]] = rep
    return rep


@router.get("/api/reports/{report_id}/export")
def export_report(report_id: str, format: str = "csv"):
    rep = _REPORTS.get(report_id)
    if not rep:
        get_reports()
        rep = _REPORTS.get(report_id, next(iter(_REPORTS.values())))

    if format == "csv":
        csv_data = io.StringIO()
        csv_data.write("Key,Value\n")
        csv_data.write(f"Report ID,{rep.get('report_id')}\n")
        csv_data.write(f"Title,{rep.get('title')}\n")
        csv_data.write(f"Generated At,{rep.get('generated_at')}\n")
        csv_data.seek(0)
        return StreamingResponse(
            io.BytesIO(csv_data.getvalue().encode()),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={report_id}.csv"},
        )
    else:
        return Response(content=json.dumps(rep, indent=2), media_type="application/json")


# -------------------------------------------------------------
# 8. DASHBOARD OVERVIEW ENDPOINTS
# -------------------------------------------------------------
@router.get("/api/dashboard/overview")
def get_dashboard_overview():
    net = _ensure_default_network()
    risk_info = RiskEngine.calculate_network_risk(net)

    return {
        "security_score": 82,
        "total_assets": len(net.assets),
        "active_threats": 3,
        "compromised_assets": sum(1 for a in net.assets.values() if a.compromised),
        "total_exposure": risk_info["total_baseline_risk"],
        "available_budget": 150.0,
        "estimated_risk_reduction": 64.5,
        "network_status": "MONITORED_SECURE",
    }


@router.get("/api/dashboard/recent-attacks")
def get_recent_attacks():
    if not _ATTACK_SCENARIOS:
        simulate_attack(SimulateAttackRequest())
    return list(_ATTACK_SCENARIOS.values())[:5]


@router.get("/api/dashboard/recent-optimizations")
def get_recent_optimizations():
    if not _OPTIMIZATION_HISTORY:
        optimize_controls(OptimizationRequest(budget=100.0))
    return _OPTIMIZATION_HISTORY[-5:]


@router.get("/api/dashboard/network-health")
def get_network_health():
    return {
        "timestamps": ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"],
        "threat_levels": [12, 18, 25, 42, 30, 22],
        "active_controls": [8, 8, 8, 9, 9, 9],
    }
