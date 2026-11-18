"""
Brute-force solver for the 0/1 Knapsack problem.

Exhaustively enumerates all 2^n subsets of items, evaluating each for
feasibility and optimality. Guaranteed to find the optimal solution but
runs in O(n * 2^n) time.

Mathematical formulation:
    Maximize Z = Σ(vi × xi) subject to Σ(ci × xi) ≤ B, xi ∈ {0,1}
"""

from __future__ import annotations

from dataclasses import dataclass, field

from backend.algorithms.metrics import (
    ExecutionMetrics,
    ExecutionTrace,
    HighResTimer,
    NodeStatus,
    TraceStep,
)


@dataclass
class KnapsackItem:
    """A single item for the 0/1 knapsack problem.

    Attributes:
        id: Unique integer identifier.
        name: Human-readable name.
        cost: Cost (weight) of the item. Must be >= 0.
        value: Value (profit) of the item. Must be >= 0.
        description: Optional description of the item.
        category: Optional category for grouping.
    """
    id: int
    name: str
    cost: float
    value: float
    description: str = ""
    category: str = ""

    def __post_init__(self) -> None:
        if self.cost < 0:
            raise ValueError(f"Item cost must be non-negative, got {self.cost} for item '{self.name}'")
        if self.value < 0:
            raise ValueError(f"Item value must be non-negative, got {self.value} for item '{self.name}'")


@dataclass
class BruteForceResult:
    """Result from the brute-force knapsack solver.

    Attributes:
        best_value: Optimal objective value Z*.
        best_cost: Total cost of the optimal solution.
        best_items: List of items in the optimal solution.
        best_decision_vector: Binary vector [x1, x2, ..., xn] for optimal solution.
        all_feasible_subsets: List of all feasible subsets found (each as list of item ids).
        metrics: Performance counters.
        trace: Full execution trace with every subset evaluation.
    """
    best_value: float = 0.0
    best_cost: float = 0.0
    best_items: list[KnapsackItem] = field(default_factory=list)
    best_decision_vector: list[int] = field(default_factory=list)
    all_feasible_subsets: list[dict] = field(default_factory=list)
    metrics: ExecutionMetrics = field(default_factory=ExecutionMetrics)
    trace: ExecutionTrace = field(default_factory=ExecutionTrace)


class BruteForceSolver:
    """Exhaustive enumeration solver for the 0/1 Knapsack problem.

    Enumerates all 2^n subsets, evaluates each for feasibility (total cost ≤ budget),
    and tracks the subset with maximum value among feasible solutions.

    For safety, refuses to solve instances with n > 20 items (2^20 = 1,048,576 subsets).
    """

    MAX_ITEMS = 20

    def solve(self, items: list[KnapsackItem], budget: float) -> BruteForceResult:
        """Solve the 0/1 knapsack problem by exhaustive enumeration.

        Args:
            items: List of KnapsackItem instances.
            budget: Maximum total cost (capacity constraint B).

        Returns:
            BruteForceResult with optimal solution and complete trace.

        Raises:
            ValueError: If n > MAX_ITEMS or budget is negative.
        """
        n = len(items)

        if budget < 0:
            raise ValueError(f"Budget must be non-negative, got {budget}")

        if n > self.MAX_ITEMS:
            raise ValueError(
                f"Brute force is limited to {self.MAX_ITEMS} items "
                f"(got {n}). Use branch-and-bound for larger instances."
            )

        result = BruteForceResult()
        result.trace.algorithm = "brute_force"
        metrics = ExecutionMetrics()
        total_subsets = 1 << n  # 2^n

        with HighResTimer() as timer:
            best_value = 0.0
            best_cost = 0.0
            best_mask = 0
            node_id_counter = 0

            for mask in range(total_subsets):
                metrics.subsets_examined += 1
                node_id_counter += 1

                # Compute the decision vector from the bitmask
                decision_vector = [(mask >> j) & 1 for j in range(n)]

                # Calculate total cost and value for this subset
                total_cost = 0.0
                total_value = 0.0
                subset_items: list[KnapsackItem] = []

                for j in range(n):
                    if decision_vector[j] == 1:
                        total_cost += items[j].cost
                        total_value += items[j].value
                        subset_items.append(items[j])

                is_feasible = total_cost <= budget
                is_better = is_feasible and total_value > best_value

                if is_feasible:
                    metrics.feasible_subsets += 1
                    result.all_feasible_subsets.append({
                        "mask": mask,
                        "items": [item.id for item in subset_items],
                        "cost": total_cost,
                        "value": total_value,
                    })
                else:
                    metrics.infeasible_subsets += 1

                if is_better:
                    best_value = total_value
                    best_cost = total_cost
                    best_mask = mask
                    metrics.incumbent_updates += 1

                # Build explanation
                item_names = [items[j].name for j in range(n) if decision_vector[j] == 1]
                if not item_names:
                    subset_desc = "empty set"
                else:
                    subset_desc = "{" + ", ".join(item_names) + "}"

                if not is_feasible:
                    status = NodeStatus.PRUNED_INFEASIBLE
                    explanation = (
                        f"Subset #{mask} = {subset_desc}: "
                        f"cost={total_cost:.1f} > budget={budget:.1f}, INFEASIBLE"
                    )
                elif is_better:
                    status = NodeStatus.INCUMBENT_UPDATE
                    explanation = (
                        f"Subset #{mask} = {subset_desc}: "
                        f"cost={total_cost:.1f}, value={total_value:.1f} — "
                        f"NEW BEST (was {best_value - total_value + total_value:.1f})"
                    )
                else:
                    status = NodeStatus.FEASIBLE
                    explanation = (
                        f"Subset #{mask} = {subset_desc}: "
                        f"cost={total_cost:.1f}, value={total_value:.1f}, "
                        f"feasible but not better than best={best_value:.1f}"
                    )

                step = TraceStep(
                    level=sum(decision_vector),
                    action="evaluate_subset",
                    node_id=node_id_counter,
                    cost=total_cost,
                    value=total_value,
                    upper_bound=None,
                    decision_path=list(decision_vector),
                    status=status,
                    explanation=explanation,
                    subset_index=mask,
                    is_feasible=is_feasible,
                    is_incumbent_update=is_better,
                    best_value_so_far=best_value,
                    remaining_budget=budget - total_cost if is_feasible else 0.0,
                )
                result.trace.add_step(step)

            # Extract best solution
            best_decision = [(best_mask >> j) & 1 for j in range(n)]
            best_items_list = [items[j] for j in range(n) if best_decision[j] == 1]

        # Fill result
        result.best_value = best_value
        result.best_cost = best_cost
        result.best_items = best_items_list
        result.best_decision_vector = best_decision

        metrics.execution_time_ms = timer.elapsed_ms
        metrics.memory_bytes = timer.peak_memory_bytes
        metrics.nodes_generated = total_subsets
        metrics.nodes_expanded = total_subsets
        result.metrics = metrics

        result.trace.summary = (
            f"Brute force evaluated {total_subsets} subsets of {n} items. "
            f"Found {metrics.feasible_subsets} feasible, {metrics.infeasible_subsets} infeasible. "
            f"Optimal value = {best_value:.2f} with cost = {best_cost:.2f}."
        )

        return result
