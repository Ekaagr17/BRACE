"""
Comparison and graph data generation for BRACE Performance Lab.

Generates structured data payloads for all 10 required academic charts
specified in Section 8 of the BRACE specification.
"""

from __future__ import annotations

import random
from typing import Any

from backend.benchmarking.datasets import generate_dataset
from backend.benchmarking.runner import BenchmarkRunner


class PerformanceLabGraphGenerator:
    """Generates plotting datasets for all 10 required Performance Lab charts."""

    def __init__(self) -> None:
        self.runner = BenchmarkRunner()

    def generate_all_graphs(self, max_size: int = 14) -> dict[str, Any]:
        """Generate full data suite for all 10 interactive charts."""
        sizes = [4, 6, 8, 10, 12, max_size]
        scaling_data = self.runner.run_scaling_benchmark(sizes=sizes, trials=2)

        # 1. Runtime vs Input Size
        g1 = {
            "title": "Runtime vs Input Size",
            "x_label": "Number of Defensive Controls (n)",
            "y_label": "Execution Time (ms)",
            "series": [
                {
                    "name": "Brute Force O(n·2ⁿ)",
                    "x": [d["input_size"] for d in scaling_data],
                    "y": [d["runtime_ms"]["brute_force"] for d in scaling_data],
                    "color": "#ff3d71",  # Orion Red
                },
                {
                    "name": "Branch & Bound DFS",
                    "x": [d["input_size"] for d in scaling_data],
                    "y": [d["runtime_ms"]["bb_dfs"] for d in scaling_data],
                    "color": "#00d4ff",  # Orion Cyan
                },
                {
                    "name": "Greedy O(n log n)",
                    "x": [d["input_size"] for d in scaling_data],
                    "y": [d["runtime_ms"]["greedy"] for d in scaling_data],
                    "color": "#00e676",  # Orion Green
                },
            ],
        }

        # 2. Nodes Explored vs Input Size
        g2 = {
            "title": "Nodes Explored vs Input Size",
            "x_label": "Number of Defensive Controls (n)",
            "y_label": "Nodes / Subsets Evaluated",
            "series": [
                {
                    "name": "Brute Force Subsets (2ⁿ)",
                    "x": [d["input_size"] for d in scaling_data],
                    "y": [d["nodes_explored"]["brute_force"] for d in scaling_data],
                    "color": "#ff3d71",
                },
                {
                    "name": "Branch & Bound Explored",
                    "x": [d["input_size"] for d in scaling_data],
                    "y": [d["nodes_explored"]["bb_dfs"] for d in scaling_data],
                    "color": "#00d4ff",
                },
                {
                    "name": "Greedy Evaluations (n)",
                    "x": [d["input_size"] for d in scaling_data],
                    "y": [d["nodes_explored"]["greedy"] for d in scaling_data],
                    "color": "#00e676",
                },
            ],
        }

        # 3. Pruning Efficiency
        g3 = {
            "title": "Branch & Bound Pruning Efficiency",
            "x_label": "Input Size (n)",
            "y_label": "Pruning Percentage (%)",
            "series": [
                {
                    "name": "Pruning Rate",
                    "x": [d["input_size"] for d in scaling_data],
                    "y": [d["pruning_efficiency_pct"] for d in scaling_data],
                    "color": "#7c3aed",  # Orion Purple
                }
            ],
        }

        # 4. Memory Usage vs Input Size
        g4 = {
            "title": "Peak Memory Allocation vs Input Size",
            "x_label": "Input Size (n)",
            "y_label": "Memory (Bytes)",
            "series": [
                {
                    "name": "Brute Force",
                    "x": [d["input_size"] for d in scaling_data],
                    "y": [d["memory_bytes"]["brute_force"] for d in scaling_data],
                    "color": "#ff3d71",
                },
                {
                    "name": "Branch & Bound DFS",
                    "x": [d["input_size"] for d in scaling_data],
                    "y": [d["memory_bytes"]["bb_dfs"] for d in scaling_data],
                    "color": "#00d4ff",
                },
                {
                    "name": "Greedy",
                    "x": [d["input_size"] for d in scaling_data],
                    "y": [d["memory_bytes"]["greedy"] for d in scaling_data],
                    "color": "#00e676",
                },
            ],
        }

        # 5. Solution Value Comparison across Budget Ratios
        items_10 = generate_dataset(10, seed=555)
        total_c = sum(it.cost for it in items_10)
        budget_ratios = [0.2, 0.4, 0.6, 0.8, 1.0]
        val_bf, val_gr, val_bb = [], [], []

        for br in budget_ratios:
            b = total_c * br
            comp = self.runner.run_all_three(items_10, b)
            val_bf.append(comp.brute_force.solution_value)
            val_gr.append(comp.greedy.solution_value)
            val_bb.append(comp.branch_and_bound_dfs.solution_value)

        g5 = {
            "title": "Objective Solution Value Comparison (Risk Reduction)",
            "x_label": "Budget Capacity (% of Total Cost)",
            "y_label": "Risk Reduction Achieved (Value Z)",
            "series": [
                {"name": "Brute Force (Optimal)", "x": ["20%", "40%", "60%", "80%", "100%"], "y": val_bf, "color": "#ff3d71"},
                {"name": "Branch & Bound (Optimal)", "x": ["20%", "40%", "60%", "80%", "100%"], "y": val_bb, "color": "#00d4ff"},
                {"name": "Greedy (Heuristic)", "x": ["20%", "40%", "60%", "80%", "100%"], "y": val_gr, "color": "#00e676"},
            ],
        }

        # 6. Optimality Gap (%)
        g6 = {
            "title": "Greedy Optimality Gap vs Input Size",
            "x_label": "Number of Controls (n)",
            "y_label": "Optimality Gap (%) = (Z_opt - Z_greedy) / Z_opt",
            "series": [
                {
                    "name": "Greedy Gap %",
                    "x": [d["input_size"] for d in scaling_data],
                    "y": [d["optimality_gap_pct"] for d in scaling_data],
                    "color": "#ff9f43",  # Orion Orange
                }
            ],
        }

        # 7. Runtime vs Budget Constraint
        runtime_bf_b, runtime_bb_b = [], []
        for br in budget_ratios:
            b = total_c * br
            comp = self.runner.run_all_three(items_10, b)
            runtime_bf_b.append(comp.brute_force.runtime_ms)
            runtime_bb_b.append(comp.branch_and_bound_dfs.runtime_ms)

        g7 = {
            "title": "Execution Runtime vs Budget Constraint",
            "x_label": "Budget Level (% of Total Catalog Cost)",
            "y_label": "Runtime (ms)",
            "series": [
                {"name": "Brute Force (Invariant)", "x": ["20%", "40%", "60%", "80%", "100%"], "y": runtime_bf_b, "color": "#ff3d71"},
                {"name": "Branch & Bound (Pruning-Dependent)", "x": ["20%", "40%", "60%", "80%", "100%"], "y": runtime_bb_b, "color": "#00d4ff"},
            ],
        }

        # 8. Runtime Distribution (15 trials on n=12)
        dist_items = generate_dataset(12, seed=999)
        dist_b = sum(i.cost for i in dist_items) * 0.5
        bf_dist, bb_dist, gr_dist = [], [], []
        for _ in range(12):
            bf_dist.append(self.runner.run_single("brute_force", dist_items, dist_b, record_trace=False).runtime_ms)
            bb_dist.append(self.runner.run_single("branch_and_bound_dfs", dist_items, dist_b, record_trace=False).runtime_ms)
            gr_dist.append(self.runner.run_single("greedy", dist_items, dist_b, record_trace=False).runtime_ms)

        g8 = {
            "title": "Runtime Distribution across Repeated Trials (n=12)",
            "x_label": "Trial Index",
            "y_label": "Runtime (ms)",
            "series": [
                {"name": "Brute Force", "y": bf_dist, "color": "#ff3d71"},
                {"name": "Branch & Bound DFS", "y": bb_dist, "color": "#00d4ff"},
                {"name": "Greedy", "y": gr_dist, "color": "#00e676"},
            ],
        }

        # 9. DFS vs Best-First Branch and Bound
        g9 = {
            "title": "DFS vs Best-First Branch & Bound Comparison",
            "x_label": "Input Size (n)",
            "y_label": "Nodes Explored",
            "series": [
                {
                    "name": "DFS B&B",
                    "x": [d["input_size"] for d in scaling_data],
                    "y": [d["nodes_explored"]["bb_dfs"] for d in scaling_data],
                    "color": "#00d4ff",
                },
                {
                    "name": "Best-First B&B (Priority Queue)",
                    "x": [d["input_size"] for d in scaling_data],
                    "y": [d["nodes_explored"]["bb_best_first"] for d in scaling_data],
                    "color": "#7c3aed",
                },
            ],
        }

        # 10. Upper Bound vs Incumbent Progression
        sample_bb = self.runner.run_single("branch_and_bound_dfs", items_10, total_c * 0.5)
        step_indices = []
        ub_progression = []
        incumbent_progression = []
        best_so_far = 0.0

        for idx, step in enumerate(sample_bb.trace_steps[:40]):
            step_indices.append(idx + 1)
            ub_val = step.get("upper_bound")
            ub_progression.append(ub_val if ub_val is not None else best_so_far)
            if step.get("is_incumbent_update") or step.get("value", 0) > best_so_far:
                best_so_far = step.get("best_value_so_far", step.get("value", best_so_far))
            incumbent_progression.append(best_so_far)

        g10 = {
            "title": "Upper Bound Relaxation vs Incumbent Solution Convergence",
            "x_label": "Search Step Index",
            "y_label": "Objective Value Bound",
            "series": [
                {"name": "Fractional Upper Bound UB(x)", "x": step_indices, "y": ub_progression, "color": "#ff9f43"},
                {"name": "Incumbent Best Feasible Z*", "x": step_indices, "y": incumbent_progression, "color": "#00d4ff"},
            ],
        }

        return {
            "graph_1_runtime_vs_size": g1,
            "graph_2_nodes_vs_size": g2,
            "graph_3_pruning_efficiency": g3,
            "graph_4_memory_vs_size": g4,
            "graph_5_solution_value": g5,
            "graph_6_optimality_gap": g6,
            "graph_7_runtime_vs_budget": g7,
            "graph_8_runtime_distribution": g8,
            "graph_9_dfs_vs_best_first": g9,
            "graph_10_bound_progression": g10,
        }
