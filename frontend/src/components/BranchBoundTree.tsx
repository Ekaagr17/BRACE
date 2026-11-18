import React from 'react';
import type { TreeNode } from '@/types';

interface BranchBoundTreeProps {
  nodes: TreeNode[];
  currentNodeId?: number | string | null;
  onSelectNode?: (node: TreeNode) => void;
  height?: number;
}

// Strict palette: Cyan, Red, Gold, Titanium, Silver (No purple)
const STATUS_COLORS: Record<string, string> = {
  exploring: '#00f0ff',        // Arc Reactor Cyan
  pruned_infeasible: '#ff1e42', // Stark Red
  pruned_bound: '#d4af37',     // Metallic Gold
  feasible: '#8b9bb4',         // Titanium
  optimal: '#00f0ff',          // Arc Reactor Cyan
  incumbent_update: '#d4af37', // Metallic Gold
  leaf: '#94a3b8',             // Muted Silver
};

const BranchBoundTree: React.FC<BranchBoundTreeProps> = ({
  nodes,
  currentNodeId = null,
  onSelectNode,
  height = 500,
}) => {
  const width = 850;

  // Build tree layout positions by level
  const { nodePositions, maxLevel } = React.useMemo(() => {
    const pos: Record<string | number, { x: number; y: number }> = {};
    if (!nodes || nodes.length === 0) return { nodePositions: pos, maxLevel: 0 };

    // Group nodes by level
    const levelMap: Record<number, TreeNode[]> = {};
    let maxL = 0;
    nodes.forEach((n) => {
      const lvl = n.level || 0;
      if (!levelMap[lvl]) levelMap[lvl] = [];
      levelMap[lvl].push(n);
      if (lvl > maxL) maxL = lvl;
    });

    const levelHeight = Math.max(65, (height - 80) / Math.max(1, maxL + 1));

    Object.entries(levelMap).forEach(([lvlStr, levelNodes]) => {
      const lvl = parseInt(lvlStr, 10);
      const count = levelNodes.length;
      const stepX = width / (count + 1);

      levelNodes.forEach((node, idx) => {
        pos[node.id] = {
          x: stepX * (idx + 1),
          y: 40 + lvl * levelHeight,
        };
      });
    });

    return { nodePositions: pos, maxLevel: maxL };
  }, [nodes, height]);

  // Find parent-child edges
  const edges = React.useMemo(() => {
    const list: { from: { x: number; y: number }; to: { x: number; y: number }; decision?: number }[] = [];
    nodes.forEach((n) => {
      if (n.parent_id !== undefined && n.parent_id !== null && String(n.parent_id) !== '-1') {
        const pPos = nodePositions[n.parent_id];
        const cPos = nodePositions[n.id];
        if (pPos && cPos) {
          list.push({
            from: pPos,
            to: cPos,
            decision: n.decision,
          });
        }
      }
    });
    return list;
  }, [nodes, nodePositions]);

  return (
    <div className="relative w-full max-w-full overflow-hidden rounded-lg border border-[#283142] bg-[#0d0f12] shadow-xl">
      <div className="flex flex-wrap items-center justify-between border-b border-[#283142] px-4 py-2.5 bg-[#11141a]">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-sm bg-[#00f0ff]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#f8fafc] font-mono">
            Binary State-Space Search Tree
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-[#94a3b8] font-mono">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-[#00f0ff]" /> Optimal Path
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-[#d4af37]" /> Pruned (UB ≤ Z*)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-[#ff1e42]" /> Infeasible (Cost &gt; B)
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto select-none max-w-full"
        style={{ minHeight: `${height}px`, display: 'block' }}
      >
        <defs>
          <filter id="node-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Tree Edges */}
        <g className="edges">
          {edges.map((e, idx) => (
            <g key={`edge-${idx}`}>
              <line x1={e.from.x} y1={e.from.y} x2={e.to.x} y2={e.to.y} stroke="#283142" strokeWidth={1.5} />
              {/* Branch Decision Label (x=1 or x=0) */}
              <text
                x={(e.from.x + e.to.x) / 2 + (e.to.x > e.from.x ? 8 : -14)}
                y={(e.from.y + e.to.y) / 2}
                fill="#8b9bb4"
                fontSize={9}
                fontFamily="JetBrains Mono, monospace"
              >
                {e.decision === 1 ? 'x=1' : e.decision === 0 ? 'x=0' : ''}
              </text>
            </g>
          ))}
        </g>

        {/* Tree Nodes */}
        <g className="nodes">
          {nodes.map((node) => {
            const pos = nodePositions[node.id];
            if (!pos) return null;

            const isCurrent = currentNodeId === node.id;
            const statusColor = STATUS_COLORS[node.status || 'exploring'] || '#8b9bb4';
            const ubText = node.upper_bound !== undefined ? `UB:${node.upper_bound.toFixed(0)}` : '';

            return (
              <g
                key={`tree-node-${node.id}`}
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer"
                onClick={() => onSelectNode && onSelectNode(node)}
              >
                {isCurrent && (
                  <circle
                    r={20}
                    fill="none"
                    stroke="#00f0ff"
                    strokeWidth={2}
                    strokeDasharray="4 2"
                    filter="url(#node-glow)"
                  />
                )}

                {/* Node Box */}
                <circle r={13} fill="#11141a" stroke={statusColor} strokeWidth={isCurrent ? 2.5 : 1.5} />

                {/* Node ID */}
                <text
                  textAnchor="middle"
                  dy={4}
                  fill="#f8fafc"
                  fontSize={10}
                  fontWeight={600}
                  fontFamily="JetBrains Mono, monospace"
                >
                  {node.id}
                </text>

                {/* Upper Bound Pill */}
                <text
                  y={21}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize={8}
                  fontFamily="JetBrains Mono, monospace"
                >
                  {ubText}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

export default BranchBoundTree;
