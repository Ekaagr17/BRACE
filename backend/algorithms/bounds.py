"""
Upper bound computation for Branch and Bound algorithms.

Implements the fractional knapsack relaxation to compute tight upper bounds
on the optimal 0/1 knapsack solution. Items are assumed sorted by value/cost
ratio in descending order.

Mathematical formulation:
    UB = current_value + Σ(vi for fully fitting items) + fraction * v_partial
    where fraction = remaining_capacity / cost_of_partial_item
"""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from backend.algorithms.brute_force import KnapsackItem


def fractional_knapsack_bound(
    items: list[KnapsackItem],
    capacity: float,
    current_value: float,
    current_weight: float,
    level: int,
) -> float:
    """Compute upper bound using fractional knapsack relaxation.

    Starting from the given level, greedily adds items by value/cost ratio.
    When an item doesn't fully fit, takes a fractional portion to fill
    the remaining capacity exactly. This gives a valid upper bound on
    the optimal 0/1 knapsack value for the remaining subproblem.

    Items MUST be pre-sorted by value/cost ratio in descending order
    (with ties broken by item id ascending for determinism).

    Args:
        items: List of KnapsackItem sorted by value/cost ratio descending.
        capacity: Total budget/capacity constraint.
        current_value: Value accumulated from decisions already made.
        current_weight: Cost/weight accumulated from decisions already made.
        level: Index in items list from which to start considering items.

    Returns:
        Upper bound on the best achievable value from this state.
        Returns current_value if no remaining capacity or no remaining items.

    Raises:
        ValueError: If capacity is negative.
    """
    if capacity < 0:
        raise ValueError(f"Capacity must be non-negative, got {capacity}")

    remaining_capacity = capacity - current_weight

    # If we've already exceeded capacity, this node is infeasible
    if remaining_capacity < 0:
        return 0.0

    # If no remaining capacity, can't add anything
    if remaining_capacity <= 1e-12:
        return current_value

    bound = current_value
    total_weight = current_weight

    for i in range(level, len(items)):
        item = items[i]

        # Handle zero-cost items: they're free, always include them
        if item.cost <= 0:
            bound += item.value
            continue

        if total_weight + item.cost <= capacity:
            # Item fits entirely — include it fully
            bound += item.value
            total_weight += item.cost
        else:
            # Item doesn't fit entirely — take fractional portion
            remaining = capacity - total_weight
            fraction = remaining / item.cost
            bound += item.value * fraction
            break  # Capacity exhausted after fractional item

    return bound


def compute_value_cost_ratio(item: KnapsackItem) -> float:
    """Compute the value-to-cost ratio for an item.

    Args:
        item: A KnapsackItem instance.

    Returns:
        value/cost ratio. Returns float('inf') for zero-cost items (they're free).
    """
    if item.cost <= 0:
        return float("inf")
    return item.value / item.cost


def sort_items_by_ratio(items: list[KnapsackItem]) -> list[KnapsackItem]:
    """Sort items by value/cost ratio descending, with deterministic tie-breaking.

    Tie-breaking: when two items have the same value/cost ratio,
    the item with the smaller id comes first (ascending id).

    Args:
        items: List of KnapsackItem to sort.

    Returns:
        New sorted list (original is not modified).
    """
    return sorted(
        items,
        key=lambda item: (-compute_value_cost_ratio(item), item.id),
    )
