import { create } from 'zustand';
import type { Network, Asset, Connection } from '@/types';
import { networkApi } from '@/services/api';

interface NetworkState {
  networks: Network[];
  activeNetwork: Network | null;
  currentNetwork: Network | null;
  selectedAssetId: string | null;
  loading: boolean;
  error: string | null;

  fetchNetworks: () => Promise<void>;
  loadNetworks: () => Promise<void>;
  fetchNetwork: (id: string) => Promise<void>;
  setActiveNetwork: (network: Network | null) => void;
  selectAsset: (id: string | null) => void;
  generateSynthetic: (numAssets: number, connectivity: number) => Promise<void>;
  addAsset: (asset: Partial<Asset>) => void;
  updateAsset: (assetId: string, data: Partial<Asset>) => void;
  removeAsset: (assetId: string) => void;
  addConnection: (conn: Connection) => void;
  removeConnection: (connId: string) => void;
  updateAssetPosition: (assetId: string, x: number, y: number) => void;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  networks: [],
  activeNetwork: null,
  currentNetwork: null,
  selectedAssetId: null,
  loading: false,
  error: null,

  fetchNetworks: async () => {
    set({ loading: true, error: null });
    try {
      const res = await networkApi.getNetworks();
      const nets = res.data;
      set({ networks: nets, activeNetwork: nets[0] || null, currentNetwork: nets[0] || null, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      // Generate demo network on failure
      const demoNetwork = generateDemoNetwork();
      set({ networks: [demoNetwork], activeNetwork: demoNetwork, currentNetwork: demoNetwork });
    }
  },

  loadNetworks: async () => {
    await get().fetchNetworks();
  },

  fetchNetwork: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const res = await networkApi.getNetwork(id);
      set({ activeNetwork: res.data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  setActiveNetwork: (network) => set({ activeNetwork: network, currentNetwork: network, selectedAssetId: null }),

  selectAsset: (id) => set({ selectedAssetId: id }),

  generateSynthetic: async (numAssets, connectivity) => {
    set({ loading: true, error: null });
    try {
      const res = await networkApi.generateSynthetic({ num_assets: numAssets, connectivity });
      set({ activeNetwork: res.data, currentNetwork: res.data, loading: false });
    } catch {
      // Fallback: generate locally
      const net = generateDemoNetwork(numAssets);
      set({ activeNetwork: net, currentNetwork: net, loading: false });
    }
  },

  addAsset: (asset) => {
    const net = get().activeNetwork;
    if (!net) return;
    const newAsset: Asset = {
      id: `asset-${Date.now()}`,
      name: asset.name || 'New Asset',
      asset_type: asset.asset_type || 'server',
      criticality: asset.criticality ?? 5,
      vulnerability: asset.vulnerability ?? 3,
      x: asset.x ?? Math.random() * 600 + 100,
      y: asset.y ?? Math.random() * 400 + 100,
      compromised: false,
      defense_controls: [],
    };
    const updated = { ...net, assets: [...net.assets, newAsset] };
    set({
      activeNetwork: updated,
      currentNetwork: updated,
    });
  },

  updateAsset: (assetId, data) => {
    const net = get().activeNetwork;
    if (!net) return;
    const updated = {
      ...net,
      assets: net.assets.map((a) => (a.id === assetId ? { ...a, ...data } : a)),
    };
    set({
      activeNetwork: updated,
      currentNetwork: updated,
    });
  },

  removeAsset: (assetId) => {
    const net = get().activeNetwork;
    if (!net) return;
    const updated = {
      ...net,
      assets: net.assets.filter((a) => a.id !== assetId),
      connections: net.connections.filter((c) => c.source !== assetId && c.target !== assetId),
    };
    set({
      activeNetwork: updated,
      currentNetwork: updated,
      selectedAssetId: get().selectedAssetId === assetId ? null : get().selectedAssetId,
    });
  },

  addConnection: (conn) => {
    const net = get().activeNetwork;
    if (!net) return;
    const updated = { ...net, connections: [...net.connections, conn] };
    set({ activeNetwork: updated, currentNetwork: updated });
  },

  removeConnection: (connId) => {
    const net = get().activeNetwork;
    if (!net) return;
    const updated = {
      ...net,
      connections: net.connections.filter((c) => c.id !== connId),
    };
    set({ activeNetwork: updated, currentNetwork: updated });
  },

  updateAssetPosition: (assetId, x, y) => {
    const net = get().activeNetwork;
    if (!net) return;
    const updated = {
      ...net,
      assets: net.assets.map((a) => (a.id === assetId ? { ...a, x, y } : a)),
    };
    set({ activeNetwork: updated, currentNetwork: updated });
  },
}));

// ---- Demo data generator ----
function generateDemoNetwork(size = 12): Network {
  const types: Asset['asset_type'][] = ['firewall', 'router', 'server', 'server', 'database', 'workstation', 'workstation', 'iot_device', 'cloud_service', 'server', 'workstation', 'database'];
  const names = ['Edge Firewall', 'Core Router', 'Web Server', 'App Server', 'Primary DB', 'Admin WS', 'Dev WS', 'IoT Gateway', 'Cloud CDN', 'Mail Server', 'HR Workstation', 'Backup DB'];
  const assets: Asset[] = [];
  const count = Math.min(size, names.length);
  for (let i = 0; i < count; i++) {
    assets.push({
      id: `asset-${i}`,
      name: names[i],
      asset_type: types[i],
      criticality: Math.round(3 + Math.random() * 7),
      vulnerability: Math.round(1 + Math.random() * 8),
      x: 150 + (i % 4) * 200 + (Math.random() - 0.5) * 60,
      y: 100 + Math.floor(i / 4) * 180 + (Math.random() - 0.5) * 40,
      compromised: false,
      defense_controls: [],
    });
  }

  const connPairs = [
    [0, 1], [1, 2], [1, 3], [1, 8], [2, 4], [3, 4],
    [3, 5], [5, 6], [1, 9], [9, 10], [4, 11], [7, 1],
  ];
  const connections: Connection[] = connPairs
    .filter(([s, t]) => s < count && t < count)
    .map(([s, t], i) => ({
      id: `conn-${i}`,
      source: `asset-${s}`,
      target: `asset-${t}`,
      protocol: ['TCP', 'HTTPS', 'SSH', 'RDP'][i % 4],
      port: [443, 8080, 22, 3389][i % 4],
      encrypted: i % 2 === 0,
    }));

  return {
    id: 'demo-network',
    name: 'Corporate Network',
    assets,
    connections,
    created_at: new Date().toISOString(),
  };
}

export { generateDemoNetwork };
export default useNetworkStore;
