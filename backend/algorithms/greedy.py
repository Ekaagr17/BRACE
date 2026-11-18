"""
Greedy solver for the 0/1 Knapsack problem.

Sorts items by value/cost ratio in descending order and greedily selects
items that fit within the budget. Runs in O(n log n) time due to sorting.

The greedy approach does NOT guarantee an optimal solution for the 0/1
knapsack problem — it can produce suboptimal results, especially when
high-ratio items have small values compared to low-ratio items with large values.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from backend.algorithms.bounds import compute_value_cost_ratio
from backend.algorithms.brute_force import KnapsackItem
from backend.algorithms.metrics import (
    ExecutionMetrics,
    ExecutionTrace,
    HighResTimer,
    NodeStatus,
    TraceStep,
)


@dataclass
class GreedySelectionStep:
    """Record of a single greedy selection decision.

    Attributes:
        item: The item being considered.
        ratio: Value/cost ratio.
        selected: Whether the item was selected.
        reason: Why the item was selected or rejected.
        remaining_budget: Budget remaining after this decision.
        cumulative_value: Cumulative value after this decision.
        cumulative_cost: Cumulative cost after this decision.
    """
    item: KnapsackItem
    ratio: float
    selected: bool
    reason: str
    remaining_budget: float
    cumulative_value: float
    cumulative_cost: float


@dataclass
class GreedyResult:
    """Result from the greedy knapsack solver.

    Attributes:
        total_value: Total value of selected items.
        total_cost: Total cost of selected items.
        selected_items: List of selected items.
        decision_vector: Binary vector [x1, x2, ..., xn] in ORIGINAL item order.
        sorted_order: Items in the order they were considered (by ratio).
        selection_decisions: Detailed record of each selection decision.
        metrics: Performance counters.
        trace: Full execution trace.
    """
    total_value: float = 0.0
    total_cost: float = 0.0
    selected_items: list[KnapsackItem] = field(default_factory=list)
    decision_vector: list[int] = field(default_factory=list)
    sorted_order: list[KnapsackItem] = field(default_factory=list)
    selection_decisions: list[GreedySelectionStep] = field(default_factory=list)
    metrics: ExecutionMetrics = field(default_factory=ExecutionMetrics)
    trace: ExecutionTrace = field(default_factory=ExecutionTrace)


class GreedySolver:
    """Greedy heuristic solver for the 0/1 Knapsack problem.

    Strategy: sort items by value/cost ratio descending (ties broken by
    ascending item id for determinism), then greedily include each item
    if it fits within the remaining budget.

    Time complexity: O(n log n) for sorting + O(n) for selection = O(n log n).
    """

    def solve(self, items: list[KnapsackItem], budget: float) -> GreedyResult:
        """Solve the 0/1 knapsack problem using the greedy heuristic.

        Args:
            items: List of KnapsackItem instances.
            budget: Maximum total cost (capacity constraint B).

        Returns:
            GreedyResult with the greedy solution (may be suboptimal).

        Raises:
            ValueError: If budget is negative.
        """
        if budget < 0:
            raise ValueError(f"Budget must be non-negative, got {budget}")

        n = len(items)
        result = GreedyResult()
        result.trace.algorithm = "greedy"
        result.decision_vector = [0] * n

        with HighResTimer() as timer:
            # Sort by value/cost ratio descending, tie-break by id ascending
            sorted_items = sorted(
                items,
                key=lambda item: (-compute_value_cost_ratio(item), item.id),
            )
            result.sorted_order = list(sorted_items)

            remaining_budget = budget
            cumulative_value = 0.0
            cumulative_cost = 0.0
            selected: list[KnapsackItem] = []
            node_id_counter = 0

            # Step 0: initial state
            node_id_counter += 1
            result.trace.add_step(TraceStep(
                level=0,
                action="initialize",
                node_id=node_id_counter,
                cost=0.0,
                value=0.0,
                decision_path=[],
                status=NodeStatus.EXPLORING,
                explanation=f"Starting greedy selection with budget={budget:.1f}, {n} items sorted by value/cost ratio.",
                remaining_budget=budget,
            ))

            for rank, item in enumerate(sorted_items):
                ratio = compute_value_cost_ratio(item)
                node_id_counter += 1

                if item.cost <= remaining_budget:
                    # Select this item
                    selected.append(item)
                    remaining_budget -= item.cost
                    cumulative_value += item.value
                    cumulative_cost += item.cost

                    # Update decision vector in original order
                    orig_idx = next(i for i, it in enumerate(items) if it.id == item.id)
                    result.decision_vector[orig_idx] = 1

                    reason = (
                        f"cost={item.cost:.1f} ≤ remaining={remaining_budget + item.cost:.1f}, SELECTED"
                    )
                    status = NodeStatus.FEASIBLE

                    step = GreedySelectionStep(
                        item=item,
                        ratio=ratio,
                        selected=True,
                        reason=reason,
                        remaining_budget=remaining_budget,
                        cumulative_value=cumulative_value,
                        cumulative_cost=cumulative_cost,
                    )
                else:
                    reason = (
                        f"cost={item.cost:.1f} > remaining={remaining_budget:.1f}, REJECTED"
                    )
                    status = NodeStatus.PRUNED_INFEASIBLE

                    step = GreedySelectionStep(
                        item=item,
                        ratio=ratio,
                        selected=False,
                        reason=reason,
                        remaining_budget=remaining_budget,
                        cumulative_value=cumulative_value,
                        cumulative_cost=cumulative_cost,
                    )

                result.selection_decisions.append(step)

                ratio_str = f"{ratio:.4f}" if ratio != float("inf") else "∞"
                explanation = (
                    f"Item '{item.name}' (id={item.id}): ratio={ratio_str}, {reason}. "
                    f"Cumulative: value={cumulative_value:.1f}, cost={cumulative_cost:.1f}"
                )

                result.trace.add_step(TraceStep(
                    level=rank + 1,
                    action="greedy_select" if step.selected else "greedy_reject",
                    node_id=node_id_counter,
                    cost=cumulative_cost,
                    value=cumulative_value,
                    decision_path=list(result.decision_vector),
                    status=status,
                    explanation=explanation,
                    is_feasible=True,
                    best_value_so_far=cumulative_value,
                    item_name=item.name,
                    remaining_budget=remaining_budget,
                ))

        result.total_value = cumulative_value
        result.total_cost = cumulative_cost
        result.selected_items = selected

        metrics = ExecutionMetrics()
        metrics.execution_time_ms = timer.elapsed_ms
        metrics.memory_bytes = timer.peak_memory_bytes
        metrics.nodes_generated = n
        metrics.nodes_expanded = n
        metrics.feasible_subsets = 1  # The greedy solution itself
        result.metrics = metrics

        result.trace.summary = (
            f"Greedy selected {len(selected)}/{n} items by value/cost ratio. "
            f"Total value={cumulative_value:.2f}, cost={cumulative_cost:.2f}, "
            f"remaining budget={remaining_budget:.2f}."
        )

        return result
