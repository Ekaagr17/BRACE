"""
Pydantic v2 schemas for BRACE API.
"""

from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel, Field


class AssetSchema(BaseModel):
    id: str
    name: str
    asset_type: str = "server"
    criticality: float = 5.0
    vulnerability_score: float = Field(default=0.5, alias="vulnerability")
    x: Optional[float] = 0.0
    y: Optional[float] = 0.0
    compromised: bool = False
    defense_controls: list[str] = Field(default_factory=list)

    class Config:
        populate_by_name = True


class ConnectionSchema(BaseModel):
    id: str
    source: str
    target: str
    protocol: Optional[str] = "TCP"
    port: Optional[int] = 443
    encrypted: Optional[bool] = True


class NetworkSchema(BaseModel):
    id: str
    name: str = "Corporate Enterprise Network"
    assets: list[AssetSchema] = Field(default_factory=list)
    connections: list[ConnectionSchema] = Field(default_factory=list)
    created_at: Optional[str] = None


class SyntheticNetworkRequest(BaseModel):
    num_assets: int = 12
    connectivity: float = 0.3
    seed: int = 42


class VulnerabilitySchema(BaseModel):
    id: str
    cve_id: Optional[str] = None
    name: str
    description: str
    severity: str = "medium"
    cvss_score: float = 5.0
    asset_id: str
    asset_name: Optional[str] = None
    exploitability: float = 0.5
    impact: float = 5.0
    remediation: Optional[str] = None


class ThreatIntelSchema(BaseModel):
    vulnerabilities: list[VulnerabilitySchema] = Field(default_factory=list)
    risk_distribution: dict[str, int] = Field(default_factory=dict)
    top_exposed_assets: list[AssetSchema] = Field(default_factory=list)


class AttackEventSchema(BaseModel):
    id: str
    timestamp: float
    stage: str
    source_asset_id: Optional[str] = None
    target_asset_id: str
    technique: str
    description: str
    success: bool
    impact_score: float
    details: Optional[dict[str, Any]] = None
    technical_explanation: Optional[str] = None
    plain_explanation: Optional[str] = None
    why_it_matters: Optional[str] = None


class AttackScenarioSchema(BaseModel):
    id: str
    name: str
    description: str
    events: list[AttackEventSchema] = Field(default_factory=list)
    total_impact: float = 0.0
    duration_seconds: float = 0.0
    attack_paths: list[list[str]] = Field(default_factory=list)
    created_at: Optional[str] = None


class SimulateAttackRequest(BaseModel):
    network_id: Optional[str] = "net-default"
    scenario_type: Optional[str] = "ransomware"
    seed: Optional[int] = 42


class DefensiveControlSchema(BaseModel):
    id: str
    name: str
    description: str
    cost: float
    risk_reduction: float
    asset_coverage: list[str] = Field(default_factory=lambda: ["all"])
    category: str = "network"
    confidence: float = 0.90


class OptimizationRequest(BaseModel):
    budget: float
    algorithm: Optional[str] = "branch_and_bound_dfs"
    control_ids: Optional[list[str]] = None
    items: Optional[list[dict[str, Any]]] = None


class OptimizationResultSchema(BaseModel):
    algorithm: str
    budget: float
    total_cost: float
    total_value: float
    selected_items: list[dict[str, Any]] = Field(default_factory=list)
    decision_vector: list[int] = Field(default_factory=list)
    baseline_risk: float = 0.0
    residual_risk: float = 0.0
    risk_reduction_pct: float = 0.0
    runtime_ms: float = 0.0
    nodes_explored: int = 0
    is_optimal: bool = True
    optimality_gap_pct: float = 0.0


class AlgorithmExecuteRequest(BaseModel):
    items: list[dict[str, Any]]
    budget: float
    algorithm: Optional[str] = "branch_and_bound_dfs"


class AlgorithmCompareRequest(BaseModel):
    items: list[dict[str, Any]]
    budget: float
    algorithms: Optional[list[str]] = None


class BenchmarkConfigRequest(BaseModel):
    algorithms: Optional[list[str]] = Field(
        default_factory=lambda: ["brute_force", "greedy", "branch_and_bound_dfs"]
    )
    sizes: Optional[list[int]] = Field(default_factory=lambda: [4, 6, 8, 10, 12, 14])
    budget_ratio: Optional[float] = 0.5
    trials: Optional[int] = 3
    seed: Optional[int] = 42


class ReportGenerateRequest(BaseModel):
    type: str  # 'incident' | 'optimization' | 'benchmark'
    scenario_id: Optional[str] = None
    network_id: Optional[str] = None
    algorithm: Optional[str] = None
    budget: Optional[float] = None
