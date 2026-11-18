"""
Risk engine for BRACE.

Computes baseline asset risk, total network exposure, and residual risk
after defensive security controls are deployed.

Formulation:
    Asset risk: R_j = I_j × P_j
    where:
        I_j = Asset Criticality (impact factor, 1-10 normalized to 0-1)
        P_j = Vulnerability Score (likelihood/probability factor, 0-1)

    Total baseline exposure:
        R_total = Σ R_j

    Residual Risk:
        R_residual = Σ (R_j × (1 - reduction_factor_j))
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any

from backend.algorithms.brute_force import KnapsackItem
from backend.simulation.network_builder import NetworkAsset, VirtualNetwork


class ControlCategory(str, Enum):
    """Categories of defensive controls."""
    PERIMETER = "perimeter"
    ENDPOINT = "endpoint"
    NETWORK = "network"
    DATA = "data"
    IDENTITY = "identity"
    OPERATIONS = "operations"


@dataclass
class DefensiveControl:
    """A defensive security control available for deployment.

    Attributes:
        id: Unique identifier (string or int).
        name: Name of the security control.
        description: Technical explanation of the defense.
        cost: Implementation and operational cost (in budget units).
        risk_reduction: Estimated percentage risk reduction (0.0 to 1.0 or value).
        asset_coverage: Types of assets protected, or 'all'.
        category: Control classification.
        confidence: Confidence level in efficacy (0.0 - 1.0).
    """
    id: str
    name: str
    description: str
    cost: float
    risk_reduction: float
    asset_coverage: list[str] = field(default_factory=lambda: ["all"])
    category: ControlCategory = ControlCategory.NETWORK
    confidence: float = 0.90

    def to_knapsack_item(self, numeric_id: int) -> KnapsackItem:
        """Convert defensive control to KnapsackItem for optimization."""
        return KnapsackItem(
            id=numeric_id,
            name=self.name,
            cost=self.cost,
            value=self.risk_reduction,
            description=self.description,
            category=self.category.value,
        )


# Standard default defensive controls catalogue as specified in Section 5
DEFAULT_CONTROLS: list[DefensiveControl] = [
    DefensiveControl(
        id="ctrl_firewall",
        name="Next-Gen Firewall Upgrade",
        description="Deep packet inspection, application-level filtering, and boundary threat protection.",
        cost=35.0,
        risk_reduction=45.0,
        asset_coverage=["router", "firewall", "gateway"],
        category=ControlCategory.PERIMETER,
        confidence=0.92,
    ),
    DefensiveControl(
        id="ctrl_edr",
        name="Endpoint Detection & Response (EDR)",
        description="Behavioral monitoring, process anomaly detection, and automated isolation on endpoints.",
        cost=45.0,
        risk_reduction=60.0,
        asset_coverage=["workstation", "server"],
        category=ControlCategory.ENDPOINT,
        confidence=0.95,
    ),
    DefensiveControl(
        id="ctrl_ids",
        name="Intrusion Detection System (IDS/IPS)",
        description="Signature and anomaly-based lateral movement detection across internal network segments.",
        cost=25.0,
        risk_reduction=35.0,
        asset_coverage=["router", "server", "workstation"],
        category=ControlCategory.NETWORK,
        confidence=0.88,
    ),
    DefensiveControl(
        id="ctrl_segmentation",
        name="Micro-Segmentation & VLANs",
        description="Isolates critical production databases and servers from user workstations.",
        cost=40.0,
        risk_reduction=55.0,
        asset_coverage=["server", "database", "router"],
        category=ControlCategory.NETWORK,
        confidence=0.94,
    ),
    DefensiveControl(
        id="ctrl_encryption",
        name="Data-at-Rest & In-Transit Encryption",
        description="AES-256 encryption for database tables and TLS 1.3 encryption across all links.",
        cost=20.0,
        risk_reduction=30.0,
        asset_coverage=["database", "server", "cloud_service"],
        category=ControlCategory.DATA,
        confidence=0.98,
    ),
    DefensiveControl(
        id="ctrl_backup",
        name="Immutable Backup & Disaster Recovery",
        description="Air-gapped, write-once backups resilient against ransomware encryption.",
        cost=30.0,
        risk_reduction=40.0,
        asset_coverage=["database", "server"],
        category=ControlCategory.OPERATIONS,
        confidence=0.96,
    ),
    DefensiveControl(
        id="ctrl_iam",
        name="Zero Trust Identity & MFA Enforcement",
        description="Contextual multi-factor authentication and strict least-privilege role-based access.",
        cost=25.0,
        risk_reduction=38.0,
        asset_coverage=["workstation", "server", "cloud_service"],
        category=ControlCategory.IDENTITY,
        confidence=0.91,
    ),
    DefensiveControl(
        id="ctrl_patch",
        name="Automated Patch Management",
        description="Continuous vulnerability assessment and automated kernel/software patching.",
        cost=15.0,
        risk_reduction=25.0,
        asset_coverage=["server", "workstation", "router"],
        category=ControlCategory.OPERATIONS,
        confidence=0.85,
    ),
]


@dataclass
class RiskProfile:
    """Detailed risk assessment profile for a network."""
    total_baseline_risk: float
    total_residual_risk: float
    risk_reduction_achieved: float
    risk_reduction_percentage: float
    asset_risks: dict[str, float]
    residual_asset_risks: dict[str, float]
    selected_control_names: list[str]
    budget_used: float
    budget_allocated: float


class RiskEngine:
    """Engine for computing network risk and evaluating mitigation impact."""

    @staticmethod
    def calculate_asset_risk(asset: NetworkAsset) -> float:
        """Calculate single asset risk: R_j = Impact × Probability.

        Criticality (1-10) is scaled to Impact (0.1 - 1.0).
        Vulnerability score is used directly as Probability (0.0 - 1.0).
        """
        impact = max(0.1, min(1.0, asset.criticality / 10.0))
        prob = max(0.0, min(1.0, asset.vulnerability_score))
        return round(impact * prob * 100.0, 2)

    @classmethod
    def calculate_network_risk(cls, network: VirtualNetwork) -> dict[str, Any]:
        """Compute baseline risk metrics for all assets in the network."""
        asset_risks: dict[str, float] = {}
        total_risk = 0.0

        for asset_id, asset in network.assets.items():
            r = cls.calculate_asset_risk(asset)
            asset_risks[asset_id] = r
            total_risk += r

        return {
            "total_baseline_risk": round(total_risk, 2),
            "asset_risks": asset_risks,
            "average_risk": round(total_risk / len(network.assets), 2) if network.assets else 0.0,
        }

    @classmethod
    def evaluate_controls(
        cls,
        network: VirtualNetwork,
        selected_controls: list[DefensiveControl],
        budget: float,
    ) -> RiskProfile:
        """Evaluate the effect of deploying selected controls on network risk.

        Accounts for asset coverage and computes residual risk profile.
        """
        base_assessment = cls.calculate_network_risk(network)
        baseline_total = base_assessment["total_baseline_risk"]
        asset_risks = base_assessment["asset_risks"]

        residual_asset_risks: dict[str, float] = {}
        total_residual = 0.0
        budget_used = sum(c.cost for c in selected_controls)

        # Compute effective reduction per asset based on applicable controls
        for asset_id, asset in network.assets.items():
            base_r = asset_risks[asset_id]
            # Find controls covering this asset type
            applicable = [
                c for c in selected_controls
                if "all" in c.asset_coverage or asset.asset_type.value in c.asset_coverage
            ]

            if not applicable:
                residual_asset_risks[asset_id] = base_r
                total_residual += base_r
                continue

            # Diminishing returns formula for multiple overlapping controls:
            # 1 - Π (1 - c_i.risk_reduction_rate)
            combined_reduction = 0.0
            unmitigated_fraction = 1.0
            for c in applicable:
                # Normalize reduction value to fraction [0, 0.95]
                reduction_rate = min(0.70, (c.risk_reduction / 100.0) * c.confidence)
                unmitigated_fraction *= (1.0 - reduction_rate)

            effective_reduction_pct = 1.0 - unmitigated_fraction
            res_r = round(base_r * (1.0 - effective_reduction_pct), 2)
            residual_asset_risks[asset_id] = res_r
            total_residual += res_r

        risk_reduction = max(0.0, round(baseline_total - total_residual, 2))
        pct_reduction = (
            round((risk_reduction / baseline_total) * 100.0, 1)
            if baseline_total > 0 else 0.0
        )

        return RiskProfile(
            total_baseline_risk=round(baseline_total, 2),
            total_residual_risk=round(total_residual, 2),
            risk_reduction_achieved=risk_reduction,
            risk_reduction_percentage=pct_reduction,
            asset_risks=asset_risks,
            residual_asset_risks=residual_asset_risks,
            selected_control_names=[c.name for c in selected_controls],
            budget_used=round(budget_used, 2),
            budget_allocated=budget,
        )
