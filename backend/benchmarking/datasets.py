"""
Synthetic and reproducible dataset generators for BRACE benchmarking.

Generates reproducible Knapsack instances for testing and comparing
Brute Force, Greedy, and Branch & Bound algorithms.
"""

from __future__ import annotations

import random
from typing import Any

from backend.algorithms.brute_force import KnapsackItem


DEFENSE_NAMES = [
    "Firewall Layer 7", "EDR Telemetry", "SIEM Log Collector", "Network Micro-VLAN",
    "Zero Trust IAM", "Database Encryptor", "Air-Gapped Backup", "Automated Patching",
    "WAF Shield", "Anti-Phishing Filter", "DLP Policy Engine", "IDS Sniffer",
    "Honeypot Decoy", "Privileged PAM", "Threat Feed Connector", "Container Scanner",
    "DNS Security Sinkhole", "API Security Gateway", "CASB Policy Broker", "SOAR Orchestrator",
    "SBOM Vulnerability Tracker", "Hardware HSM Module", "Darkweb Threat Monitor", "TLS Decryption Proxy",
]

CATEGORIES = ["Perimeter", "Endpoint", "Network", "Identity", "Data", "Operations"]


def generate_dataset(
    n_items: int,
    seed: int = 42,
    cost_range: tuple[float, float] = (10.0, 100.0),
    value_range: tuple[float, float] = (15.0, 120.0),
) -> list[KnapsackItem]:
    """Generate a reproducible list of KnapsackItems using random seed."""
    rng = random.Random(seed)
    items: list[KnapsackItem] = []

    for i in range(n_items):
        name_idx = i % len(DEFENSE_NAMES)
        suffix = f" #{i // len(DEFENSE_NAMES) + 1}" if i >= len(DEFENSE_NAMES) else ""
        name = f"{DEFENSE_NAMES[name_idx]}{suffix}"

        cost = round(rng.uniform(cost_range[0], cost_range[1]), 1)
        value = round(rng.uniform(value_range[0], value_range[1]), 1)
        cat = rng.choice(CATEGORIES)

        items.append(
            KnapsackItem(
                id=i + 1,
                name=name,
                cost=cost,
                value=value,
                description=f"Automated benchmark security control item {i + 1}",
                category=cat,
            )
        )

    return items


def generate_greedy_suboptimal_dataset() -> tuple[list[KnapsackItem], float]:
    """Generate a deterministic dataset where Greedy is strictly suboptimal.

    Classic 0/1 Knapsack counterexample:
    Item 1: Cost 10, Value 15 -> Ratio = 1.5
    Item 2: Cost 20, Value 24 -> Ratio = 1.2
    Item 3: Cost 30, Value 36 -> Ratio = 1.2
    Budget = 50.

    Greedy selects:
      Item 1 (Cost 10, Value 15, Rem 40)
      Item 2 (Cost 20, Value 24, Rem 20)
      Item 3 cannot fit (cost 30 > 20).
      Greedy total: Value = 39, Cost = 30.

    Optimal (Branch & Bound / Brute Force):
      Item 2 + Item 3 (Cost 20 + 30 = 50 <= 50)
      Optimal total: Value = 24 + 36 = 60, Cost = 50.

    Optimality gap: (60 - 39) / 60 = 35% gap!
    """
    items = [
        KnapsackItem(id=1, name="High-Ratio Lightweight Sensor", cost=10.0, value=15.0, category="Perimeter"),
        KnapsackItem(id=2, name="High-Value Core SIEM", cost=20.0, value=24.0, category="Operations"),
        KnapsackItem(id=3, name="Enterprise EDR Platform", cost=30.0, value=36.0, category="Endpoint"),
    ]
    budget = 50.0
    return items, budget


def generate_benchmark_suite(
    sizes: list[int] | None = None,
    seed: int = 1337,
) -> dict[int, list[KnapsackItem]]:
    """Generate a suite of test datasets for input sizes [4, 6, 8, 10, 12, 14, 16, 18, 20]."""
    if sizes is None:
        sizes = [4, 6, 8, 10, 12, 14, 16, 18, 20]

    suite: dict[int, list[KnapsackItem]] = {}
    for sz in sizes:
        suite[sz] = generate_dataset(sz, seed=seed + sz)

    return suite


def generate_edge_cases() -> dict[str, tuple[list[KnapsackItem], float]]:
    """Return dictionary of critical boundary test cases."""
    return {
        "empty_items": ([], 100.0),
        "zero_budget": (
            [KnapsackItem(id=1, name="Firewall", cost=20.0, value=30.0)],
            0.0,
        ),
        "single_item_fits": (
            [KnapsackItem(id=1, name="EDR", cost=15.0, value=25.0)],
            20.0,
        ),
        "single_item_exceeds": (
            [KnapsackItem(id=1, name="EDR", cost=50.0, value=25.0)],
            20.0,
        ),
        "all_items_affordable": (
            [
                KnapsackItem(id=1, name="Tool A", cost=10.0, value=20.0),
                KnapsackItem(id=2, name="Tool B", cost=15.0, value=30.0),
            ],
            100.0,
        ),
        "equal_ratios": (
            [
                KnapsackItem(id=1, name="Control 1", cost=10.0, value=20.0),
                KnapsackItem(id=2, name="Control 2", cost=20.0, value=40.0),
                KnapsackItem(id=3, name="Control 3", cost=30.0, value=60.0),
            ],
            35.0,
        ),
    }
