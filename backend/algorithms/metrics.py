"""
Execution metrics, tracing, and timing utilities for BRACE algorithms.

Provides:
- ExecutionMetrics: comprehensive performance counters
- TraceStep: individual algorithm step with state snapshot
- ExecutionTrace: ordered collection of trace steps
- HighResTimer: context manager for nanosecond-precision timing
"""

from __future__ import annotations

import time
import tracemalloc
from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class NodeStatus(str, Enum):
    """Status of a node in the search tree."""
    EXPLORING = "exploring"
    PRUNED_INFEASIBLE = "pruned_infeasible"
    PRUNED_BOUND = "pruned_bound"
    FEASIBLE = "feasible"
    OPTIMAL = "optimal"
    LEAF = "leaf"
    INCUMBENT_UPDATE = "incumbent_update"


@dataclass
class TraceStep:
    """A single step in algorithm execution with full state snapshot.

    Attributes:
        level: Depth in the search tree (0-indexed).
        action: Description of action taken (e.g., 'include_item', 'exclude_item', 'evaluate_subset').
        node_id: Unique identifier for this node/step.
        cost: Cumulative cost at this step.
        value: Cumulative value at this step.
        upper_bound: Upper bound computed at this step (None for brute force).
        decision_path: List of 0/1 decisions made so far.
        status: Current status of the node.
        explanation: Human-readable explanation of this step.
        subset_index: For brute force, the subset bitmask index.
        is_feasible: Whether the current partial/complete solution is feasible.
        is_incumbent_update: Whether this step updated the best known solution.
        best_value_so_far: Current best known value.
        item_name: Name of the item being considered.
        remaining_budget: Budget remaining after decisions.
    """
    level: int = 0
    action: str = ""
    node_id: int = 0
    cost: float = 0.0
    value: float = 0.0
    upper_bound: float | None = None
    decision_path: list[int] = field(default_factory=list)
    status: NodeStatus = NodeStatus.EXPLORING
    explanation: str = ""
    subset_index: int | None = None
    is_feasible: bool = True
    is_incumbent_update: bool = False
    best_value_so_far: float = 0.0
    item_name: str = ""
    remaining_budget: float = 0.0


@dataclass
class ExecutionTrace:
    """Ordered collection of trace steps for an algorithm execution.

    Attributes:
        steps: Ordered list of TraceStep instances.
        algorithm: Name of the algorithm that produced this trace.
        summary: Human-readable summary of the execution.
    """
    steps: list[TraceStep] = field(default_factory=list)
    algorithm: str = ""
    summary: str = ""

    def add_step(self, step: TraceStep) -> None:
        """Add a step to the trace."""
        self.steps.append(step)

    def __len__(self) -> int:
        return len(self.steps)

    def __getitem__(self, index: int) -> TraceStep:
        return self.steps[index]


@dataclass
class ExecutionMetrics:
    """Comprehensive performance counters for algorithm execution.

    Attributes:
        nodes_generated: Total nodes created in the search tree.
        nodes_expanded: Nodes whose children were explored.
        nodes_pruned_infeasible: Nodes pruned due to constraint violation.
        nodes_pruned_bounds: Nodes pruned because upper bound <= best value.
        incumbent_updates: Number of times the best solution was updated.
        execution_time_ms: Wall-clock execution time in milliseconds.
        memory_bytes: Peak memory usage in bytes.
        subsets_examined: Total subsets evaluated (brute force).
        feasible_subsets: Number of feasible subsets found.
        infeasible_subsets: Number of infeasible subsets found.
        max_frontier_size: Maximum size of the frontier/open list (best-first).
    """
    nodes_generated: int = 0
    nodes_expanded: int = 0
    nodes_pruned_infeasible: int = 0
    nodes_pruned_bounds: int = 0
    incumbent_updates: int = 0
    execution_time_ms: float = 0.0
    memory_bytes: int = 0
    subsets_examined: int = 0
    feasible_subsets: int = 0
    infeasible_subsets: int = 0
    max_frontier_size: int = 0

    @property
    def total_pruned(self) -> int:
        """Total nodes pruned by any reason."""
        return self.nodes_pruned_infeasible + self.nodes_pruned_bounds

    @property
    def pruning_efficiency(self) -> float:
        """Fraction of generated nodes that were pruned (0.0-1.0)."""
        if self.nodes_generated == 0:
            return 0.0
        return self.total_pruned / self.nodes_generated


class HighResTimer:
    """Context manager for high-resolution timing using time.perf_counter_ns().

    Usage:
        with HighResTimer() as timer:
            # ... code to time ...
        elapsed_ms = timer.elapsed_ms
        elapsed_ns = timer.elapsed_ns

    Also tracks peak memory using tracemalloc when track_memory=True.
    """

    def __init__(self, track_memory: bool = True) -> None:
        self._track_memory = track_memory
        self._start_ns: int = 0
        self._end_ns: int = 0
        self._peak_memory: int = 0

    def __enter__(self) -> HighResTimer:
        if self._track_memory:
            tracemalloc.start()
        self._start_ns = time.perf_counter_ns()
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        self._end_ns = time.perf_counter_ns()
        if self._track_memory:
            _, peak = tracemalloc.get_traced_memory()
            self._peak_memory = peak
            tracemalloc.stop()

    @property
    def elapsed_ns(self) -> int:
        """Elapsed time in nanoseconds."""
        return self._end_ns - self._start_ns

    @property
    def elapsed_ms(self) -> float:
        """Elapsed time in milliseconds."""
        return self.elapsed_ns / 1_000_000

    @property
    def elapsed_s(self) -> float:
        """Elapsed time in seconds."""
        return self.elapsed_ns / 1_000_000_000

    @property
    def peak_memory_bytes(self) -> int:
        """Peak memory usage in bytes during the timed block."""
        return self._peak_memory
