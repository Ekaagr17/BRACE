"""
Branch and Bound solver using Best-First Search for the 0/1 Knapsack problem.

Uses a priority queue (max-heap by upper bound) to always expand the most
promising node first. This typically finds the optimal solution faster than
DFS but may use more memory due to the frontier.

Produces the exact same optimal value as the DFS version.
"""

from __future__ import annotations

import heapq
from dataclasses import dataclass, field

from backend.algorithms.bounds import fractional_knapsack_bound, sort_items_by_ratio
from backend.algorithms.branch_bound_dfs import BBNode, BranchBoundResult
from backend.algorithms.brute_force import KnapsackItem
from backend.algorithms.metrics import (
    ExecutionMetrics,
    ExecutionTrace,
    HighResTimer,
    NodeStatus,
    TraceStep,
)


@dataclass(order=False)
class PriorityNode:
    """Wrapper for BBNode that supports max-heap ordering by upper bound.

    Python's heapq is a min-heap, so we negate the upper bound for max-heap behavior.
    Ties are broken by node_id (lower id = higher priority for determinism).
    """
    neg_upper_bound: float
    node_id: int
    bb_node: BBNode = field(compare=False)

    def __lt__(self, other: PriorityNode) -> bool:
        if self.neg_upper_bound != other.neg_upper_bound:
            return self.neg_upper_bound < other.neg_upper_bound
        return self.node_id < other.node_id


class BestFirstBranchBoundSolver:
    """Branch and Bound solver using Best-First (LC) Search.

    Expands nodes in order of decreasing upper bound, so the most promising
    subtree is always explored first. Uses a priority queue (max-heap).

    This guarantees finding the optimal solution and typically does so
    with fewer node expansions than DFS, but with higher memory usage.
    """

    def solve(self, items: list[KnapsackItem], budget: float) -> BranchBoundResult:
        """Solve the 0/1 knapsack problem using Best-First Branch and Bound.

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
        result.trace.algorithm = "branch_and_bound_best_first"

        sorted_items = sort_items_by_ratio(items)
        result.sorted_items = sorted_items

        orig_indices = {item.id: i for i, item in enumerate(items)}

        metrics = ExecutionMetrics()
        node_id_counter = 0

        best_value = 0.0
        best_cost = 0.0
        best_path: list[int] = []

        with HighResTimer() as timer:
            # Create root node
            root_ub = fractional_knapsack_bound(sorted_items, budget, 0.0, 0.0, 0)
            node_id_counter += 1

            root = BBNode(
                level=0,
                cost=0.0,
                value=0.0,
                upper_bound=root_ub,
                decision_path=[],
                parent_id=-1,
                node_id=node_id_counter,
                status=NodeStatus.EXPLORING,
            )
            result.tree_nodes.append(root)
            metrics.nodes_generated += 1

            result.trace.add_step(TraceStep(
                level=0,
                action="create_root",
                node_id=node_id_counter,
                cost=0.0,
                value=0.0,
                upper_bound=root_ub,
                decision_path=[],
                status=NodeStatus.EXPLORING,
                explanation=f"Root node created with UB={root_ub:.1f}",
                remaining_budget=budget,
            ))

            # Priority queue: (neg_upper_bound, node_id, bb_node)
            frontier: list[PriorityNode] = []
            heapq.heappush(frontier, PriorityNode(-root_ub, root.node_id, root))
            metrics.max_frontier_size = 1

            while frontier:
                priority_node = heapq.heappop(frontier)
                current = priority_node.bb_node

                # Check if this node can still improve on the best
                if current.upper_bound <= best_value:
                    current.status = NodeStatus.PRUNED_BOUND
                    metrics.nodes_pruned_bounds += 1

                    result.trace.add_step(TraceStep(
                        level=current.level,
                        action="prune_bound_dequeue",
                        node_id=current.node_id,
                        cost=current.cost,
                        value=current.value,
                        upper_bound=current.upper_bound,
                        decision_path=list(current.decision_path),
                        status=NodeStatus.PRUNED_BOUND,
                        explanation=(
                            f"Dequeued node {current.node_id}: UB={current.upper_bound:.1f} "
                            f"≤ best={best_value:.1f}, PRUNED"
                        ),
                        best_value_so_far=best_value,
                        remaining_budget=budget - current.cost,
                    ))
                    continue

                # Expand this node
                metrics.nodes_expanded += 1

                # If at a leaf level, check solution
                if current.level == n:
                    if current.cost <= budget and current.value > best_value:
                        best_value = current.value
                        best_cost = current.cost
                        best_path = list(current.decision_path)
                        current.status = NodeStatus.OPTIMAL
                        metrics.incumbent_updates += 1

                        item_names = [sorted_items[j].name for j in range(n) if current.decision_path[j] == 1]
                        result.trace.add_step(TraceStep(
                            level=current.level,
                            action="leaf_optimal",
                            node_id=current.node_id,
                            cost=current.cost,
                            value=current.value,
                            upper_bound=current.upper_bound,
                            decision_path=list(current.decision_path),
                            status=NodeStatus.OPTIMAL,
                            explanation=(
                                f"LEAF: value={current.value:.1f}, cost={current.cost:.1f}. "
                                f"NEW INCUMBENT: {{{', '.join(item_names)}}}"
                            ),
                            is_incumbent_update=True,
                            best_value_so_far=best_value,
                            remaining_budget=budget - current.cost,
                        ))
                    else:
                        current.status = NodeStatus.LEAF
                        result.trace.add_step(TraceStep(
                            level=current.level,
                            action="leaf",
                            node_id=current.node_id,
                            cost=current.cost,
                            value=current.value,
                            upper_bound=current.upper_bound,
                            decision_path=list(current.decision_path),
                            status=NodeStatus.LEAF,
                            explanation=(
                                f"LEAF: value={current.value:.1f}, cost={current.cost:.1f}. "
                                f"Not better than incumbent={best_value:.1f}"
                            ),
                            best_value_so_far=best_value,
                            remaining_budget=budget - current.cost,
                        ))
                    continue

                item = sorted_items[current.level]

                # Generate INCLUDE child (left)
                include_cost = current.cost + item.cost
                include_value = current.value + item.value
                include_path = current.decision_path + [1]

                if include_cost <= budget:
                    include_ub = fractional_knapsack_bound(
                        sorted_items, budget, include_value, include_cost, current.level + 1
                    )
                    node_id_counter += 1
                    metrics.nodes_generated += 1

                    include_node = BBNode(
                        level=current.level + 1,
                        cost=include_cost,
                        value=include_value,
                        upper_bound=include_ub,
                        decision_path=include_path,
                        parent_id=current.node_id,
                        node_id=node_id_counter,
                        status=NodeStatus.EXPLORING,
                    )

                    if include_ub > best_value:
                        result.tree_nodes.append(include_node)
                        heapq.heappush(
                            frontier,
                            PriorityNode(-include_ub, node_id_counter, include_node),
                        )
                        metrics.max_frontier_size = max(metrics.max_frontier_size, len(frontier))

                        result.trace.add_step(TraceStep(
                            level=current.level + 1,
                            action="enqueue_include",
                            node_id=node_id_counter,
                            cost=include_cost,
                            value=include_value,
                            upper_bound=include_ub,
                            decision_path=include_path,
                            status=NodeStatus.EXPLORING,
                            explanation=(
                                f"INCLUDE '{item.name}': cost={include_cost:.1f}, "
                                f"value={include_value:.1f}, UB={include_ub:.1f} → enqueued"
                            ),
                            item_name=item.name,
                            best_value_so_far=best_value,
                            remaining_budget=budget - include_cost,
                        ))
                    else:
                        include_node.status = NodeStatus.PRUNED_BOUND
                        result.tree_nodes.append(include_node)
                        metrics.nodes_pruned_bounds += 1

                        result.trace.add_step(TraceStep(
                            level=current.level + 1,
                            action="prune_bound_include",
                            node_id=node_id_counter,
                            cost=include_cost,
                            value=include_value,
                            upper_bound=include_ub,
                            decision_path=include_path,
                            status=NodeStatus.PRUNED_BOUND,
                            explanation=(
                                f"INCLUDE '{item.name}': UB={include_ub:.1f} "
                                f"≤ best={best_value:.1f}, PRUNED before enqueue"
                            ),
                            item_name=item.name,
                            best_value_so_far=best_value,
                            remaining_budget=budget - include_cost,
                        ))
                else:
                    # Infeasible
                    node_id_counter += 1
                    metrics.nodes_generated += 1
                    metrics.nodes_pruned_infeasible += 1

                    inf_node = BBNode(
                        level=current.level + 1,
                        cost=include_cost,
                        value=include_value,
                        upper_bound=0.0,
                        decision_path=include_path,
                        parent_id=current.node_id,
                        node_id=node_id_counter,
                        status=NodeStatus.PRUNED_INFEASIBLE,
                    )
                    result.tree_nodes.append(inf_node)

                    result.trace.add_step(TraceStep(
                        level=current.level + 1,
                        action="prune_infeasible",
                        node_id=node_id_counter,
                        cost=include_cost,
                        value=include_value,
                        upper_bound=0.0,
                        decision_path=include_path,
                        status=NodeStatus.PRUNED_INFEASIBLE,
                        explanation=(
                            f"INCLUDE '{item.name}': cost={include_cost:.1f} "
                            f"> budget={budget:.1f}, INFEASIBLE"
                        ),
                        is_feasible=False,
                        item_name=item.name,
                        best_value_so_far=best_value,
                        remaining_budget=0.0,
                    ))

                # Generate EXCLUDE child (right)
                exclude_path = current.decision_path + [0]
                exclude_ub = fractional_knapsack_bound(
                    sorted_items, budget, current.value, current.cost, current.level + 1
                )
                node_id_counter += 1
                metrics.nodes_generated += 1

                exclude_node = BBNode(
                    level=current.level + 1,
                    cost=current.cost,
                    value=current.value,
                    upper_bound=exclude_ub,
                    decision_path=exclude_path,
                    parent_id=current.node_id,
                    node_id=node_id_counter,
                    status=NodeStatus.EXPLORING,
                )

                if exclude_ub > best_value:
                    result.tree_nodes.append(exclude_node)
                    heapq.heappush(
                        frontier,
                        PriorityNode(-exclude_ub, node_id_counter, exclude_node),
                    )
                    metrics.max_frontier_size = max(metrics.max_frontier_size, len(frontier))

                    result.trace.add_step(TraceStep(
                        level=current.level + 1,
                        action="enqueue_exclude",
                        node_id=node_id_counter,
                        cost=current.cost,
                        value=current.value,
                        upper_bound=exclude_ub,
                        decision_path=exclude_path,
                        status=NodeStatus.EXPLORING,
                        explanation=(
                            f"EXCLUDE '{item.name}': cost={current.cost:.1f}, "
                            f"value={current.value:.1f}, UB={exclude_ub:.1f} → enqueued"
                        ),
                        item_name=item.name,
                        best_value_so_far=best_value,
                        remaining_budget=budget - current.cost,
                    ))
                else:
                    exclude_node.status = NodeStatus.PRUNED_BOUND
                    result.tree_nodes.append(exclude_node)
                    metrics.nodes_pruned_bounds += 1

                    result.trace.add_step(TraceStep(
                        level=current.level + 1,
                        action="prune_bound_exclude",
                        node_id=node_id_counter,
                        cost=current.cost,
                        value=current.value,
                        upper_bound=exclude_ub,
                        decision_path=exclude_path,
                        status=NodeStatus.PRUNED_BOUND,
                        explanation=(
                            f"EXCLUDE '{item.name}': UB={exclude_ub:.1f} "
                            f"≤ best={best_value:.1f}, PRUNED before enqueue"
                        ),
                        item_name=item.name,
                        best_value_so_far=best_value,
                        remaining_budget=budget - current.cost,
                    ))

        # Build final result
        result.best_value = best_value
        result.best_cost = best_cost
        result.best_decision_vector = best_path if best_path else [0] * n

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
            f"Best-first B&B explored {metrics.nodes_expanded} nodes, "
            f"generated {metrics.nodes_generated}, "
            f"pruned {metrics.nodes_pruned_bounds} by bound and "
            f"{metrics.nodes_pruned_infeasible} by infeasibility. "
            f"Max frontier size = {metrics.max_frontier_size}. "
            f"Optimal value = {best_value:.2f} with cost = {best_cost:.2f}."
        )

        return result
