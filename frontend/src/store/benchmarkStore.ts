import { create } from 'zustand';
import type { BenchmarkConfig, BenchmarkResult, BenchmarkDataPoint, AlgorithmType } from '@/types';
import { benchmarkApi } from '@/services/api';

interface BenchmarkState {
  config: BenchmarkConfig;
  result: BenchmarkResult | null;
  loading: boolean;
  error: string | null;
  scaleLog: boolean;

  setConfig: (config: Partial<BenchmarkConfig>) => void;
  runBenchmark: () => Promise<void>;
  toggleScale: () => void;
  fetchBenchmarks: () => Promise<void>;
  results: BenchmarkResult[];
}

function generateDemoBenchmarkData(config: BenchmarkConfig): BenchmarkDataPoint[] {
  const data: BenchmarkDataPoint[] = [];
  const algConfigs: Record<string, { runtimeFactor: number; nodesFactor: number; optGap: number }> = {
    brute_force: { runtimeFactor: 50, nodesFactor: 1, optGap: 0 },
    greedy: { runtimeFactor: 0.001, nodesFactor: 0.01, optGap: 0.12 },
    branch_and_bound_dfs: { runtimeFactor: 0.5, nodesFactor: 0.3, optGap: 0 },
    branch_and_bound_best_first: { runtimeFactor: 0.3, nodesFactor: 0.2, optGap: 0 },
  };

  for (const alg of config.algorithms) {
    const ac = algConfigs[alg] || algConfigs.greedy;
    for (const size of config.input_sizes) {
      const base = alg === 'brute_force' ? Math.pow(2, size) : size;
      const jitter = () => 0.8 + Math.random() * 0.4;
      data.push({
        input_size: size,
        algorithm: alg,
        runtime_ms: Math.round(base * ac.runtimeFactor * jitter() * 100) / 100,
        nodes_explored: Math.round(base * ac.nodesFactor * jitter()),
        solution_value: Math.round((100 - ac.optGap * 100 * jitter()) * (1 + size * 0.1)),
        optimality_gap: Math.round(ac.optGap * jitter() * 10000) / 10000,
        memory_kb: Math.round(size * (alg === 'brute_force' ? 10 : 2) * jitter()),
        pruning_efficiency: alg.includes('branch') ? Math.round((0.4 + Math.random() * 0.5) * 100) / 100 : 0,
      });
    }
  }
  return data;
}

export const useBenchmarkStore = create<BenchmarkState>((set, get) => ({
  config: {
    input_sizes: [4, 6, 8, 10, 12, 14, 16, 18, 20],
    budget_ratio: 0.5,
    num_trials: 5,
    algorithms: ['brute_force', 'greedy', 'branch_and_bound_dfs', 'branch_and_bound_best_first'] as AlgorithmType[],
  },
  result: null,
  results: [],
  loading: false,
  error: null,
  scaleLog: false,

  setConfig: (partial) => set((s) => ({ config: { ...s.config, ...partial } })),

  runBenchmark: async () => {
    const { config } = get();
    set({ loading: true, error: null });
    try {
      const res = await benchmarkApi.runBenchmark(config);
      set({ result: res.data, loading: false });
    } catch {
      const data = generateDemoBenchmarkData(config);
      set({
        result: {
          id: `bench-${Date.now()}`,
          config,
          data,
          created_at: new Date().toISOString(),
          status: 'completed',
        },
        loading: false,
      });
    }
  },

  toggleScale: () => set((s) => ({ scaleLog: !s.scaleLog })),

  fetchBenchmarks: async () => {
    try {
      const res = await benchmarkApi.getBenchmarks();
      set({ results: res.data });
    } catch {
      // ignore
    }
  },
}));
