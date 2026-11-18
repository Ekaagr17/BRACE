"""
Automated unit tests for BRACE algorithms:
1. Brute Force
2. Greedy Heuristic
3. DFS Branch and Bound
4. Best-First Branch and Bound
"""

import pytest
from backend.algorithms.bounds import fractional_knapsack_bound, sort_items_by_ratio
from backend.algorithms.branch_bound_best_first import BestFirstBranchBoundSolver
from backend.algorithms.branch_bound_dfs import DFSBranchBoundSolver
from backend.algorithms.brute_force import BruteForceSolver, KnapsackItem
from backend.algorithms.greedy import GreedySolver
from backend.benchmarking.datasets import generate_dataset, generate_edge_cases, generate_greedy_suboptimal_dataset


@pytest.fixture
def solvers():
    return {
        "bf": BruteForceSolver(),
        "greedy": GreedySolver(),
        "bb_dfs": DFSBranchBoundSolver(),
        "bb_best_first": BestFirstBranchBoundSolver(),
    }


def test_classic_knapsack_known_instance(solvers):
    """Test known 0/1 Knapsack textbook instance."""
    items = [
        KnapsackItem(id=1, name="Item 1", cost=2.0, value=12.0),
        KnapsackItem(id=2, name="Item 2", cost=1.0, value=10.0),
        KnapsackItem(id=3, name="Item 3", cost=3.0, value=20.0),
        KnapsackItem(id=4, name="Item 4", cost=2.0, value=15.0),
    ]
    budget = 5.0

    bf_res = solvers["bf"].solve(items, budget)
    bb_dfs_res = solvers["bb_dfs"].solve(items, budget)
    bb_bf_res = solvers["bb_best_first"].solve(items, budget)

    # Known optimal: items 2, 3, 4 (weight 1+3+2 > 5 no, items 1, 2, 4 -> cost 2+1+2=5, value 12+10+15=37)
    # or items 2, 3, 4 -> cost 6? cost 2+3=5, value 12+20=32
    # items 1, 2, 4 -> cost 2+1+2 = 5, value = 12+10+15 = 37.
    assert bf_res.best_value == 37.0
    assert bb_dfs_res.best_value == 37.0
    assert bb_bf_res.best_value == 37.0
    assert bb_dfs_res.best_cost <= budget


def test_branch_and_bound_matches_brute_force_50_instances(solvers):
    """Verify B&B DFS and Best-First strictly equal Brute Force across 50 seeded datasets."""
    for seed in range(50):
        items = generate_dataset(n_items=8, seed=1000 + seed)
        total_cost = sum(i.cost for i in items)
        budget = total_cost * 0.45

        bf_val = solvers["bf"].solve(items, budget).best_value
        bb_dfs_val = solvers["bb_dfs"].solve(items, budget).best_value
        bb_bf_val = solvers["bb_best_first"].solve(items, budget).best_value

        assert abs(bf_val - bb_dfs_val) < 1e-4, f"DFS mismatch on seed {seed}: BF={bf_val}, DFS={bb_dfs_val}"
        assert abs(bf_val - bb_bf_val) < 1e-4, f"BestFirst mismatch on seed {seed}: BF={bf_val}, BF_B&B={bb_bf_val}"


def test_greedy_suboptimal_instance(solvers):
    """Demonstrate that Greedy is strictly suboptimal on designated counterexample."""
    items, budget = generate_greedy_suboptimal_dataset()

    greedy_res = solvers["greedy"].solve(items, budget)
    bb_res = solvers["bb_dfs"].solve(items, budget)

    # Greedy total = 39.0, Optimal total = 60.0
    assert greedy_res.total_value == 39.0
    assert bb_res.best_value == 60.0
    assert bb_res.best_value > greedy_res.total_value


def test_edge_cases(solvers):
    """Test boundary and extreme conditions."""
    edge_cases = generate_edge_cases()

    # Empty items
    empty_items, b = edge_cases["empty_items"]
    assert solvers["bf"].solve(empty_items, b).best_value == 0.0
    assert solvers["bb_dfs"].solve(empty_items, b).best_value == 0.0
    assert solvers["greedy"].solve(empty_items, b).total_value == 0.0

    # Zero budget
    items, zero_b = edge_cases["zero_budget"]
    assert solvers["bf"].solve(items, zero_b).best_value == 0.0
    assert solvers["bb_dfs"].solve(items, zero_b).best_value == 0.0
    assert solvers["greedy"].solve(items, zero_b).total_value == 0.0

    # Single item exceeds
    items, b = edge_cases["single_item_exceeds"]
    assert solvers["bf"].solve(items, b).best_value == 0.0
    assert solvers["bb_dfs"].solve(items, b).best_value == 0.0

    # All affordable
    items, b = edge_cases["all_items_affordable"]
    tot_val = sum(i.value for i in items)
    assert solvers["bf"].solve(items, b).best_value == tot_val
    assert solvers["bb_dfs"].solve(items, b).best_value == tot_val


def test_upper_bound_validity():
    """Verify fractional knapsack bound is never less than true optimal integer knapsack value."""
    for seed in range(20):
        items = generate_dataset(n_items=9, seed=seed)
        total_cost = sum(i.cost for i in items)
        budget = total_cost * 0.5

        sorted_items = sort_items_by_ratio(items)
        ub = fractional_knapsack_bound(sorted_items, budget, 0.0, 0.0, 0)
        opt = DFSBranchBoundSolver().solve(items, budget).best_value

        assert ub >= opt - 1e-4, f"Upper bound violated! UB={ub}, Opt={opt}"
