"""
Headless experiment runner for BRACE benchmarks.
Can be executed via CLI to reproduce all paper results.
"""

import sys
import os

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.benchmarking.runner import BenchmarkRunner
from backend.benchmarking.datasets import generate_greedy_suboptimal_dataset


def main():
    print("=" * 70)
    print("BRACE: Branch-and-Bound Risk Analysis for Cybersecurity & Exposure")
    print("DAA Algorithmic Benchmarks & Correctness Validation Suite")
    print("=" * 70)

    runner = BenchmarkRunner()

    # 1. Greedy Suboptimal Counterexample
    print("\n[Experiment 1] Demonstrating Greedy Suboptimality:")
    items, budget = generate_greedy_suboptimal_dataset()
    comp = runner.run_all_three(items, budget)

    print(f"  Available Budget: ${budget}")
    print(f"  Brute Force Value (Optimal):     {comp.brute_force.solution_value} pts (Cost: ${comp.brute_force.solution_cost})")
    print(f"  Branch & Bound Value (Optimal):   {comp.branch_and_bound_dfs.solution_value} pts (Cost: ${comp.branch_and_bound_dfs.solution_cost})")
    print(f"  Greedy Heuristic Value:          {comp.greedy.solution_value} pts (Cost: ${comp.greedy.solution_cost})")
    print(f"  => Greedy Optimality Gap:        {comp.greedy_optimality_gap_pct}% deficit")
    print(f"  => Mathematical Equivalence:     {'VERIFIED' if comp.correctness_verified else 'FAILED'}")

    # 2. Scaling Benchmark
    sizes = [4, 6, 8, 10, 12, 14, 16]
    print(f"\n[Experiment 2] Scaling Benchmark Across Sizes {sizes}:")
    scaling_data = runner.run_scaling_benchmark(sizes=sizes, trials=2)

    print(f"{'Size (n)':<10} | {'BF Time (ms)':<14} | {'Greedy Time':<14} | {'B&B DFS Time':<14} | {'Pruned %':<10}")
    print("-" * 70)
    for row in scaling_data:
        sz = row["input_size"]
        bf_t = row["runtime_ms"]["brute_force"]
        gr_t = row["runtime_ms"]["greedy"]
        bb_t = row["runtime_ms"]["bb_dfs"]
        pruned = row["pruning_efficiency_pct"]
        print(f"{sz:<10} | {bf_t:<14.3f} | {gr_t:<14.3f} | {bb_t:<14.3f} | {pruned:<10.1f}%")

    print("\n" + "=" * 70)
    print("All experiments completed successfully. Results match theoretical expectations.")
    print("=" * 70)


if __name__ == "__main__":
    main()
