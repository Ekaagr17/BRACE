"""
Branch and Bound solver using Depth-First Search for the 0/1 Knapsack problem.

Explores the binary state-space tree in DFS order, pruning branches when:
1. The partial solution exceeds the budget (infeasible pruning)
2. The fractional knapsack upper bound is ≤ the current best value (bound pruning)

Produces the exact optimal solution while typically exploring far fewer
nodes than brute force.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from backend.algorithms.bounds import fractional_knapsack_bound, sort_items_by_ratio
from backend.algorithms.brute_force import KnapsackItem
from backend.algorithms.metrics import (
    ExecutionMetrics,
    ExecutionTrace,
    HighResTimer,
    NodeStatus,
    TraceStep,
)


@dataclass
class BBNode:
    """A node in the Branch and Bound search tree.

    Attributes:
        level: Depth in the tree (0 = root, n = leaf).
        cost: Cumulative cost of included items.
        value: Cumulative value of included items.
        upper_bound: Fractional knapsack upper bound from this node.
        decision_path: List of 0/1 decisions (include/exclude) for items 0..level-1.
        parent_id: Node ID of the parent node (-1 for root).
        node_id: Unique identifier for this node.
        status: Current status of this node.
    """
    level: int = 0
    cost: float = 0.0
    value: float = 0.0
    upper_bound: float = 0.0
    decision_path: list[int] = field(default_factory=list)
    parent_id: int = -1
    node_id: int = 0
    status: NodeStatus = NodeStatus.EXPLORING


@dataclass
class BranchBoundResult:
    """Result from a Branch and Bound solver.

    Attributes:
        best_value: Optimal objective value Z*.
        best_cost: Total cost of the optimal solution.
        best_items: List of items in the optimal solution (in sorted order).
        best_items_original_order: Items in their original input order.
        best_decision_vector: Binary vector in SORTED item order.
        original_decision_vector: Binary vector in ORIGINAL item order.
        sorted_items: Items in the order used by B&B (sorted by ratio).
        tree_nodes: All nodes created during search (for visualization).
        metrics: Performance counters.
        trace: Full execution trace.
    """
    best_value: float = 0.0
    best_cost: float = 0.0
    best_items: list[KnapsackItem] = field(default_factory=list)
    best_items_original_order: list[KnapsackItem] = field(default_factory=list)
    best_decision_vector: list[int] = field(default_factory=list)
    original_decision_vector: list[int] = field(default_factory=list)
    sorted_items: list[KnapsackItem] = field(default_factory=list)
    tree_nodes: list[BBNode] = field(default_factory=list)
    metrics: ExecutionMetrics = field(default_factory=ExecutionMetrics)
    trace: ExecutionTrace = field(default_factory=ExecutionTrace)


class DFSBranchBoundSolver:
    """Branch and Bound solver using Depth-First Search traversal.

    The binary state-space tree has:
    - Root at level 0 with no decisions made
    - At each level i, two children: include item i (left) or exclude item i (right)
    - Leaves at level n represent complete solutions

    Items are sorted by value/cost ratio for tighter upper bounds.
    DFS uses implicit stack (recursion) for O(n) space complexity.
    """

    def solve(self, items: list[KnapsackItem], budget: float) -> BranchBoundResult:
        """Solve the 0/1 knapsack problem using DFS Branch and Bound.

        Args:
            items: List of KnapsackItem instances.
            budget: Maximum total cost (capacity constraint B).

        Returns:
            BranchBoundResult with optimal solution and complete search tree.

        Raises:
            ValueError: If budget is negative.
        """
        if budget < 0:
            raise ValueError(f"Budget must be non-negative, got {budget}")

        n = len(items)
        result = BranchBoundResult()
        result.trace.algorithm = "branch_and_bound_dfs"

        # Sort items by value/cost ratio descending for tighter bounds
        sorted_items = sort_items_by_ratio(items)
        result.sorted_items = sorted_items

        # Map from sorted index to original index
        orig_indices = {item.id: i for i, item in enumerate(items)}

        metrics = ExecutionMetrics()
        node_id_counter = [0]  # Mutable counter for nested function

        best_value = [0.0]
        best_cost = [0.0]
        best_path: list[list[int]] = [[]]

        with HighResTimer() as timer:
            def dfs(level: int, cost: float, value: float, path: list[int], parent_id: int) -> None:
                """Recursive DFS exploration of the state-space tree."""
                node_id_counter[0] += 1
                current_node_id = node_id_counter[0]
                metrics.nodes_generated += 1

                # Compute upper bound
                ub = fractional_knapsack_bound(sorted_items, budget, value, cost, level)

                node = BBNode(
                    level=level,
                    cost=cost,
                    value=value,
                    upper_bound=ub,
                    decision_path=list(path),
                    parent_id=parent_id,
                    node_id=current_node_id,
                    status=NodeStatus.EXPLORING,
                )

                # Check if this is a leaf node
                if level == n:
                    if cost <= budget and value > best_value[0]:
                        best_value[0] = value
                        best_cost[0] = cost
                        best_path[0] = list(path)
                        node.status = NodeStatus.OPTIMAL
                        metrics.incumbent_updates += 1

                        item_names = [sorted_items[j].name for j in range(n) if path[j] == 1]
                        explanation = (
                            f"LEAF node: complete solution with value={value:.1f}, cost={cost:.1f}. "
                            f"NEW INCUMBENT: {{{', '.join(item_names)}}}"
                        )
                    else:
                        node.status = NodeStatus.LEAF
                        explanation = (
                            f"LEAF node: value={value:.1f}, cost={cost:.1f}. "
                            f"Not better than incumbent={best_value[0]:.1f}"
                        )

                    result.tree_nodes.append(node)
                    result.trace.add_step(TraceStep(
                        level=level,
                        action="leaf",
                        node_id=current_node_id,
                        cost=cost,
                        value=value,
                        upper_bound=ub,
                        decision_path=list(path),
                        status=node.status,
                        explanation=explanation,
                        is_feasible=cost <= budget,
                        is_incumbent_update=node.status == NodeStatus.OPTIMAL,
                        best_value_so_far=best_value[0],
                        remaining_budget=budget - cost,
                    ))
                    return

                # Pruning check: upper bound
                if ub <= best_value[0]:
                    node.status = NodeStatus.PRUNED_BOUND
                    metrics.nodes_pruned_bounds += 1
                    result.tree_nodes.append(node)

                    explanation = (
                        f"PRUNED (bound): UB={ub:.1f} ≤ best={best_value[0]:.1f} at level {level}. "
                        f"No solution in this subtree can beat the incumbent."
                    )
                    result.trace.add_step(TraceStep(
                        level=level,
                        action="prune_bound",
                        node_id=current_node_id,
                        cost=cost,
                        value=value,
                        upper_bound=ub,
                        decision_path=list(path),
                        status=NodeStatus.PRUNED_BOUND,
                        explanation=explanation,
                        is_feasible=True,
                        best_value_so_far=best_value[0],
                        remaining_budget=budget - cost,
                    ))
                    return

                # This node will be expanded
                metrics.nodes_expanded += 1
                result.tree_nodes.append(node)

                item = sorted_items[level]

                # Left child: INCLUDE item at this level
                new_cost_include = cost + item.cost

                if new_cost_include > budget:
                    # Infeasible: including this item exceeds budget
                    node_id_counter[0] += 1
                    infeasible_id = node_id_counter[0]
                    metrics.nodes_generated += 1
                    metrics.nodes_pruned_infeasible += 1

                    inf_node = BBNode(
                        level=level + 1,
                        cost=new_cost_include,
                        value=value + item.value,
                        upper_bound=0.0,
                        decision_path=path + [1],
                        parent_id=current_node_id,
                        node_id=infeasible_id,
                        status=NodeStatus.PRUNED_INFEASIBLE,
                    )
                    result.tree_nodes.append(inf_node)

                    explanation = (
                        f"PRUNED (infeasible): including '{item.name}' gives "
                        f"cost={new_cost_include:.1f} > budget={budget:.1f}"
                    )
                    result.trace.add_step(TraceStep(
                        level=level + 1,
                        action="prune_infeasible",
                        node_id=infeasible_id,
                        cost=new_cost_include,
                        value=value + item.value,
                        upper_bound=0.0,
                        decision_path=path + [1],
                        status=NodeStatus.PRUNED_INFEASIBLE,
                        explanation=explanation,
                        is_feasible=False,
                        best_value_so_far=best_value[0],
                        item_name=item.name,
                        remaining_budget=0.0,
                    ))
                else:
                    # Explore inclusion branch
                    explanation = (
                        f"INCLUDE '{item.name}' (level {level}): "
                        f"cost={cost:.1f}+{item.cost:.1f}={new_cost_include:.1f}, "
                        f"value={value:.1f}+{item.value:.1f}={value + item.value:.1f}"
                    )
                    result.trace.add_step(TraceStep(
                        level=level,
                        action="include_item",
                        node_id=current_node_id,
                        cost=cost,
                        value=value,
                        upper_bound=ub,
                        decision_path=list(path),
                        status=NodeStatus.EXPLORING,
                        explanation=explanation,
                        is_feasible=True,
                        best_value_so_far=best_value[0],
                        item_name=item.name,
                        remaining_budget=budget - cost,
                    ))
                    dfs(level + 1, new_cost_include, value + item.value, path + [1], current_node_id)

                # Right child: EXCLUDE item at this level
                explanation = (
                    f"EXCLUDE '{item.name}' (level {level}): "
                    f"cost stays {cost:.1f}, value stays {value:.1f}"
                )
                result.trace.add_step(TraceStep(
                    level=level,
                    action="exclude_item",
                    node_id=current_node_id,
                    cost=cost,
                    value=value,
                    upper_bound=ub,
                    decision_path=list(path),
                    status=NodeStatus.EXPLORING,
                    explanation=explanation,
                    is_feasible=True,
                    best_value_so_far=best_value[0],
                    item_name=item.name,
                    remaining_budget=budget - cost,
                ))
                dfs(level + 1, cost, value, path + [0], current_node_id)

            # Start DFS from root
            dfs(0, 0.0, 0.0, [], -1)

        # Build final result
        result.best_value = best_value[0]
        result.best_cost = best_cost[0]
        result.best_decision_vector = best_path[0] if best_path[0] else [0] * n

        # Map sorted decisions back to original order
        result.original_decision_vector = [0] * n
        result.best_items = []
        result.best_items_original_order = []

        for j in range(n):
            if j < len(result.best_decision_vector) and result.best_decision_vector[j] == 1:
                item = sorted_items[j]
                result.best_items.append(item)
                orig_idx = orig_indices[item.id]
                result.original_decision_vector[orig_idx] = 1

        result.best_items_original_order = [
            items[i] for i in range(n) if result.original_decision_vector[i] == 1
        ]

        metrics.execution_time_ms = timer.elapsed_ms
        metrics.memory_bytes = timer.peak_memory_bytes
        result.metrics = metrics

        result.trace.summary = (
            f"DFS B&B explored {metrics.nodes_expanded} nodes, generated {metrics.nodes_generated}, "
            f"pruned {metrics.nodes_pruned_bounds} by bound and {metrics.nodes_pruned_infeasible} by infeasibility. "
            f"Optimal value = {best_value[0]:.2f} with cost = {best_cost[0]:.2f}."
        )

        return result
