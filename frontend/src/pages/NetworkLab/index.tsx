import React, { useEffect, useState } from 'react';
import OrionCard from '@/components/OrionCard';
import NetworkGraph from '@/components/NetworkGraph';
import Badge from '@/components/Badge';
import { networkApi } from '@/services/api';
import type { Asset, Connection, AssetType } from '@/types';
import {
  Server,
  Plus,
  Trash2,
  RefreshCw,
  Sliders,
  Shield,
  Activity,
  Layers,
} from 'lucide-react';

const ASSET_TYPES: AssetType[] = [
  'server',
  'workstation',
  'database',
  'router',
  'firewall',
  'iot_device',
  'cloud_service',
];

const NetworkLab: React.FC = () => {
  const [network, setNetwork] = useState<{ id: string; name: string; assets: Asset[]; connections: Connection[] }>({
    id: 'net-default',
    name: 'Enterprise Corporate Topology',
    assets: [],
    connections: [],
  });
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(false);
  const [numAssets, setNumAssets] = useState(12);
  const [seed, setSeed] = useState(42);

  // Form for adding new asset
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetType, setNewAssetType] = useState<AssetType>('server');
  const [newCriticality, setNewCriticality] = useState(6);
  const [newVuln, setNewVuln] = useState(0.5);

  const loadCurrentNetwork = async () => {
    setLoading(true);
    try {
      const res = await networkApi.getNetwork('net-default');
      if (res.data) {
        setNetwork(res.data);
        if (res.data.assets && res.data.assets.length > 0) {
          setSelectedAsset(res.data.assets[0]);
        }
      }
    } catch {
      // Demo fallback
      const demoAssets: Asset[] = [
        { id: 'gw-01', name: 'Boundary Gateway', asset_type: 'firewall', criticality: 8, vulnerability: 0.3 },
        { id: 'rt-01', name: 'Core Backbone Router', asset_type: 'router', criticality: 9, vulnerability: 0.4 },
        { id: 'srv-app', name: 'App Cluster Primary', asset_type: 'server', criticality: 7, vulnerability: 0.7 },
        { id: 'db-main', name: 'SQL Production Cluster', asset_type: 'database', criticality: 10, vulnerability: 0.6 },
        { id: 'ws-admin', name: 'SecOps Workstation', asset_type: 'workstation', criticality: 6, vulnerability: 0.5 },
      ];
      const demoConns: Connection[] = [
        { id: 'c1', source: 'gw-01', target: 'rt-01' },
        { id: 'c2', source: 'rt-01', target: 'srv-app' },
        { id: 'c3', source: 'srv-app', target: 'db-main' },
        { id: 'c4', source: 'rt-01', target: 'ws-admin' },
      ];
      setNetwork({ id: 'net-default', name: 'Enterprise Corporate Topology', assets: demoAssets, connections: demoConns });
      setSelectedAsset(demoAssets[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentNetwork();
  }, []);

  const handleGenerateSynthetic = async () => {
    setLoading(true);
    try {
      const res = await networkApi.generateSynthetic({ num_assets: numAssets, connectivity: 0.35 });
      if (res.data) {
        setNetwork(res.data);
        if (res.data.assets.length > 0) {
          setSelectedAsset(res.data.assets[0]);
        }
      }
    } catch (err) {
      // Robust client-side synthetic topology fallback
      const types: AssetType[] = ['firewall', 'router', 'server', 'database', 'workstation', 'iot_device', 'cloud_service'];
      const names = ['Gateway Firewall', 'Core Backbone Router', 'Active Directory DC', 'SQL DB Cluster', 'Web Ingress Proxy', 'SecOps Workstation', 'App Server Cluster', 'PCI Payment Gateway', 'Exchange Mail Relay', 'Secure Storage Vault', 'API Gateway Pod', 'SIEM Telemetry Collector'];
      const synthAssets: Asset[] = Array.from({ length: numAssets }, (_, i) => ({
        id: `synth-${i + 1}`,
        name: `${names[i % names.length]} (${i + 1})`,
        asset_type: types[i % types.length],
        criticality: Math.floor(3 + Math.random() * 8),
        vulnerability: Math.round((0.2 + Math.random() * 0.7) * 10) / 10,
        compromised: i === 0,
        defense_controls: [],
      }));
      const synthConns: Connection[] = [];
      for (let i = 1; i < synthAssets.length; i++) {
        const parentIdx = Math.max(0, Math.floor(Math.random() * i));
        synthConns.push({
          id: `conn-${i}`,
          source: synthAssets[parentIdx].id,
          target: synthAssets[i].id,
        });
        if (Math.random() > 0.6 && i > 2) {
          synthConns.push({
            id: `conn-cross-${i}`,
            source: synthAssets[i - 2].id,
            target: synthAssets[i].id,
          });
        }
      }
      const newNet = {
        id: `net-synth-${Date.now()}`,
        name: `Synthetic Enterprise Topology (${numAssets} Nodes)`,
        assets: synthAssets,
        connections: synthConns,
      };
      setNetwork(newNet);
      setSelectedAsset(synthAssets[0]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetName.trim()) return;
    const newId = `asset-${Date.now().toString().slice(-4)}`;
    const created: Asset = {
      id: newId,
      name: newAssetName,
      asset_type: newAssetType,
      criticality: newCriticality,
      vulnerability: newVuln,
    };
    try {
      await networkApi.addAsset(network.id, created);
    } catch {
      // Local state fallback
    }
    setNetwork((prev) => ({
      ...prev,
      assets: [...prev.assets, created],
    }));
    setSelectedAsset(created);
    setNewAssetName('');
  };

  const handleRemoveAsset = async (assetId: string) => {
    try {
      await networkApi.removeAsset(network.id, assetId);
    } catch {}
    setNetwork((prev) => ({
      ...prev,
      assets: prev.assets.filter((a) => a.id !== assetId),
      connections: prev.connections.filter((c) => c.source !== assetId && c.target !== assetId),
    }));
    if (selectedAsset?.id === assetId) {
      setSelectedAsset(null);
    }
  };

  const assetRisk = selectedAsset
    ? Math.round(selectedAsset.criticality * selectedAsset.vulnerability * 10)
    : 0;

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Topology Generator Controls */}
      <OrionCard className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#f8fafc]">Virtual Topology Generator</h3>
            <p className="text-xs text-[#8b9bb4]">
              Generate synthetic, mathematically reproducible graphs G = (V, E)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-[#8b9bb4]">Assets |V|:</span>
            <input
              type="number"
              min={4}
              max={24}
              value={numAssets}
              onChange={(e) => setNumAssets(parseInt(e.target.value) || 8)}
              className="w-16 px-2.5 py-1.5 rounded bg-[#171c24] border border-[#1e2430] text-[#f8fafc] text-center"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#8b9bb4]">Seed:</span>
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(parseInt(e.target.value) || 42)}
              className="w-20 px-2.5 py-1.5 rounded bg-[#171c24] border border-[#1e2430] text-[#f8fafc] text-center"
            />
          </div>

          <button
            onClick={handleGenerateSynthetic}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded bg-[#d4af37] text-black font-bold hover:bg-[#c29e2e] transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-[#d4af37]/20"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Regenerate Network
          </button>
        </div>
      </OrionCard>

      {/* Main Network Lab Workspace: Graph + Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Interactive Network Graph (3 Columns) */}
        <div className="lg:col-span-3 space-y-4">
          <OrionCard glow="red" className="p-4 border-[#ff1e42]/40">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-sm bg-[#ff1e42]" />
                <span className="text-xs font-mono uppercase tracking-wider text-[#f8fafc]">
                  Active Virtual Topology Graph ({network.assets.length} Nodes, {network.connections.length} Edges)
                </span>
              </div>
              <span className="text-xs text-[#d4af37] font-mono">Click node to inspect</span>
            </div>

            <NetworkGraph
              assets={network.assets}
              connections={network.connections}
              selectedAssetId={selectedAsset?.id}
              onSelectAsset={(a) => setSelectedAsset(a)}
              height={520}
            />
          </OrionCard>

          {/* Asset Addition Drawer */}
          <OrionCard>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#f8fafc] mb-3 flex items-center gap-2">
              <Plus className="h-4 w-4 text-[#ff1e42]" />
              Provision New Network Asset
            </h4>
            <form onSubmit={handleAddAsset} className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
              <input
                type="text"
                placeholder="Asset Name (e.g. Auth Proxy)"
                value={newAssetName}
                onChange={(e) => setNewAssetName(e.target.value)}
                className="px-3 py-2 rounded bg-[#171c24] border border-[#1e2430] text-[#f8fafc] focus:border-[#d4af37] outline-none"
              />
              <select
                value={newAssetType}
                onChange={(e) => setNewAssetType(e.target.value as AssetType)}
                className="px-3 py-2 rounded bg-[#171c24] border border-[#1e2430] text-[#f8fafc] focus:border-[#d4af37] outline-none"
              >
                {ASSET_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.toUpperCase()}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <span className="text-[#8b9bb4] font-mono">Crit ({newCriticality}):</span>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={newCriticality}
                  onChange={(e) => setNewCriticality(parseInt(e.target.value))}
                  className="w-full accent-[#d4af37]"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#8b9bb4] font-mono">Vuln ({newVuln}):</span>
                <input
                  type="range"
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  value={newVuln}
                  onChange={(e) => setNewVuln(parseFloat(e.target.value))}
                  className="w-full accent-[#ff1e42]"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded bg-[#ff1e42] text-white font-semibold hover:bg-[#e01637] transition-colors text-center border border-[#d4af37]/40 cursor-pointer shadow-md shadow-[#ff1e42]/20"
              >
                Add Asset
              </button>
            </form>
          </OrionCard>
        </div>

        {/* Node Inspector Sidebar (1 Column) */}
        <div>
          <OrionCard glow="titanium" className="sticky top-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2430] mb-4">
              <h3 className="text-sm font-semibold text-[#f8fafc] flex items-center gap-2">
                <Server className="h-4 w-4 text-[#00f0ff]" />
                Asset Inspector
              </h3>
              {selectedAsset && (
                <button
                  onClick={() => handleRemoveAsset(selectedAsset.id)}
                  className="p-1.5 rounded text-[#8b9bb4] hover:text-[#ff1e42] hover:bg-[#ff1e42]/10 transition-colors"
                  title="Decommission Asset"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {selectedAsset ? (
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#8b9bb4]">Asset Name & ID</span>
                  <div className="text-sm font-bold text-[#f8fafc]">{selectedAsset.name}</div>
                  <div className="font-mono text-[#8b9bb4] text-[11px]">{selectedAsset.id}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1e2430]">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-[#8b9bb4]">Type</span>
                    <div className="mt-1">
                      <Badge variant="cyan">{selectedAsset.asset_type.toUpperCase()}</Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-[#8b9bb4]">State</span>
                    <div className="mt-1">
                      <Badge variant={selectedAsset.compromised ? 'danger' : 'success'}>
                        {selectedAsset.compromised ? 'COMPROMISED' : 'OPERATIONAL'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-[#1e2430]">
                  <div className="flex justify-between font-mono">
                    <span className="text-[#8b9bb4]">Criticality Impact (I_j):</span>
                    <span className="font-bold text-[#f8fafc]">{selectedAsset.criticality}/10</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#171c24] rounded-sm overflow-hidden border border-[#1e2430]">
                    <div
                      className="h-full bg-[#00f0ff]"
                      style={{ width: `${selectedAsset.criticality * 10}%` }}
                    />
                  </div>

                  <div className="flex justify-between font-mono pt-1">
                    <span className="text-[#8b9bb4]">Vulnerability Prob (P_j):</span>
                    <span className="font-bold text-[#ff1e42]">
                      {(selectedAsset.vulnerability * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-[#171c24] rounded-sm overflow-hidden border border-[#1e2430]">
                    <div
                      className="h-full bg-[#ff1e42]"
                      style={{ width: `${selectedAsset.vulnerability * 100}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 rounded bg-[#171c24] border border-[#1e2430]">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-[#8b9bb4]">Computed Risk R_j:</span>
                    <span className="text-sm font-bold text-[#d4af37]">{assetRisk} pts</span>
                  </div>
                  <p className="text-[10px] text-[#8b9bb4] mt-1 font-mono">
                    R_j = Criticality × Vulnerability × 10
                  </p>
                </div>

                {/* Neighbor Connections */}
                <div className="pt-2 border-t border-[#1e2430]">
                  <span className="text-[10px] uppercase font-mono text-[#8b9bb4] block mb-2">
                    Network Adjacencies
                  </span>
                  <div className="space-y-1">
                    {network.connections
                      .filter((c) => c.source === selectedAsset.id || c.target === selectedAsset.id)
                      .map((c) => {
                        const neighborId = c.source === selectedAsset.id ? c.target : c.source;
                        const neighbor = network.assets.find((a) => a.id === neighborId);
                        return (
                          <div
                            key={c.id}
                            className="flex items-center justify-between p-1.5 rounded bg-[#171c24] text-[11px] font-mono text-[#8b9bb4]"
                          >
                            <span>↔ {neighbor?.name || neighborId}</span>
                            <span className="text-[9px] text-[#4d5666]">{c.protocol || 'TCP'}</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-[#8b9bb4] text-xs">
                Select an asset from the graph to inspect configuration
              </div>
            )}
          </OrionCard>
        </div>
      </div>
    </div>
  );
};

export default NetworkLab;
