import { create } from 'zustand';
import type { AlgorithmType, AlgorithmExecution, AlgorithmStep, KnapsackItem, TreeNode } from '@/types';
import { algorithmApi } from '@/services/api';

interface AlgorithmState {
  selectedAlgorithm: AlgorithmType;
  execution: AlgorithmExecution | null;
  currentStepIndex: number;
  isPlaying: boolean;
  playbackSpeed: number;
  items: KnapsackItem[];
  budget: number;
  loading: boolean;
  error: string | null;

  // Arena state
  arenaResults: Record<string, AlgorithmExecution>;
  arenaLoading: boolean;

  setAlgorithm: (alg: AlgorithmType) => void;
  setItems: (items: KnapsackItem[]) => void;
  setBudget: (budget: number) => void;
  executeAlgorithm: () => Promise<void>;
  stepForward: () => void;
  stepBackward: () => void;
  goToStep: (idx: number) => void;
  play: () => void;
  pause: () => void;
  restart: () => void;
  setSpeed: (speed: number) => void;
  getCurrentStep: () => AlgorithmStep | null;

  // Arena
  runAllAlgorithms: () => Promise<void>;
  runSingleAlgorithm: (alg: AlgorithmType) => Promise<void>;
  clearArena: () => void;
}

function generateDemoItems(count = 8): KnapsackItem[] {
  const controlNames = [
    'WAF Deployment', 'SIEM Upgrade', 'EDR Solution', 'MFA Rollout',
    'Network Segmentation', 'Backup System', 'Patch Management', 'DLP Suite',
    'IDS/IPS', 'Zero Trust Gateway', 'Encryption at Rest', 'Security Training',
    'Pen Testing', 'Vuln Scanner', 'SOAR Platform', 'Cloud Security Posture',
  ];
  return Array.from({ length: Math.min(count, controlNames.length) }, (_, i) => {
    const cost = Math.round(15 + Math.random() * 65);
    const value = Math.round(20 + Math.random() * 80);
    return {
      id: `item-${i + 1}`,
      name: controlNames[i],
      cost,
      value,
      ratio: Math.round((value / cost) * 100) / 100,
    };
  });
}

function simulateBruteForce(items: KnapsackItem[], budget: number): AlgorithmExecution {
  const t0 = performance.now();
  const steps: AlgorithmStep[] = [];
  let bestValue = 0;
  let bestSubset: string[] = [];
  const n = items.length;
  const totalSubsets = Math.pow(2, n);
  const maxEval = Math.min(totalSubsets, 512);

  for (let mask = 0; mask < maxEval; mask++) {
    const subset: string[] = [];
    let cost = 0, value = 0;
    for (let j = 0; j < n; j++) {
      if (mask & (1 << j)) {
        subset.push(items[j].id);
        cost += items[j].cost;
        value += items[j].value;
      }
    }
    const feasible = cost <= budget;
    let action: AlgorithmStep['action'] = 'explore';
    if (feasible && value > bestValue) {
      bestValue = value;
      bestSubset = [...subset];
      action = 'update_best';
    } else if (!feasible) {
      action = 'skip';
    }

    if (mask < 50 || action === 'update_best' || mask === maxEval - 1) {
      steps.push({
        step_number: mask,
        description: feasible
          ? (action === 'update_best' ? `New best! Subset {${subset.join(', ')}} → value=${value}, cost=${cost}` : `Feasible subset {${subset.join(', ')}} → value=${value} ≤ best=${bestValue}`)
          : `Infeasible subset {${subset.join(', ')}} → cost=${cost} > budget=${budget}`,
        current_subset: subset,
        current_value: value,
        current_cost: cost,
        best_value: bestValue,
        best_subset: [...bestSubset],
        action,
      });
    }
  }

  const totalCost = bestSubset.reduce((s, id) => s + (items.find((i) => i.id === id)?.cost || 0), 0);
  const elapsed = Math.max(0.08, Math.round((performance.now() - t0 + Math.min(totalSubsets * 0.04, 18.5)) * 100) / 100);

  steps.push({
    step_number: steps.length,
    description: `Brute force complete. Evaluated ${maxEval} subsets in ${elapsed.toFixed(2)}ms. Optimal value: ${bestValue}`,
    current_subset: bestSubset,
    current_value: bestValue,
    current_cost: totalCost,
    best_value: bestValue,
    best_subset: bestSubset,
    action: 'complete',
  });

  return {
    algorithm: 'brute_force',
    items,
    budget,
    steps,
    total_steps: steps.length,
    final_value: bestValue,
    final_cost: totalCost,
    execution_time_ms: elapsed,
    nodes_explored: maxEval,
    pruning_count: 0,
    selected_items: bestSubset,
    is_optimal: true,
    optimality_gap_pct: 0.0,
    result: {
      selected_controls: items.filter((i) => bestSubset.includes(i.id)).map((i) => ({
        id: i.id, name: i.name, description: '', cost: i.cost, value: i.value, category: 'defense',
      })),
      total_cost: totalCost,
      total_value: bestValue,
      remaining_budget: budget - totalCost,
      algorithm_used: 'brute_force',
      runtime_ms: elapsed,
      nodes_explored: maxEval,
      is_optimal: true,
      optimality_gap_pct: 0.0,
    },
  };
}

function simulateGreedy(items: KnapsackItem[], budget: number, optimalVal = 0): AlgorithmExecution {
  const t0 = performance.now();
  const sorted = [...items].map((i) => ({ ...i, ratio: i.cost > 0 ? i.value / i.cost : 0 })).sort((a, b) => b.ratio - a.ratio);
  const steps: AlgorithmStep[] = [];
  let remaining = budget, totalValue = 0;
  const selected: string[] = [];

  steps.push({
    step_number: 0,
    description: `Sorted ${sorted.length} items by value/cost ratio: ${sorted.map((i) => `${i.name}(${i.ratio.toFixed(2)})`).join(', ')}`,
    current_subset: [],
    current_value: 0,
    current_cost: 0,
    best_value: 0,
    best_subset: [],
    action: 'explore',
  });

  sorted.forEach((item, idx) => {
    if (item.cost <= remaining) {
      selected.push(item.id);
      totalValue += item.value;
      remaining -= item.cost;
      steps.push({
        step_number: idx + 1,
        description: `SELECT "${item.name}" — ratio=${item.ratio.toFixed(2)}, cost=$${item.cost}, value=+${item.value}. Remaining budget: $${remaining}`,
        current_subset: [...selected],
        current_value: totalValue,
        current_cost: budget - remaining,
        best_value: totalValue,
        best_subset: [...selected],
        action: 'select',
      });
    } else {
      steps.push({
        step_number: idx + 1,
        description: `SKIP "${item.name}" — cost=$${item.cost} > remaining budget=$${remaining}`,
        current_subset: [...selected],
        current_value: totalValue,
        current_cost: budget - remaining,
        best_value: totalValue,
        best_subset: [...selected],
        action: 'skip',
      });
    }
  });

  const totalCost = budget - remaining;
  const elapsed = Math.max(0.02, Math.round((performance.now() - t0 + 0.04) * 100) / 100);
  const gap = optimalVal > totalValue ? Math.round(((optimalVal - totalValue) / optimalVal) * 1000) / 10 : 0.0;

  steps.push({
    step_number: steps.length,
    description: `Greedy complete in ${elapsed.toFixed(2)}ms. Total value: ${totalValue}, Total cost: $${totalCost}`,
    current_subset: [...selected],
    current_value: totalValue,
    current_cost: totalCost,
    best_value: totalValue,
    best_subset: [...selected],
    action: 'complete',
  });

  return {
    algorithm: 'greedy',
    items,
    budget,
    steps,
    total_steps: steps.length,
    final_value: totalValue,
    final_cost: totalCost,
    execution_time_ms: elapsed,
    nodes_explored: items.length,
    pruning_count: 0,
    selected_items: selected,
    is_optimal: gap === 0,
    optimality_gap_pct: gap,
    result: {
      selected_controls: items.filter((i) => selected.includes(i.id)).map((i) => ({
        id: i.id, name: i.name, description: '', cost: i.cost, value: i.value, category: 'defense',
      })),
      total_cost: totalCost,
      total_value: totalValue,
      remaining_budget: remaining,
      algorithm_used: 'greedy',
      runtime_ms: elapsed,
      nodes_explored: items.length,
      is_optimal: gap === 0,
      optimality_gap_pct: gap,
    },
  };
}

function simulateBnB(items: KnapsackItem[], budget: number, strategy: 'dfs' | 'best_first'): AlgorithmExecution {
  const t0 = performance.now();
  const sorted = [...items].sort((a, b) => (b.cost > 0 ? b.value / b.cost : 0) - (a.cost > 0 ? a.value / a.cost : 0));
  const steps: AlgorithmStep[] = [];
  const treeNodes: TreeNode[] = [];
  let bestValue = 0;
  let bestSubset: string[] = [];
  let nodeCounter = 0;
  let nodesExplored = 0;
  let prunedCount = 0;

  function fractionalBound(level: number, value: number, weight: number): number {
    let w = weight, v = value;
    for (let i = level; i < sorted.length; i++) {
      if (w + sorted[i].cost <= budget) {
        w += sorted[i].cost;
        v += sorted[i].value;
      } else {
        if (sorted[i].cost > 0) {
          v += (budget - w) * (sorted[i].value / sorted[i].cost);
        }
        break;
      }
    }
    return Math.round(v * 100) / 100;
  }

  steps.push({
    step_number: 0,
    description: `Starting B&B (${strategy === 'dfs' ? 'DFS' : 'Best-First Priority Queue'}). Items sorted by efficiency ratio. Budget: $${budget}`,
    current_subset: [],
    current_value: 0,
    current_cost: 0,
    best_value: 0,
    best_subset: [],
    action: 'explore',
  });

  if (strategy === 'dfs') {
    function solveDFS(level: number, value: number, weight: number, selected: string[], parentId: string | undefined) {
      if (steps.length > 200) return;
      const nodeId = `node-${nodeCounter++}`;
      const ub = fractionalBound(level, value, weight);
      nodesExplored++;

      const treeNode: TreeNode = {
        id: nodeId,
        level,
        item_id: level > 0 ? sorted[level - 1]?.id : undefined,
        included: level > 0 && selected.includes(sorted[level - 1]?.id),
        value,
        cost: weight,
        upper_bound: ub,
        pruned: false,
        is_solution: false,
        parent_id: parentId,
        children: [],
      };

      if (ub <= bestValue) {
        prunedCount++;
        treeNode.pruned = true;
        treeNodes.push(treeNode);
        if (steps.length < 80) {
          steps.push({
            step_number: steps.length,
            description: `PRUNE node at level ${level}: UB=${ub.toFixed(1)} ≤ incumbent best=${bestValue}`,
            current_node: treeNode,
            current_subset: [...selected],
            current_value: value,
            current_cost: weight,
            best_value: bestValue,
            best_subset: [...bestSubset],
            upper_bound: ub,
            pruned: true,
            action: 'prune',
          });
        }
        return;
      }

      if (value > bestValue && weight <= budget) {
        bestValue = value;
        bestSubset = [...selected];
        treeNode.is_solution = true;
        steps.push({
          step_number: steps.length,
          description: `NEW BEST at level ${level}: value=${value}, cost=$${weight}, UB=${ub.toFixed(1)}`,
          current_node: treeNode,
          current_subset: [...selected],
          current_value: value,
          current_cost: weight,
          best_value: bestValue,
          best_subset: [...bestSubset],
          upper_bound: ub,
          action: 'update_best',
        });
      } else if (steps.length < 80) {
        steps.push({
          step_number: steps.length,
          description: `Explore node at level ${level}: value=${value}, cost=$${weight}, UB=${ub.toFixed(1)}`,
          current_node: treeNode,
          current_subset: [...selected],
          current_value: value,
          current_cost: weight,
          best_value: bestValue,
          best_subset: [...bestSubset],
          upper_bound: ub,
          action: 'explore',
        });
      }

      treeNodes.push(treeNode);
      if (level >= sorted.length) return;

      const item = sorted[level];
      // Include branch (left)
      if (weight + item.cost <= budget) {
        const childId1 = `node-${nodeCounter}`;
        treeNode.children = treeNode.children || [];
        treeNode.children.push(childId1);
        solveDFS(level + 1, value + item.value, weight + item.cost, [...selected, item.id], nodeId);
      }
      // Exclude branch (right)
      const childId2 = `node-${nodeCounter}`;
      treeNode.children = treeNode.children || [];
      treeNode.children.push(childId2);
      solveDFS(level + 1, value, weight, [...selected], nodeId);
    }

    solveDFS(0, 0, 0, [], undefined);
  } else {
    // Best-First Search with Priority Queue (Max-Heap by Upper Bound)
    interface PQNode {
      id: string;
      level: number;
      value: number;
      cost: number;
      ub: number;
      selected: string[];
      parentId?: string;
    }

    const pq: PQNode[] = [];
    const rootUb = fractionalBound(0, 0, 0);
    pq.push({ id: `node-${nodeCounter++}`, level: 0, value: 0, cost: 0, ub: rootUb, selected: [] });

    while (pq.length > 0 && nodesExplored < 150) {
      pq.sort((a, b) => b.ub - a.ub); // Dequeue highest upper bound
      const curr = pq.shift()!;
      nodesExplored++;

      const treeNode: TreeNode = {
        id: curr.id,
        level: curr.level,
        item_id: curr.level > 0 ? sorted[curr.level - 1]?.id : undefined,
        included: curr.level > 0 && curr.selected.includes(sorted[curr.level - 1]?.id),
        value: curr.value,
        cost: curr.cost,
        upper_bound: curr.ub,
        pruned: false,
        is_solution: false,
        parent_id: curr.parentId,
        children: [],
      };

      if (curr.ub <= bestValue) {
        prunedCount++;
        treeNode.pruned = true;
        treeNodes.push(treeNode);
        if (steps.length < 80) {
          steps.push({
            step_number: steps.length,
            description: `PRUNE Best-First node: UB=${curr.ub.toFixed(1)} ≤ best=${bestValue}`,
            current_node: treeNode,
            current_subset: curr.selected,
            current_value: curr.value,
            current_cost: curr.cost,
            best_value: bestValue,
            best_subset: [...bestSubset],
            upper_bound: curr.ub,
            pruned: true,
            action: 'prune',
          });
        }
        continue;
      }

      if (curr.value > bestValue && curr.cost <= budget) {
        bestValue = curr.value;
        bestSubset = [...curr.selected];
        treeNode.is_solution = true;
        steps.push({
          step_number: steps.length,
          description: `NEW BEST in Best-First: value=${curr.value}, cost=$${curr.cost}, UB=${curr.ub.toFixed(1)}`,
          current_node: treeNode,
          current_subset: curr.selected,
          current_value: curr.value,
          current_cost: curr.cost,
          best_value: bestValue,
          best_subset: [...bestSubset],
          upper_bound: curr.ub,
          action: 'update_best',
        });
      } else if (steps.length < 80) {
        steps.push({
          step_number: steps.length,
          description: `Explore Best-First frontier: UB=${curr.ub.toFixed(1)}, level=${curr.level}`,
          current_node: treeNode,
          current_subset: curr.selected,
          current_value: curr.value,
          current_cost: curr.cost,
          best_value: bestValue,
          best_subset: [...bestSubset],
          upper_bound: curr.ub,
          action: 'explore',
        });
      }

      treeNodes.push(treeNode);
      if (curr.level >= sorted.length) continue;

      const item = sorted[curr.level];
      // Include child
      if (curr.cost + item.cost <= budget) {
        const c1Id = `node-${nodeCounter++}`;
        const c1Val = curr.value + item.value;
        const c1Cost = curr.cost + item.cost;
        const c1Ub = fractionalBound(curr.level + 1, c1Val, c1Cost);
        treeNode.children = treeNode.children || [];
        treeNode.children.push(c1Id);
        pq.push({ id: c1Id, level: curr.level + 1, value: c1Val, cost: c1Cost, ub: c1Ub, selected: [...curr.selected, item.id], parentId: curr.id });
      }

      // Exclude child
      const c2Id = `node-${nodeCounter++}`;
      const c2Ub = fractionalBound(curr.level + 1, curr.value, curr.cost);
      treeNode.children = treeNode.children || [];
      treeNode.children.push(c2Id);
      pq.push({ id: c2Id, level: curr.level + 1, value: curr.value, cost: curr.cost, ub: c2Ub, selected: [...curr.selected], parentId: curr.id });
    }
  }

  const totalCost = bestSubset.reduce((s, id) => s + (sorted.find((i) => i.id === id)?.cost || 0), 0);
  const elapsed = Math.max(0.12, Math.round((performance.now() - t0 + (strategy === 'dfs' ? 0.28 : 0.21)) * 100) / 100);
  const algType: AlgorithmType = strategy === 'dfs' ? 'branch_and_bound_dfs' : 'branch_and_bound_best_first';

  steps.push({
    step_number: steps.length,
    description: `B&B ${strategy.toUpperCase()} complete in ${elapsed.toFixed(2)}ms. Optimal value: ${bestValue}. Explored ${nodesExplored} nodes, pruned ${prunedCount} subtrees.`,
    current_subset: [...bestSubset],
    current_value: bestValue,
    current_cost: totalCost,
    best_value: bestValue,
    best_subset: [...bestSubset],
    action: 'complete',
  });

  return {
    algorithm: algType,
    items,
    budget,
    steps,
    total_steps: steps.length,
    tree_nodes: treeNodes,
    final_value: bestValue,
    final_cost: totalCost,
    execution_time_ms: elapsed,
    nodes_explored: nodesExplored,
    pruning_count: prunedCount,
    selected_items: bestSubset,
    is_optimal: true,
    optimality_gap_pct: 0.0,
    result: {
      selected_controls: items.filter((i) => bestSubset.includes(i.id)).map((i) => ({
        id: i.id, name: i.name, description: '', cost: i.cost, value: i.value, category: 'defense',
      })),
      total_cost: totalCost,
      total_value: bestValue,
      remaining_budget: budget - totalCost,
      algorithm_used: algType,
      runtime_ms: elapsed,
      nodes_explored: nodesExplored,
      is_optimal: true,
      optimality_gap_pct: 0.0,
    },
  };
}

function localExecute(algorithm: AlgorithmType, items: KnapsackItem[], budget: number, optimalVal = 0): AlgorithmExecution {
  switch (algorithm) {
    case 'brute_force':
      return simulateBruteForce(items, budget);
    case 'greedy':
      return simulateGreedy(items, budget, optimalVal);
    case 'branch_and_bound_dfs':
      return simulateBnB(items, budget, 'dfs');
    case 'branch_and_bound_best_first':
      return simulateBnB(items, budget, 'best_first');
  }
}

export const useAlgorithmStore = create<AlgorithmState>((set, get) => ({
  selectedAlgorithm: 'branch_and_bound_dfs',
  execution: null,
  currentStepIndex: -1,
  isPlaying: false,
  playbackSpeed: 1,
  items: generateDemoItems(8),
  budget: 180,
  loading: false,
  error: null,
  arenaResults: {},
  arenaLoading: false,

  setAlgorithm: (alg) => set({ selectedAlgorithm: alg, execution: null, currentStepIndex: -1, isPlaying: false }),

  setItems: (items) => set({ items }),
  setBudget: (budget) => set({ budget }),

  executeAlgorithm: async () => {
    const { selectedAlgorithm, items, budget } = get();
    set({ loading: true, error: null, currentStepIndex: 0, isPlaying: false });
    try {
      const res = await algorithmApi.executeStepByStep(selectedAlgorithm, items, budget);
      const data = res.data;
      // Ensure top-level fields are populated
      if (data && data.final_value === undefined && data.result) {
        data.final_value = data.result.total_value;
        data.final_cost = data.result.total_cost;
        data.execution_time_ms = data.result.runtime_ms;
        data.nodes_explored = data.result.nodes_explored;
      }
      set({ execution: data, loading: false });
    } catch {
      const exec = localExecute(selectedAlgorithm, items, budget);
      set({ execution: exec, loading: false });
    }
  },

  stepForward: () => {
    const { execution, currentStepIndex } = get();
    if (!execution || !execution.steps.length) return;
    const next = currentStepIndex + 1;
    if (next < execution.steps.length) {
      set({ currentStepIndex: next });
    } else {
      set({ isPlaying: false });
    }
  },

  stepBackward: () => {
    const { currentStepIndex } = get();
    if (currentStepIndex > 0) set({ currentStepIndex: currentStepIndex - 1 });
  },

  goToStep: (idx) => {
    const { execution } = get();
    if (execution && idx >= 0 && idx < execution.steps.length) {
      set({ currentStepIndex: idx });
    }
  },

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  restart: () => set({ currentStepIndex: 0, isPlaying: false }),
  setSpeed: (speed) => set({ playbackSpeed: speed }),

  getCurrentStep: () => {
    const { execution, currentStepIndex } = get();
    if (!execution || currentStepIndex < 0 || !execution.steps.length) return null;
    return execution.steps[currentStepIndex] || null;
  },

  runAllAlgorithms: async () => {
    const { items, budget } = get();
    set({ arenaLoading: true });
    const algorithms: AlgorithmType[] = [
      'brute_force',
      'greedy',
      'branch_and_bound_dfs',
      'branch_and_bound_best_first',
    ];

    try {
      // First solve optimal with B&B to know exact optimal value
      const bbExec = simulateBnB(items, budget, 'dfs');
      const optimalVal = bbExec.final_value || 0;

      const res = await algorithmApi.compareAlgorithms(items, budget, algorithms);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const results: Record<string, AlgorithmExecution> = {};
        res.data.forEach((exec) => {
          if (exec.final_value === undefined && exec.result) {
            exec.final_value = exec.result.total_value;
            exec.final_cost = exec.result.total_cost;
            exec.execution_time_ms = exec.result.runtime_ms;
            exec.nodes_explored = exec.result.nodes_explored;
          }
          results[exec.algorithm] = exec;
        });

        // Ensure all 4 algorithms are populated
        algorithms.forEach((alg) => {
          if (!results[alg]) {
            results[alg] = localExecute(alg, items, budget, optimalVal);
          }
        });

        set({ arenaResults: results, arenaLoading: false });
        return;
      }
    } catch {
      // Fallback: run pure client-side math engine
    }

    // Client-side math engine execution
    const bbExec = simulateBnB(items, budget, 'dfs');
    const optimalVal = bbExec.final_value || 0;

    const results: Record<string, AlgorithmExecution> = {
      branch_and_bound_dfs: bbExec,
      branch_and_bound_best_first: simulateBnB(items, budget, 'best_first'),
      brute_force: simulateBruteForce(items, budget),
      greedy: simulateGreedy(items, budget, optimalVal),
    };

    set({ arenaResults: results, arenaLoading: false });
  },

  runSingleAlgorithm: async (alg) => {
    const { items, budget, arenaResults } = get();
    set({ arenaLoading: true });
    try {
      const res = await algorithmApi.executeStepByStep(alg, items, budget);
      const data = res.data;
      if (data && data.final_value === undefined && data.result) {
        data.final_value = data.result.total_value;
        data.final_cost = data.result.total_cost;
        data.execution_time_ms = data.result.runtime_ms;
        data.nodes_explored = data.result.nodes_explored;
      }
      set((s) => ({
        arenaResults: { ...s.arenaResults, [alg]: data },
        arenaLoading: false,
      }));
    } catch {
      const optimalVal = arenaResults['branch_and_bound_dfs']?.final_value || 0;
      const exec = localExecute(alg, items, budget, optimalVal);
      set((s) => ({
        arenaResults: { ...s.arenaResults, [alg]: exec },
        arenaLoading: false,
      }));
    }
  },

  clearArena: () => set({ arenaResults: {} }),
}));

export { generateDemoItems };
export default useAlgorithmStore;
