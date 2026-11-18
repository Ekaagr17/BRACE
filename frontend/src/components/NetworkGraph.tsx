import React from 'react';
import type { Asset, Connection } from '@/types';

interface NetworkGraphProps {
  assets: Asset[];
  connections: Connection[];
  activeAttackPath?: string[];
  compromisedAssetIds?: string[];
  selectedAssetId?: string | null;
  onSelectAsset?: (asset: Asset) => void;
  height?: number;
}

// Strict palette: Cyan, Gold, Red, Titanium, Silver
const ASSET_COLORS: Record<string, string> = {
  server: '#00f0ff',        // Arc Reactor Cyan
  workstation: '#8b9bb4',   // Titanium
  database: '#d4af37',      // Metallic Gold
  router: '#8b9bb4',        // Titanium
  firewall: '#00f0ff',      // Arc Reactor Cyan
  iot_device: '#d4af37',    // Metallic Gold
  cloud_service: '#00f0ff', // Arc Reactor Cyan
};

const NetworkGraph: React.FC<NetworkGraphProps> = ({
  assets,
  connections,
  activeAttackPath = [],
  compromisedAssetIds = [],
  selectedAssetId = null,
  onSelectAsset,
  height = 480,
}) => {
  const width = 800;
  const padding = 65;
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2 - padding;

  const nodePositions = React.useMemo(() => {
    const pos: Record<string, { x: number; y: number }> = {};
    const n = assets.length;

    assets.forEach((asset, idx) => {
      if (asset.x && asset.y && asset.x > 0 && asset.y > 0) {
        pos[asset.id] = { x: asset.x, y: asset.y };
      } else {
        const angle = (idx / Math.max(1, n)) * 2 * Math.PI - Math.PI / 2;
        pos[asset.id] = {
          x: cx + radius * Math.cos(angle) * (0.85 + (idx % 2) * 0.15),
          y: cy + radius * Math.sin(angle) * (0.85 + (idx % 2) * 0.15),
        };
      }
    });
    return pos;
  }, [assets, cx, cy, radius]);

  const isAttackEdge = (src: string, tgt: string) => {
    if (!activeAttackPath || activeAttackPath.length < 2) return false;
    for (let i = 0; i < activeAttackPath.length - 1; i++) {
      if (
        (activeAttackPath[i] === src && activeAttackPath[i + 1] === tgt) ||
        (activeAttackPath[i] === tgt && activeAttackPath[i + 1] === src)
      ) {
        return true;
      }
    }
    return false;
  };

  return (
    <div className="relative w-full max-w-full overflow-hidden rounded-lg border border-[#283142] bg-[#0d0f12] shadow-xl">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto select-none max-w-full"
        style={{ minHeight: `${height}px`, display: 'block' }}
      >
        <defs>
          <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-red" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="net-grid" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1e2430" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0a0c0f" stopOpacity="0.9" />
          </radialGradient>
        </defs>

        <rect width={width} height={height} fill="url(#net-grid)" />

        {/* Network Connections */}
        <g className="connections">
          {connections.map((c, i) => {
            const p1 = nodePositions[c.source];
            const p2 = nodePositions[c.target];
            if (!p1 || !p2) return null;
            const attackEdge = isAttackEdge(c.source, c.target);

            return (
              <line
                key={`edge-${c.id || i}`}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={attackEdge ? '#ff1e42' : '#283142'}
                strokeWidth={attackEdge ? 3 : 1.5}
                strokeDasharray={attackEdge ? '6 4' : undefined}
                opacity={attackEdge ? 1.0 : 0.6}
              />
            );
          })}
        </g>

        {/* Network Asset Nodes */}
        <g className="nodes">
          {assets.map((asset) => {
            const pos = nodePositions[asset.id];
            if (!pos) return null;

            const isCompromised = asset.compromised || compromisedAssetIds.includes(asset.id);
            const isSelected = selectedAssetId === asset.id;
            const isInPath = activeAttackPath.includes(asset.id);
            const nodeColor = isCompromised ? '#ff1e42' : ASSET_COLORS[asset.asset_type] || '#00f0ff';

            return (
              <g
                key={`node-${asset.id}`}
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer"
                onClick={() => onSelectAsset && onSelectAsset(asset)}
              >
                {/* Active Selection / Compromised Ring */}
                {(isCompromised || isSelected || isInPath) && (
                  <circle
                    r={isSelected ? 24 : 20}
                    fill="none"
                    stroke={isCompromised ? '#ff1e42' : '#00f0ff'}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    strokeDasharray={isInPath ? '4 2' : undefined}
                    filter={isCompromised ? 'url(#glow-red)' : 'url(#glow-cyan)'}
                    opacity={0.8}
                  />
                )}

                {/* Node Outer Body */}
                <circle r={15} fill="#11141a" stroke={nodeColor} strokeWidth={2} />

                {/* Node Inner Badge */}
                <circle r={6} fill={nodeColor} />

                {/* Node Label */}
                <text
                  y={27}
                  textAnchor="middle"
                  fill="#f8fafc"
                  fontSize={11}
                  fontWeight={600}
                  fontFamily="Inter, sans-serif"
                >
                  {asset.name}
                </text>

                {/* Asset Type Micro-tag */}
                <text
                  y={38}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize={9}
                  fontFamily="JetBrains Mono, monospace"
                >
                  {asset.asset_type.toUpperCase()}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

export default NetworkGraph;
