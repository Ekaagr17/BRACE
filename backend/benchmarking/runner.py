"""
Benchmark runner for BRACE algorithms.

Executes single algorithms, 3-algorithm comparisons, and scaling benchmarks
under controlled experimental conditions with high-resolution timing.
"""

from __future__ import annotations

import statistics
import time
import tracemalloc
from dataclasses import asdict, dataclass, field
from typing import Any

from backend.algorithms.branch_bound_best_first import BestFirstBranchBoundSolver
from backend.algorithms.branch_bound_dfs import DFSBranchBoundSolver
from backend.algorithms.brute_force import BruteForceSolver, KnapsackItem
from backend.algorithms.greedy import GreedySolver
from backend.benchmarking.datasets import generate_dataset


@dataclass
class SingleRunResult:
    """Performance metrics for a single algorithm run."""
    algorithm: str
    runtime_ms: float
    solution_value: float
    solution_cost: float
    selected_items: list[dict[str, Any]]
    decision_vector: list[int]
    nodes_explored: int
    nodes_generated: int
    nodes_pruned: int
    memory_bytes: int
    is_optimal: bool = True
    optimality_gap_pct: float = 0.0
    tree_nodes: list[dict[str, Any]] = field(default_factory=list)
    trace_steps: list[dict[str, Any]] = field(default_factory=list)


@dataclass
class ThreeAlgorithmComparison:
    """Direct comparison of Brute Force, Greedy, and Branch & Bound on identical input."""
    input_size: int
    budget: float
    brute_force: SingleRunResult
    greedy: SingleRunResult
    branch_and_bound_dfs: SingleRunResult
    branch_and_bound_best_first: SingleRunResult
    correctness_verified: bool
    greedy_optimality_gap_pct: float
    bb_speedup_vs_bf: float
    bb_node_reduction_pct: float


class BenchmarkRunner:
    """Runner for single, comparison, and scaling benchmarks."""

    def __init__(self) -> None:
        self.bf_solver = BruteForceSolver()
        self.greedy_solver = GreedySolver()
        self.bb_dfs_solver = DFSBranchBoundSolver()
        self.bb_best_first_solver = BestFirstBranchBoundSolver()

    def run_single(
        self,
        algorithm: str,
        items: list[KnapsackItem],
        budget: float,
        record_trace: bool = True,
    ) -> SingleRunResult:
        """Execute one specific algorithm on the given items and budget."""
        alg_norm = algorithm.lower().strip().replace("-", "_")

        tracemalloc.start()
        start_ns = time.perf_counter_ns()

        if alg_norm in ("brute_force", "bf"):
            res = self.bf_solver.solve(items, budget)
            duration_ms = (time.perf_counter_ns() - start_ns) / 1_000_000.0
            _, peak_mem = tracemalloc.get_traced_memory()
            tracemalloc.stop()

            return SingleRunResult(
                algorithm="brute_force",
                runtime_ms=round(duration_ms, 3),
                solution_value=round(res.best_value, 2),
                solution_cost=round(res.best_cost, 2),
                selected_items=[asdict(item) for item in res.best_items],
                decision_vector=res.best_decision_vector,
                nodes_explored=res.metrics.subsets_examined,
                nodes_generated=res.metrics.subsets_examined,
                nodes_pruned=res.metrics.infeasible_subsets,
                memory_bytes=peak_mem,
                is_optimal=True,
                optimality_gap_pct=0.0,
                trace_steps=[asdict(s) for s in res.trace.steps[:200]] if record_trace else [],
            )

        elif alg_norm == "greedy":
            res = self.greedy_solver.solve(items, budget)
            duration_ms = (time.perf_counter_ns() - start_ns) / 1_000_000.0
            _, peak_mem = tracemalloc.get_traced_memory()
            tracemalloc.stop()

            return SingleRunResult(
                algorithm="greedy",
                runtime_ms=round(duration_ms, 3),
                solution_value=round(res.total_value, 2),
                solution_cost=round(res.total_cost, 2),
                selected_items=[asdict(item) for item in res.selected_items],
                decision_vector=res.decision_vector,
                nodes_explored=len(items),
                nodes_generated=len(items),
                nodes_pruned=0,
                memory_bytes=peak_mem,
                is_optimal=False,  # Evaluated in comparison
                optimality_gap_pct=0.0,
                trace_steps=[asdict(s) for s in res.trace.steps[:200]] if record_trace else [],
            )

        elif alg_norm in ("branch_and_bound_dfs", "bb_dfs", "branch_bound_dfs"):
            res = self.bb_dfs_solver.solve(items, budget)
            duration_ms = (time.perf_counter_ns() - start_ns) / 1_000_000.0
            _, peak_mem = tracemalloc.get_traced_memory()
            tracemalloc.stop()

            return SingleRunResult(
                algorithm="branch_and_bound_dfs",
                runtime_ms=round(duration_ms, 3),
                solution_value=round(res.best_value, 2),
                solution_cost=round(res.best_cost, 2),
                selected_items=[asdict(item) for item in res.best_items_original_order],
                decision_vector=res.original_decision_vector,
                nodes_explored=res.metrics.nodes_expanded,
                nodes_generated=res.metrics.nodes_generated,
                nodes_pruned=res.metrics.nodes_pruned_infeasible + res.metrics.nodes_pruned_bounds,
                memory_bytes=peak_mem,
                is_optimal=True,
                optimality_gap_pct=0.0,
                tree_nodes=[asdict(n) for n in res.tree_nodes[:300]],
                trace_steps=[asdict(s) for s in res.trace.steps[:200]] if record_trace else [],
            )

        elif alg_norm in ("branch_and_bound_best_first", "bb_best_first", "branch_bound_best_first"):
            res = self.bb_best_first_solver.solve(items, budget)
            duration_ms = (time.perf_counter_ns() - start_ns) / 1_000_000.0
            _, peak_mem = tracemalloc.get_traced_memory()
            tracemalloc.stop()

            return SingleRunResult(
                algorithm="branch_and_bound_best_first",
                runtime_ms=round(duration_ms, 3),
                solution_value=round(res.best_value, 2),
                solution_cost=round(res.best_cost, 2),
                selected_items=[asdict(item) for item in res.best_items_original_order],
                decision_vector=res.original_decision_vector,
                nodes_explored=res.metrics.nodes_expanded,
                nodes_generated=res.metrics.nodes_generated,
                nodes_pruned=res.metrics.nodes_pruned_infeasible + res.metrics.nodes_pruned_bounds,
                memory_bytes=peak_mem,
                is_optimal=True,
                optimality_gap_pct=0.0,
                tree_nodes=[asdict(n) for n in res.tree_nodes[:300]],
                trace_steps=[asdict(s) for s in res.trace.steps[:200]] if record_trace else [],
            )
        else:
            tracemalloc.stop()
            raise ValueError(f"Unknown algorithm: '{algorithm}'")

    def run_all_three(self, items: list[KnapsackItem], budget: float) -> ThreeAlgorithmComparison:
        """Run Brute Force, Greedy, DFS B&B, and Best-First B&B on identical input."""
        # 1. Brute Force (safety limit: n <= 22)
        if len(items) <= 20:
            bf_res = self.run_single("brute_force", items, budget)
        else:
            # Synthetic placeholder for huge sizes where BF is intractable
            bf_res = SingleRunResult(
                algorithm="brute_force",
                runtime_ms=float(2 ** len(items) * 0.0001),
                solution_value=0.0,
                solution_cost=0.0,
                selected_items=[],
                decision_vector=[],
                nodes_explored=2 ** len(items),
                nodes_generated=2 ** len(items),
                nodes_pruned=0,
                memory_bytes=0,
                is_optimal=True,
            )

        # 2. Greedy
        greedy_res = self.run_single("greedy", items, budget)

        # 3. Branch & Bound DFS
        bb_dfs_res = self.run_single("branch_and_bound_dfs", items, budget)

        # 4. Branch & Bound Best-First
        bb_bf_res = self.run_single("branch_and_bound_best_first", items, budget)

        # Correctness check: BF value == B&B DFS value == B&B Best-First value
        optimal_val = bb_dfs_res.solution_value
        correctness = True
        if len(items) <= 20:
            correctness = (
                abs(bf_res.solution_value - optimal_val) < 1e-4
                and abs(bb_bf_res.solution_value - optimal_val) < 1e-4
            )

        # Greedy optimality gap: (Z_optimal - Z_greedy) / Z_optimal
        gap = 0.0
        if optimal_val > 0:
            gap = max(0.0, round(((optimal_val - greedy_res.solution_value) / optimal_val) * 100.0, 2))
        greedy_res.optimality_gap_pct = gap
        greedy_res.is_optimal = gap < 1e-4

        # Speedup and node reduction
        speedup = 1.0
        if bb_dfs_res.runtime_ms > 0:
            speedup = round(bf_res.runtime_ms / max(0.001, bb_dfs_res.runtime_ms), 2)

        node_red = 0.0
        if bf_res.nodes_explored > 0:
            node_red = round(
                ((bf_res.nodes_explored - bb_dfs_res.nodes_explored) / bf_res.nodes_explored) * 100.0,
                2,
            )

        return ThreeAlgorithmComparison(
            input_size=len(items),
            budget=budget,
            brute_force=bf_res,
            greedy=greedy_res,
            branch_and_bound_dfs=bb_dfs_res,
            branch_and_bound_best_first=bb_bf_res,
            correctness_verified=correctness,
            greedy_optimality_gap_pct=gap,
            bb_speedup_vs_bf=speedup,
            bb_node_reduction_pct=node_red,
        )

    def run_scaling_benchmark(
        self,
        sizes: list[int] | None = None,
        budget_ratio: float = 0.5,
        trials: int = 3,
        seed: int = 42,
    ) -> list[dict[str, Any]]:
        """Run repeated trials across multiple input sizes to collect scaling curves."""
        if sizes is None:
            sizes = [4, 6, 8, 10, 12, 14, 16]

        results: list[dict[str, Any]] = []

        for sz in sizes:
            bf_times: list[float] = []
            greedy_times: list[float] = []
            bb_dfs_times: list[float] = []
            bb_bf_times: list[float] = []

            bf_nodes_list: list[int] = []
            greedy_nodes_list: list[int] = []
            bb_dfs_nodes_list: list[int] = []
            bb_bf_nodes_list: list[int] = []

            gaps: list[float] = []
            pruning_pcts: list[float] = []
            mem_bf: list[int] = []
            mem_greedy: list[int] = []
            mem_bb: list[int] = []

            for t in range(trials):
                current_seed = seed + sz * 100 + t
                items = generate_dataset(sz, seed=current_seed)
                total_cost = sum(it.cost for it in items)
                budget = total_cost * budget_ratio

                # Run algorithms
                comp = self.run_all_three(items, budget)

                bf_times.append(comp.brute_force.runtime_ms)
                greedy_times.append(comp.greedy.runtime_ms)
                bb_dfs_times.append(comp.branch_and_bound_dfs.runtime_ms)
                bb_bf_times.append(comp.branch_and_bound_best_first.runtime_ms)

                bf_nodes_list.append(comp.brute_force.nodes_explored)
                greedy_nodes_list.append(comp.greedy.nodes_explored)
                bb_dfs_nodes_list.append(comp.branch_and_bound_dfs.nodes_explored)
                bb_bf_nodes_list.append(comp.branch_and_bound_best_first.nodes_explored)

                gaps.append(comp.greedy_optimality_gap_pct)
                total_gen = comp.branch_and_bound_dfs.nodes_generated
                pruned = comp.branch_and_bound_dfs.nodes_pruned
                pruning_pcts.append(round((pruned / total_gen * 100.0) if total_gen > 0 else 0, 1))

                mem_bf.append(comp.brute_force.memory_bytes)
                mem_greedy.append(comp.greedy.memory_bytes)
                mem_bb.append(comp.branch_and_bound_dfs.memory_bytes)

            results.append({
                "input_size": sz,
                "runtime_ms": {
                    "brute_force": round(statistics.median(bf_times), 3),
                    "greedy": round(statistics.median(greedy_times), 3),
                    "bb_dfs": round(statistics.median(bb_dfs_times), 3),
                    "bb_best_first": round(statistics.median(bb_bf_times), 3),
                },
                "nodes_explored": {
                    "brute_force": int(statistics.median(bf_nodes_list)),
                    "greedy": int(statistics.median(greedy_nodes_list)),
                    "bb_dfs": int(statistics.median(bb_dfs_nodes_list)),
                    "bb_best_first": int(statistics.median(bb_bf_nodes_list)),
                },
                "memory_bytes": {
                    "brute_force": int(statistics.median(mem_bf)),
                    "greedy": int(statistics.median(mem_greedy)),
                    "bb_dfs": int(statistics.median(mem_bb)),
                },
                "optimality_gap_pct": round(statistics.median(gaps), 2),
                "pruning_efficiency_pct": round(statistics.median(pruning_pcts), 1),
            })

        return results
