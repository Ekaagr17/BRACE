"""
Attack simulation engine for BRACE.

Simulates multi-stage cyber attacks on virtual networks, propagating
through network graph edges with probability based on vulnerability
scores, exposure, and security controls.

Supports attack types: external_breach, insider_threat, ransomware, apt.
"""

from __future__ import annotations

import random
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Any

from backend.simulation.network_builder import AssetType, NetworkAsset, VirtualNetwork


class AttackStage(str, Enum):
    """Stages of a cyber attack following the kill chain."""
    RECONNAISSANCE = "reconnaissance"
    INITIAL_ACCESS = "initial_access"
    EXPLOITATION = "exploitation"
    LATERAL_MOVEMENT = "lateral_movement"
    OBJECTIVE = "objective"
    DETECTION = "detection"
    CONTAINMENT = "containment"


class AttackType(str, Enum):
    """Types of attack scenarios."""
    EXTERNAL_BREACH = "external_breach"
    INSIDER_THREAT = "insider_threat"
    RANSOMWARE = "ransomware"
    APT = "apt"


@dataclass
class AttackEvent:
    """A single event in the attack simulation timeline.

    Attributes:
        timestamp: When the event occurred (simulated time).
        stage: Kill chain stage.
        source_asset_id: Asset where the attack originates from (or None for initial).
        target_asset_id: Asset being targeted.
        event_type: Specific type of event (e.g., 'port_scan', 'exploit_cve').
        severity: Severity from 1 (info) to 10 (critical).
        evidence: Observable evidence left by this event.
        state_before: Relevant state before the event.
        state_after: Relevant state after the event.
        technical_explanation: Detailed technical description.
        plain_explanation: Plain-language description for non-technical audiences.
        why_it_matters: Explanation of the significance and impact.
        success: Whether the attack step succeeded.
    """
    timestamp: str
    stage: AttackStage
    source_asset_id: str | None
    target_asset_id: str
    event_type: str
    severity: int
    evidence: list[str] = field(default_factory=list)
    state_before: dict[str, Any] = field(default_factory=dict)
    state_after: dict[str, Any] = field(default_factory=dict)
    technical_explanation: str = ""
    plain_explanation: str = ""
    why_it_matters: str = ""
    success: bool = True

    def to_dict(self) -> dict[str, Any]:
        """Serialize to dictionary."""
        return {
            "timestamp": self.timestamp,
            "stage": self.stage.value,
            "source_asset_id": self.source_asset_id,
            "target_asset_id": self.target_asset_id,
            "event_type": self.event_type,
            "severity": self.severity,
            "evidence": list(self.evidence),
            "state_before": dict(self.state_before),
            "state_after": dict(self.state_after),
            "technical_explanation": self.technical_explanation,
            "plain_explanation": self.plain_explanation,
            "why_it_matters": self.why_it_matters,
            "success": self.success,
        }


@dataclass
class AttackScenario:
    """Definition of an attack scenario to simulate.

    Attributes:
        id: Unique identifier.
        name: Human-readable name.
        description: Description of the attack scenario.
        attack_type: Type of attack.
        stages: Kill chain stages involved.
        initial_target_types: Asset types targeted for initial access.
        objective_target_types: Asset types that are the final objective.
    """
    id: str
    name: str
    description: str
    attack_type: AttackType
    stages: list[AttackStage] = field(default_factory=list)
    initial_target_types: list[AssetType] = field(default_factory=list)
    objective_target_types: list[AssetType] = field(default_factory=list)


@dataclass
class AttackResult:
    """Result of an attack simulation.

    Attributes:
        id: Unique result identifier.
        scenario: The scenario that was simulated.
        events: Ordered list of attack events.
        compromised_assets: IDs of assets compromised during the attack.
        total_risk_impact: Sum of risk scores of compromised assets.
        attack_succeeded: Whether the attacker reached their objective.
        detection_time_index: Index in events where detection occurred (-1 if undetected).
        duration_simulated_hours: Simulated duration of the attack.
    """
    id: str = ""
    scenario: AttackScenario | None = None
    events: list[AttackEvent] = field(default_factory=list)
    compromised_assets: list[str] = field(default_factory=list)
    total_risk_impact: float = 0.0
    attack_succeeded: bool = False
    detection_time_index: int = -1
    duration_simulated_hours: float = 0.0

    def to_dict(self) -> dict[str, Any]:
        """Serialize to dictionary."""
        return {
            "id": self.id,
            "scenario": {
                "id": self.scenario.id if self.scenario else "",
                "name": self.scenario.name if self.scenario else "",
                "description": self.scenario.description if self.scenario else "",
                "attack_type": self.scenario.attack_type.value if self.scenario else "",
            },
            "events": [e.to_dict() for e in self.events],
            "compromised_assets": list(self.compromised_assets),
            "total_risk_impact": self.total_risk_impact,
            "attack_succeeded": self.attack_succeeded,
            "detection_time_index": self.detection_time_index,
            "duration_simulated_hours": self.duration_simulated_hours,
        }


# Pre-defined attack scenarios
SCENARIOS: dict[AttackType, AttackScenario] = {
    AttackType.EXTERNAL_BREACH: AttackScenario(
        id="scenario_external_breach",
        name="External Network Breach",
        description="An external attacker exploits internet-facing assets to gain access, then pivots internally to reach high-value targets.",
        attack_type=AttackType.EXTERNAL_BREACH,
        stages=[
            AttackStage.RECONNAISSANCE, AttackStage.INITIAL_ACCESS,
            AttackStage.EXPLOITATION, AttackStage.LATERAL_MOVEMENT,
            AttackStage.OBJECTIVE, AttackStage.DETECTION,
        ],
        initial_target_types=[AssetType.FIREWALL, AssetType.SERVER],
        objective_target_types=[AssetType.DATABASE, AssetType.SERVER],
    ),
    AttackType.INSIDER_THREAT: AttackScenario(
        id="scenario_insider_threat",
        name="Insider Threat",
        description="A malicious insider with workstation access escalates privileges and exfiltrates data from databases.",
        attack_type=AttackType.INSIDER_THREAT,
        stages=[
            AttackStage.INITIAL_ACCESS, AttackStage.EXPLOITATION,
            AttackStage.LATERAL_MOVEMENT, AttackStage.OBJECTIVE,
            AttackStage.DETECTION,
        ],
        initial_target_types=[AssetType.WORKSTATION],
        objective_target_types=[AssetType.DATABASE],
    ),
    AttackType.RANSOMWARE: AttackScenario(
        id="scenario_ransomware",
        name="Ransomware Attack",
        description="Ransomware enters via phishing, encrypts workstations and servers, and demands payment.",
        attack_type=AttackType.RANSOMWARE,
        stages=[
            AttackStage.INITIAL_ACCESS, AttackStage.EXPLOITATION,
            AttackStage.LATERAL_MOVEMENT, AttackStage.OBJECTIVE,
            AttackStage.DETECTION, AttackStage.CONTAINMENT,
        ],
        initial_target_types=[AssetType.WORKSTATION],
        objective_target_types=[AssetType.SERVER, AssetType.DATABASE, AssetType.WORKSTATION],
    ),
    AttackType.APT: AttackScenario(
        id="scenario_apt",
        name="Advanced Persistent Threat",
        description="A sophisticated, multi-stage attack that maintains long-term presence while slowly exfiltrating data.",
        attack_type=AttackType.APT,
        stages=[
            AttackStage.RECONNAISSANCE, AttackStage.INITIAL_ACCESS,
            AttackStage.EXPLOITATION, AttackStage.LATERAL_MOVEMENT,
            AttackStage.OBJECTIVE, AttackStage.DETECTION,
            AttackStage.CONTAINMENT,
        ],
        initial_target_types=[AssetType.SERVER, AssetType.WORKSTATION],
        objective_target_types=[AssetType.DATABASE],
    ),
}


class AttackSimulator:
    """Simulates cyber attacks on virtual networks.

    Propagates attacks through the network graph, with success probability
    at each hop determined by the target asset's vulnerability score,
    exposure, and security controls.
    """

    def simulate(
        self,
        network: VirtualNetwork,
        scenario: AttackScenario | None = None,
        attack_type: AttackType = AttackType.EXTERNAL_BREACH,
        seed: int = 42,
    ) -> AttackResult:
        """Simulate an attack on the given network.

        Args:
            network: The VirtualNetwork to attack.
            scenario: Optional specific scenario. If None, uses attack_type to pick one.
            attack_type: Type of attack to simulate (used if scenario is None).
            seed: Random seed for reproducibility.

        Returns:
            AttackResult with ordered timeline of events.
        """
        rng = random.Random(seed)

        if scenario is None:
            scenario = SCENARIOS[attack_type]

        result = AttackResult(
            id=str(uuid.uuid4()),
            scenario=scenario,
        )

        assets = network.get_all_assets()
        if not assets:
            return result

        base_time = datetime(2024, 6, 15, 2, 30, 0, tzinfo=timezone.utc)
        event_time = base_time
        compromised: set[str] = set()
        detected = False
        event_index = 0

        # Find initial targets based on scenario
        initial_candidates = [
            a for a in assets
            if a.asset_type in scenario.initial_target_types
        ]
        if not initial_candidates:
            initial_candidates = list(assets)

        objective_candidates = [
            a for a in assets
            if a.asset_type in scenario.objective_target_types
        ]
        if not objective_candidates:
            objective_candidates = [
                a for a in assets
                if a.criticality >= 7
            ]
        if not objective_candidates:
            objective_candidates = list(assets)

        for stage in scenario.stages:
            if detected and stage not in (AttackStage.DETECTION, AttackStage.CONTAINMENT):
                continue

            if stage == AttackStage.RECONNAISSANCE:
                event_time += timedelta(minutes=rng.randint(5, 30))
                target = rng.choice(initial_candidates)

                event = AttackEvent(
                    timestamp=event_time.isoformat(),
                    stage=stage,
                    source_asset_id=None,
                    target_asset_id=target.id,
                    event_type="port_scan",
                    severity=2,
                    evidence=[
                        f"SYN scan detected on {target.name}",
                        "Multiple ports probed in sequence",
                        "Source IP from external range",
                    ],
                    state_before={"target_compromised": target.compromised},
                    state_after={"target_compromised": target.compromised},
                    technical_explanation=(
                        f"Attacker performed a TCP SYN scan on {target.name} "
                        f"({target.asset_type.value}), probing ports 22, 80, 443, 3389, 8080. "
                        f"This reveals open services and potential entry points."
                    ),
                    plain_explanation=(
                        f"An attacker scanned {target.name} to find open doors into the network, "
                        f"like checking which windows in a building are unlocked."
                    ),
                    why_it_matters=(
                        f"Reconnaissance reveals the network's attack surface. "
                        f"{target.name} has vulnerability score {target.vulnerability_score:.2f}, "
                        f"making it a viable entry point."
                    ),
                    success=True,
                )
                result.events.append(event)

                # Also scan for network mapping
                event_time += timedelta(minutes=rng.randint(2, 10))
                event = AttackEvent(
                    timestamp=event_time.isoformat(),
                    stage=stage,
                    source_asset_id=None,
                    target_asset_id=target.id,
                    event_type="network_enumeration",
                    severity=3,
                    evidence=[
                        "ICMP sweep detected across subnet",
                        "DNS zone transfer attempted",
                    ],
                    state_before={},
                    state_after={"network_mapped": True},
                    technical_explanation=(
                        f"Attacker enumerated the network topology around {target.name}, "
                        f"identifying {len(network.get_neighbors(target.id))} connected assets."
                    ),
                    plain_explanation=(
                        "The attacker mapped out which computers and servers are connected "
                        "to each other, building a blueprint of the network."
                    ),
                    why_it_matters=(
                        "Network mapping allows the attacker to plan lateral movement "
                        "paths toward high-value targets."
                    ),
                    success=True,
                )
                result.events.append(event)

            elif stage == AttackStage.INITIAL_ACCESS:
                event_time += timedelta(minutes=rng.randint(10, 60))
                target = rng.choice(initial_candidates)

                # Success probability based on vulnerability and exposure
                success_prob = target.vulnerability_score * target.exposure
                # Reduce probability if security controls are present
                control_factor = max(0.1, 1.0 - 0.15 * len(target.security_controls))
                success_prob *= control_factor
                success = rng.random() < max(0.3, success_prob)

                if scenario.attack_type == AttackType.INSIDER_THREAT:
                    event_type = "credential_use"
                    evidence_list = [
                        f"Login to {target.name} with valid credentials",
                        "Access from internal IP during off-hours",
                    ]
                    tech_exp = (
                        f"Insider used legitimate credentials to access {target.name}. "
                        f"Authentication succeeded without triggering brute-force detection."
                    )
                    plain_exp = (
                        f"An employee with access to {target.name} logged in, "
                        f"but with malicious intent."
                    )
                    success = True  # Insiders always succeed at initial access
                else:
                    event_type = "exploit_vulnerability"
                    evidence_list = [
                        f"Exploit payload sent to {target.name}",
                        f"Vulnerability CVE-2024-{rng.randint(10000, 99999)} targeted",
                        "Anomalous process spawned post-exploitation",
                    ]
                    tech_exp = (
                        f"Attacker exploited a vulnerability (CVSS: {target.vulnerability_score * 10:.1f}) "
                        f"on {target.name} ({target.asset_type.value}). "
                        f"Exposure level: {target.exposure:.2f}."
                    )
                    plain_exp = (
                        f"The attacker found and exploited a security flaw in {target.name} "
                        f"to gain initial access to the network."
                    )

                event = AttackEvent(
                    timestamp=event_time.isoformat(),
                    stage=stage,
                    source_asset_id=None,
                    target_asset_id=target.id,
                    event_type=event_type,
                    severity=7 if success else 4,
                    evidence=evidence_list,
                    state_before={"target_compromised": False},
                    state_after={"target_compromised": success},
                    technical_explanation=tech_exp,
                    plain_explanation=plain_exp,
                    why_it_matters=(
                        f"{'Initial access established!' if success else 'Initial access failed.'} "
                        f"{'The attacker now has a foothold in the network.' if success else 'The attacker may try again with a different approach.'}"
                    ),
                    success=success,
                )
                result.events.append(event)

                if success:
                    compromised.add(target.id)
                    target.compromised = True

            elif stage == AttackStage.EXPLOITATION:
                if not compromised:
                    continue

                event_time += timedelta(minutes=rng.randint(15, 120))
                source_id = rng.choice(list(compromised))
                source = network.get_asset(source_id)

                event_type_choices = [
                    "privilege_escalation", "credential_harvesting",
                    "persistence_mechanism", "defense_evasion",
                ]
                event_type = rng.choice(event_type_choices)

                event = AttackEvent(
                    timestamp=event_time.isoformat(),
                    stage=stage,
                    source_asset_id=source_id,
                    target_asset_id=source_id,
                    event_type=event_type,
                    severity=6,
                    evidence=[
                        f"{event_type.replace('_', ' ').title()} on {source.name}",
                        "Suspicious process activity detected",
                        "Registry/crontab modifications observed",
                    ],
                    state_before={"privilege_level": "user"},
                    state_after={"privilege_level": "admin"},
                    technical_explanation=(
                        f"Attacker performed {event_type.replace('_', ' ')} on {source.name}. "
                        f"Elevated from user to admin privileges using local exploit."
                    ),
                    plain_explanation=(
                        f"The attacker upgraded their access on {source.name} from "
                        f"a regular user to an administrator, giving them full control."
                    ),
                    why_it_matters=(
                        "With elevated privileges, the attacker can access sensitive data, "
                        "modify security settings, and move to other systems."
                    ),
                    success=True,
                )
                result.events.append(event)

            elif stage == AttackStage.LATERAL_MOVEMENT:
                if not compromised:
                    continue

                # Try to move to neighbors of compromised assets
                max_hops = rng.randint(1, min(4, len(assets)))
                for _hop in range(max_hops):
                    source_id = rng.choice(list(compromised))
                    neighbors = network.get_neighbors(source_id)
                    uncompromised_neighbors = [
                        n for n in neighbors if n.id not in compromised
                    ]

                    if not uncompromised_neighbors:
                        continue

                    target = rng.choice(uncompromised_neighbors)
                    event_time += timedelta(minutes=rng.randint(20, 180))

                    # Probability of successful lateral movement
                    move_prob = target.vulnerability_score * (1.0 - 0.15 * len(target.security_controls))
                    success = rng.random() < max(0.2, move_prob)

                    if scenario.attack_type == AttackType.RANSOMWARE:
                        event_type = "ransomware_spread"
                        tech_exp = (
                            f"Ransomware propagated from {network.get_asset(source_id).name} "
                            f"to {target.name} via SMB/RPC. "
                            f"{'Encryption payload deployed.' if success else 'Blocked by endpoint protection.'}"
                        )
                    else:
                        event_type = "lateral_pivot"
                        tech_exp = (
                            f"Attacker pivoted from {network.get_asset(source_id).name} "
                            f"to {target.name} using harvested credentials. "
                            f"{'Access gained.' if success else 'Authentication failed.'}"
                        )

                    event = AttackEvent(
                        timestamp=event_time.isoformat(),
                        stage=stage,
                        source_asset_id=source_id,
                        target_asset_id=target.id,
                        event_type=event_type,
                        severity=8 if success else 5,
                        evidence=[
                            f"Network connection from {network.get_asset(source_id).name} to {target.name}",
                            f"{'Successful' if success else 'Failed'} authentication attempt",
                            "Unusual lateral traffic pattern",
                        ],
                        state_before={"target_compromised": False},
                        state_after={"target_compromised": success},
                        technical_explanation=tech_exp,
                        plain_explanation=(
                            f"The attacker {'successfully moved' if success else 'tried to move'} "
                            f"from {network.get_asset(source_id).name} to {target.name}."
                        ),
                        why_it_matters=(
                            f"{'The attack is spreading deeper into the network.' if success else 'Lateral movement was blocked, limiting the attack scope.'} "
                            f"Target criticality: {target.criticality}/10."
                        ),
                        success=success,
                    )
                    result.events.append(event)

                    if success:
                        compromised.add(target.id)
                        target.compromised = True

            elif stage == AttackStage.OBJECTIVE:
                if not compromised:
                    continue

                event_time += timedelta(minutes=rng.randint(30, 240))

                # Check if any objective targets are compromised
                reached_objectives = [
                    a for a in objective_candidates
                    if a.id in compromised
                ]

                if reached_objectives:
                    target = rng.choice(reached_objectives)
                    result.attack_succeeded = True

                    if scenario.attack_type == AttackType.RANSOMWARE:
                        event_type = "data_encryption"
                        tech_exp = (
                            f"Ransomware encrypted {target.name} ({target.asset_type.value}). "
                            f"All files encrypted with AES-256. Ransom note deployed."
                        )
                        plain_exp = (
                            f"The attacker locked all files on {target.name} with encryption "
                            f"and is demanding payment to unlock them."
                        )
                    else:
                        event_type = "data_exfiltration"
                        tech_exp = (
                            f"Attacker exfiltrated data from {target.name} ({target.asset_type.value}). "
                            f"Data compressed and sent to C2 server over HTTPS."
                        )
                        plain_exp = (
                            f"The attacker copied sensitive data from {target.name} "
                            f"and sent it to their own servers."
                        )
                else:
                    target = rng.choice(list(compromised))
                    target_asset = network.get_asset(target)
                    event_type = "objective_blocked"
                    tech_exp = (
                        f"Attacker attempted to reach objective targets but was unable to "
                        f"compromise {', '.join(a.name for a in objective_candidates[:3])}. "
                        f"Attack stalled at {target_asset.name}."
                    )
                    plain_exp = (
                        "The attacker was unable to reach their final target. "
                        "The attack was partially successful but did not achieve its full goal."
                    )

                event = AttackEvent(
                    timestamp=event_time.isoformat(),
                    stage=stage,
                    source_asset_id=rng.choice(list(compromised)) if compromised else None,
                    target_asset_id=target.id if isinstance(target, NetworkAsset) else target,
                    event_type=event_type,
                    severity=10 if result.attack_succeeded else 6,
                    evidence=[
                        "Large outbound data transfer detected" if event_type == "data_exfiltration" else "Encrypted files detected",
                        "C2 communication observed",
                    ],
                    state_before={"data_intact": True},
                    state_after={"data_intact": not result.attack_succeeded},
                    technical_explanation=tech_exp,
                    plain_explanation=plain_exp,
                    why_it_matters=(
                        f"{'CRITICAL: The attacker achieved their objective.' if result.attack_succeeded else 'The attack was contained before reaching its objective.'} "
                        f"Potential impact: criticality {target.criticality if isinstance(target, NetworkAsset) else 'N/A'}/10."
                    ),
                    success=result.attack_succeeded,
                )
                result.events.append(event)

            elif stage == AttackStage.DETECTION:
                event_time += timedelta(minutes=rng.randint(5, 60))

                # Detection probability increases with number of compromised assets
                detection_prob = min(0.95, 0.3 + 0.1 * len(compromised))
                detected = rng.random() < detection_prob

                if compromised:
                    trigger_asset_id = rng.choice(list(compromised))
                    trigger_asset = network.get_asset(trigger_asset_id)
                else:
                    trigger_asset = rng.choice(assets)
                    trigger_asset_id = trigger_asset.id

                event = AttackEvent(
                    timestamp=event_time.isoformat(),
                    stage=stage,
                    source_asset_id=None,
                    target_asset_id=trigger_asset_id,
                    event_type="ids_alert" if detected else "missed_detection",
                    severity=8 if detected else 3,
                    evidence=[
                        f"IDS alert triggered on {trigger_asset.name}" if detected else "No alerts generated",
                        "Anomalous behavior pattern detected" if detected else "Activity below detection threshold",
                    ],
                    state_before={"detected": False},
                    state_after={"detected": detected},
                    technical_explanation=(
                        f"{'SIEM correlation detected anomalous activity on ' + trigger_asset.name + '. Alert escalated to SOC.' if detected else 'Attack activity remained below detection thresholds. No alerts were generated.'}"
                    ),
                    plain_explanation=(
                        f"{'The security team detected the attack!' if detected else 'The attack went undetected by security systems.'}"
                    ),
                    why_it_matters=(
                        f"{'Detection enables incident response, limiting further damage.' if detected else 'Undetected attacks can persist for months, causing increasing damage.'}"
                    ),
                    success=detected,
                )
                result.events.append(event)

                if detected:
                    result.detection_time_index = len(result.events) - 1

            elif stage == AttackStage.CONTAINMENT:
                if not detected:
                    continue

                event_time += timedelta(minutes=rng.randint(15, 120))

                contained_count = 0
                for asset_id in list(compromised):
                    contain_prob = 0.7
                    if rng.random() < contain_prob:
                        contained_count += 1
                        asset = network.get_asset(asset_id)
                        asset.compromised = False

                event = AttackEvent(
                    timestamp=event_time.isoformat(),
                    stage=stage,
                    source_asset_id=None,
                    target_asset_id=rng.choice(list(compromised)) if compromised else assets[0].id,
                    event_type="incident_response",
                    severity=7,
                    evidence=[
                        f"Incident response initiated, {contained_count}/{len(compromised)} assets isolated",
                        "Forensic analysis underway",
                        "Affected systems quarantined",
                    ],
                    state_before={"compromised_count": len(compromised)},
                    state_after={"compromised_count": len(compromised) - contained_count},
                    technical_explanation=(
                        f"Incident response team isolated {contained_count} of "
                        f"{len(compromised)} compromised assets. Network segments quarantined."
                    ),
                    plain_explanation=(
                        f"The security team responded to the attack and isolated "
                        f"{contained_count} compromised systems to stop the spread."
                    ),
                    why_it_matters=(
                        f"Containment limits the blast radius. "
                        f"{len(compromised) - contained_count} assets may still be compromised."
                    ),
                    success=contained_count > 0,
                )
                result.events.append(event)

        # Compute final metrics
        result.compromised_assets = list(compromised)
        result.total_risk_impact = sum(
            network.get_asset(aid).current_risk
            for aid in compromised
            if aid in {a.id for a in assets}
        )
        result.duration_simulated_hours = (
            (event_time - base_time).total_seconds() / 3600.0
        )

        return result
