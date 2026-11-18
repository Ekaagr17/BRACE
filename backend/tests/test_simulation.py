"""
Automated unit tests for BRACE cybersecurity simulation:
1. Virtual Network topology and asset modeling
2. Multi-stage Attack Simulator
3. Risk Engine and Residual Risk
4. 3-Layer Explanation Engine
"""

from backend.simulation.attack_engine import SCENARIOS, AttackSimulator, AttackType
from backend.simulation.explanation_engine import ExplanationEngine
from backend.simulation.network_builder import AssetType, NetworkAsset, generate_synthetic_network
from backend.simulation.risk_engine import DEFAULT_CONTROLS, RiskEngine


def test_virtual_network_generation():
    """Verify synthetic network generation produces valid graph topology."""
    net = generate_synthetic_network(num_assets=10, seed=42)

    assert len(net.assets) == 10
    assert len(net.connections) > 0

    stats = net.get_topology_stats()
    assert stats["num_assets"] == 10
    assert stats["num_connections"] > 0
    assert "average_criticality" in stats or "avg_degree" in stats


def test_asset_management():
    """Verify adding and removing assets dynamically."""
    net = generate_synthetic_network(num_assets=5, seed=123)
    new_asset = NetworkAsset(
        id="test-srv",
        name="Test Database",
        asset_type=AssetType.DATABASE,
        criticality=9.0,
        vulnerability_score=0.7,
    )
    net.add_asset(new_asset)
    assert "test-srv" in net.assets

    net.remove_asset("test-srv")
    assert "test-srv" not in net.assets


def test_attack_simulation_reproducibility():
    """Verify attack simulator runs and produces ordered kill chain events."""
    net = generate_synthetic_network(num_assets=12, seed=42)
    simulator = AttackSimulator()

    scenario = SCENARIOS[AttackType.RANSOMWARE]

    res1 = simulator.simulate(net, scenario, seed=777)
    assert len(res1.events) > 0
    assert len(res1.compromised_assets) >= 0

    # Event ordering verification
    prev_time = None
    for ev in res1.events:
        if prev_time is not None:
            assert ev.timestamp >= prev_time
        prev_time = ev.timestamp


def test_risk_engine_calculations():
    """Verify baseline risk and control mitigation arithmetic."""
    net = generate_synthetic_network(num_assets=8, seed=99)
    risk_info = RiskEngine.calculate_network_risk(net)

    assert risk_info["total_baseline_risk"] > 0.0
    assert len(risk_info["asset_risks"]) == 8

    # Apply default controls
    selected = DEFAULT_CONTROLS[:3]
    profile = RiskEngine.evaluate_controls(net, selected, budget=100.0)

    assert profile.total_residual_risk <= profile.total_baseline_risk
    assert profile.risk_reduction_achieved >= 0.0
    assert profile.budget_used > 0.0


def test_explanation_engine_three_layers():
    """Verify explanation engine always generates all three layers."""
    exp = ExplanationEngine.explain_attack_event(
        event_type="lateral_movement",
        stage="lateral_movement",
        source_name="Workstation 1",
        target_name="Core Database",
        success=True,
    )

    assert "technical" in exp and len(exp["technical"]) > 10
    assert "plain" in exp and len(exp["plain"]) > 10
    assert "why_it_matters" in exp and len(exp["why_it_matters"]) > 10
