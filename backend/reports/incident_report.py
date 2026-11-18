"""
Incident and Optimization report generation for BRACE.

Generates structured incident reports from attack simulations and
optimization reports from defensive resource allocation.
"""

from __future__ import annotations

import datetime
from typing import Any


def generate_incident_report(
    scenario_name: str,
    scenario_description: str,
    network_summary: dict[str, Any],
    events: list[dict[str, Any]],
    affected_assets: list[str],
    compromised_assets: list[str],
    containment_successful: bool,
) -> dict[str, Any]:
    """Generate structured Incident Report."""
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    return {
        "report_id": f"INC-{int(datetime.datetime.now().timestamp())}",
        "type": "incident",
        "title": f"Cybersecurity Incident Report: {scenario_name}",
        "generated_at": now,
        "executive_summary": (
            f"Simulated attack '{scenario_name}' completed. "
            f"Adversary targeted {len(affected_assets)} network nodes, successfully compromising "
            f"{len(compromised_assets)} systems. Incident response automated containment was "
            f"{'successful in isolating the breach' if containment_successful else 'partially breached'}."
        ),
        "scenario_details": {
            "name": scenario_name,
            "description": scenario_description,
            "duration_events": len(events),
        },
        "network_topology": network_summary,
        "affected_assets": affected_assets,
        "compromised_assets": compromised_assets,
        "containment_status": "Contained" if containment_successful else "Breached",
        "timeline": events,
        "recommendations": [
            "Deploy Endpoint Detection & Response (EDR) on initial pivot hosts.",
            "Enforce VLAN micro-segmentation between user workstations and database clusters.",
            "Implement Zero Trust Identity & MFA across administrative boundaries.",
            "Verify automated containment rule triggers in SIEM platform.",
        ],
    }


def generate_optimization_report(
    algorithm: str,
    budget: float,
    total_cost: float,
    total_risk_reduction: float,
    selected_controls: list[dict[str, Any]],
    baseline_risk: float,
    residual_risk: float,
    metrics: dict[str, Any],
) -> dict[str, Any]:
    """Generate structured Defense Optimization Report."""
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    return {
        "report_id": f"OPT-{int(datetime.datetime.now().timestamp())}",
        "type": "optimization",
        "title": f"Defensive Resource Optimization Report ({algorithm.upper()})",
        "generated_at": now,
        "summary": {
            "algorithm_used": algorithm,
            "budget_allocated": budget,
            "budget_utilized": total_cost,
            "budget_utilization_pct": round((total_cost / budget * 100.0) if budget > 0 else 0, 1),
            "total_risk_reduction": total_risk_reduction,
            "baseline_risk": baseline_risk,
            "residual_risk": residual_risk,
            "risk_reduction_pct": round(
                ((baseline_risk - residual_risk) / baseline_risk * 100.0) if baseline_risk > 0 else 0,
                1,
            ),
        },
        "selected_controls": selected_controls,
        "algorithmic_metrics": metrics,
        "mathematical_model": (
            "0/1 Knapsack Problem: Maximize Z = Σ(v_i · x_i) subject to Σ(c_i · x_i) ≤ B, x_i ∈ {0, 1}. "
            "Solves for Pareto-optimal defense allocation under strict financial constraints."
        ),
    }
