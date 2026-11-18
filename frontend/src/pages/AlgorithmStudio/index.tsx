import React, { useEffect, useState } from 'react';
import OrionCard from '@/components/OrionCard';
import AnimationControls from '@/components/AnimationControls';
import BranchBoundTree from '@/components/BranchBoundTree';
import Badge from '@/components/Badge';
import useAlgorithmStore from '@/store/algorithmStore';
import type { AlgorithmType, TreeNode } from '@/types';
import {
  Layers,
  Cpu,
  Play,
  RotateCcw,
  CheckCircle,
  XCircle,
  HelpCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';

const ALGORITHM_OPTIONS: { id: AlgorithmType; label: string; complexity: string }[] = [
  { id: 'branch_and_bound_dfs', label: 'Branch & Bound (DFS)', complexity: 'O(2ⁿ) with Pruning' },
  { id: 'branch_and_bound_best_first', label: 'Branch & Bound (Best-First)', complexity: 'O(2ⁿ) Priority Queue' },
  { id: 'greedy', label: 'Greedy Heuristic', complexity: 'O(n log n) Sort Ratio' },
  { id: 'brute_force', label: 'Brute Force Enumeration', complexity: 'O(n · 2ⁿ) Exhaustive' },
];

const AlgorithmStudio: React.FC = () => {
  const {
    selectedAlgorithm,
    execution,
    currentStepIndex,
    isPlaying,
    playbackSpeed,
    items,
    budget,
    loading,
    setAlgorithm,
    executeAlgorithm,
    stepForward,
    stepBackward,
    goToStep,
    play,
    pause,
    restart,
    setSpeed,
    getCurrentStep,
  } = useAlgorithmStore();

  const [selectedTreeNode, setSelectedTreeNode] = useState<TreeNode | null>(null);

  useEffect(() => {
    executeAlgorithm();
  }, [selectedAlgorithm]);

  // Synchronized animation playback loop for state-space tree traversal
  useEffect(() => {
    if (!isPlaying) return;
    const intervalTime = Math.max(180, Math.round(1000 / playbackSpeed));
    const timer = setInterval(() => {
      const state = useAlgorithmStore.getState();
      if (!state.execution) return;
      if (state.currentStepIndex >= state.execution.steps.length - 1) {
        state.pause();
      } else {
        state.stepForward();
      }
    }, intervalTime);
    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed]);

  const currentStep = getCurrentStep();
  const steps = execution?.steps || [];
  const treeNodes = execution?.tree_nodes || [];

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Studio Header & Configuration Bar */}
      <OrionCard glow="red" className="p-4 border-[#ff1e42]/40">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded bg-[#ff1e42]/15 text-[#ff1e42] border border-[#ff1e42]/30">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#f8fafc]">Algorithm Studio: Step-by-Step Deep Trace</h2>
                <Badge variant="gold">DAA VISUALIZER</Badge>
              </div>
              <p className="text-xs text-[#8b9bb4]">
                Interactive state-space exploration, branch-pruning inspection, and step replay
              </p>
            </div>
          </div>

          {/* Algorithm Paradigm Selector */}
          <div className="flex flex-wrap items-center gap-2">
            {ALGORITHM_OPTIONS.map((alg) => (
              <button
                key={alg.id}
                onClick={() => setAlgorithm(alg.id)}
                className={`px-3 py-1.5 rounded border text-xs font-mono font-semibold transition-colors ${
                  selectedAlgorithm === alg.id
                    ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#d4af37]'
                    : 'bg-[#171c24] border-[#1e2430] text-[#8b9bb4] hover:text-[#d4af37]'
                }`}
              >
                {alg.label}
              </button>
            ))}
          </div>
        </div>
      </OrionCard>

      {/* Animation Playback Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded border border-[#1e2430] bg-[#11141a]">
        <AnimationControls
          isPlaying={isPlaying}
          onPlay={play}
          onPause={pause}
          onRestart={restart}
          onStepForward={stepForward}
          onStepBackward={stepBackward}
          speed={playbackSpeed}
          onSpeedChange={setSpeed}
        />

        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-[#8b9bb4]">
            Step <strong className="text-[#f8fafc]">{currentStepIndex + 1}</strong> of{' '}
            <strong className="text-[#f8fafc]">{steps.length}</strong>
          </span>
          <span className="text-[#d4af37]">
            Best Value Z*: <strong className="font-bold">${currentStep?.best_value || execution?.final_value || 0}</strong>
          </span>
          <span className="text-[#ff1e42]">
            Budget: <strong className="font-bold">${budget}</strong>
          </span>
        </div>
      </div>

      {/* Main Visualizer Area */}
      {selectedAlgorithm.includes('branch_and_bound') ? (
        /* Branch and Bound Tree Visualizer */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <OrionCard glow="cyan" className="p-3">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-mono text-[#8b9bb4] uppercase tracking-wider">
                  State-Space Tree Visualizer ({treeNodes.length} Generated Nodes)
                </span>
                <span className="text-xs text-[#00f0ff] font-mono">Click node to inspect upper bound</span>
              </div>
              <BranchBoundTree
                nodes={treeNodes}
                currentNodeId={currentStep?.step_number}
                onSelectNode={(node) => setSelectedTreeNode(node)}
                height={520}
              />
            </OrionCard>
          </div>

          {/* Node Inspector Sidebar */}
          <div>
            <OrionCard glow="titanium" className="sticky top-6">
              <div className="pb-3 border-b border-[#1e2430] mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#f8fafc]">
                  Node Bound Inspector
                </h3>
                <span className="text-[10px] text-[#8b9bb4] font-mono">Relaxation & Pruning Analytics</span>
              </div>

              {selectedTreeNode ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-[#8b9bb4]">Node ID & Level</span>
                    <div className="text-sm font-bold text-[#f8fafc] font-mono">
                      Node #{selectedTreeNode.id} (Depth Level {selectedTreeNode.level})
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-[#171c24] border border-[#1e2430]">
                    <span className="text-[10px] text-[#8b9bb4] uppercase font-mono block">Status</span>
                    <Badge variant={selectedTreeNode.status === 'optimal' ? 'success' : 'gold'}>
                      {selectedTreeNode.status?.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 font-mono">
                    <div className="flex justify-between p-2 rounded bg-[#171c24] border border-[#1e2430]">
                      <span className="text-[#8b9bb4]">Accumulated Cost:</span>
                      <span className="font-bold text-[#f8fafc]">${selectedTreeNode.cost?.toFixed(1) || '0.0'}</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-[#171c24] border border-[#1e2430]">
                      <span className="text-[#8b9bb4]">Accumulated Value:</span>
                      <span className="font-bold text-[#00f0ff]">+{selectedTreeNode.value?.toFixed(1) || '0.0'}</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-[#171c24] border border-[#d4af37]/30">
                      <span className="text-[#d4af37]">Upper Bound UB:</span>
                      <span className="font-bold text-[#d4af37]">{selectedTreeNode.upper_bound?.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded bg-[#11141a] border border-[#1e2430] text-[11px] text-[#8b9bb4] leading-relaxed">
                    <strong className="text-[#f8fafc] block mb-1">Pruning Rule:</strong>
                    If <span className="font-mono text-[#d4af37]">UB(x) ≤ Z_best</span>, no integer completion
                    can beat the current best solution, so the subtree is safely pruned.
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-xs text-[#8b9bb4]">
                  Click on any tree node to inspect its fractional knapsack relaxation bound
                </div>
              )}
            </OrionCard>
          </div>
        </div>
      ) : selectedAlgorithm === 'greedy' ? (
        /* Greedy Selection Visualizer */
        <OrionCard glow="titanium">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#f8fafc]">Greedy Value-to-Cost Selection Cascade</h3>
              <p className="text-xs text-[#8b9bb4]">
                Items sorted descending by ratio <span className="font-mono text-[#d4af37]">r_i = v_i / c_i</span>.
                Greedily selects items that fit within remaining budget.
              </p>
            </div>
            <Badge variant="cyan">O(n log n)</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {items.map((item: any, idx: number) => {
              const ratio = item.cost > 0 ? (item.value / item.cost).toFixed(2) : '0';
              const isSelected = execution?.selected_items?.includes(item.id);

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded border transition-colors ${
                    isSelected
                      ? 'bg-[#171c24] border-[#00f0ff]'
                      : 'bg-[#11141a] border-[#1e2430]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono text-[#8b9bb4]">Rank #{idx + 1}</span>
                    <Badge variant={isSelected ? 'success' : 'neutral'}>
                      {isSelected ? 'SELECTED' : 'REJECTED'}
                    </Badge>
                  </div>
                  <div className="text-xs font-bold text-[#f8fafc] mb-2">{item.name}</div>
                  <div className="space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between text-[#8b9bb4]">
                      <span>Cost c_i:</span> <span className="text-[#f8fafc]">${item.cost}</span>
                    </div>
                    <div className="flex justify-between text-[#8b9bb4]">
                      <span>Value v_i:</span> <span className="text-[#00f0ff]">+{item.value}</span>
                    </div>
                    <div className="flex justify-between text-[#d4af37] font-bold pt-1 border-t border-[#1e2430]">
                      <span>Ratio r_i:</span> <span>{ratio} v/c</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </OrionCard>
      ) : (
        /* Brute Force Subset Enumeration Visualizer */
        <OrionCard glow="red">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#f8fafc]">Exhaustive Subset Enumeration Trace</h3>
              <p className="text-xs text-[#8b9bb4]">
                Evaluates all 2ⁿ possible subsets. Guaranteed optimal, but incurs exponential runtime O(n · 2ⁿ).
              </p>
            </div>
            <Badge variant="danger">2ⁿ SUBSETS</Badge>
          </div>

          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
            {steps.slice(0, 100).map((st: any, idx: number) => (
              <div
                key={idx}
                className={`p-2.5 rounded border text-xs font-mono flex items-center justify-between ${
                  idx === currentStepIndex
                    ? 'bg-[#171c24] border-[#ff1e42]'
                    : 'bg-[#11141a] border-[#1e2430]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[#8b9bb4]">#{st.step_number}</span>
                  <span className="text-[#f8fafc] truncate max-w-lg">{st.description}</span>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <span className="text-[#8b9bb4]">Cost: ${st.current_cost}</span>
                  <span className="text-[#00f0ff]">Val: +{st.current_value}</span>
                  <Badge variant={st.action === 'update_best' ? 'success' : st.action === 'skip' ? 'danger' : 'neutral'}>
                    {st.action?.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </OrionCard>
      )}

      {/* Current Step Explanation Banner */}
      <OrionCard>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-[#00f0ff]/15 text-[#00f0ff]">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-[#8b9bb4]">Current Step Trace Log</span>
            <div className="text-xs text-[#f8fafc] font-mono mt-0.5">
              {currentStep?.description || 'Executing algorithmic traversal...'}
            </div>
          </div>
        </div>
      </OrionCard>
    </div>
  );
};

export default AlgorithmStudio;
