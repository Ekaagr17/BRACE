import axios from 'axios';
import type {
  Network, Asset, Connection, Vulnerability, ThreatIntel,
  AttackScenario, DefenseControl, OptimizationRequest, OptimizationResult,
  AlgorithmType, AlgorithmExecution, BenchmarkConfig, BenchmarkResult,
  Report, ReportType,
} from '@/types';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
});

// ---- Network ----
export const networkApi = {
  getNetworks: () => api.get<Network[]>('/api/networks'),
  getNetwork: (id: string) => api.get<Network>(`/api/networks/${id}`),
  createNetwork: (data: Partial<Network>) => api.post<Network>('/api/networks', data),
  updateNetwork: (id: string, data: Partial<Network>) => api.put<Network>(`/api/networks/${id}`, data),
  deleteNetwork: (id: string) => api.delete(`/api/networks/${id}`),
  generateSynthetic: (params: { num_assets: number; connectivity: number }) =>
    api.post<Network>('/api/networks/generate', params),
  addAsset: (networkId: string, asset: Partial<Asset>) =>
    api.post<Asset>(`/api/networks/${networkId}/assets`, asset),
  updateAsset: (networkId: string, assetId: string, asset: Partial<Asset>) =>
    api.put<Asset>(`/api/networks/${networkId}/assets/${assetId}`, asset),
  removeAsset: (networkId: string, assetId: string) =>
    api.delete(`/api/networks/${networkId}/assets/${assetId}`),
  addConnection: (networkId: string, conn: Partial<Connection>) =>
    api.post<Connection>(`/api/networks/${networkId}/connections`, conn),
  removeConnection: (networkId: string, connId: string) =>
    api.delete(`/api/networks/${networkId}/connections/${connId}`),
};

// ---- Threat Intelligence ----
export const threatApi = {
  getVulnerabilities: (networkId?: string) =>
    api.get<Vulnerability[]>('/api/vulnerabilities', { params: { network_id: networkId } }),
  getThreatIntel: (networkId?: string) =>
    api.get<ThreatIntel>('/api/threat-intel', { params: { network_id: networkId } }),
  getDefenseControls: () => api.get<DefenseControl[]>('/api/defense-controls'),
};

// ---- Attack Simulation ----
export const attackApi = {
  getScenarios: () => api.get<AttackScenario[]>('/api/attack-scenarios'),
  getScenario: (id: string) => api.get<AttackScenario>(`/api/attack-scenarios/${id}`),
  runSimulation: (networkId: string, params?: Record<string, unknown>) =>
    api.post<AttackScenario>(`/api/attack-scenarios/simulate`, { network_id: networkId, ...params }),
};

// ---- Optimization ----
export const optimizationApi = {
  optimize: (req: OptimizationRequest) =>
    api.post<OptimizationResult>('/api/optimize', req),
  optimizeWithAlgorithm: (algorithm: AlgorithmType, req: OptimizationRequest) =>
    api.post<OptimizationResult>(`/api/optimize/${algorithm}`, req),
};

// ---- Algorithm Studio ----
export const algorithmApi = {
  executeStepByStep: (algorithm: AlgorithmType, items: { id: string; name: string; cost: number; value: number }[], budget: number) =>
    api.post<AlgorithmExecution>(`/api/algorithms/${algorithm}/execute`, { items, budget }),
  compareAlgorithms: (items: { id: string; name: string; cost: number; value: number }[], budget: number, algorithms?: AlgorithmType[]) =>
    api.post<AlgorithmExecution[]>('/api/algorithms/compare', {
      items, budget,
      algorithms: algorithms || ['brute_force', 'greedy', 'branch_and_bound_dfs', 'branch_and_bound_best_first'],
    }),
};

// ---- Benchmarks ----
export const benchmarkApi = {
  runBenchmark: (config: BenchmarkConfig) =>
    api.post<BenchmarkResult>('/api/benchmarks/run', config),
  getBenchmarks: () => api.get<BenchmarkResult[]>('/api/benchmarks'),
  getBenchmark: (id: string) => api.get<BenchmarkResult>(`/api/benchmarks/${id}`),
};

// ---- Reports ----
export const reportApi = {
  getReports: (type?: ReportType) =>
    api.get<Report[]>('/api/reports', { params: { type } }),
  getReport: (id: string) => api.get<Report>(`/api/reports/${id}`),
  generateReport: (type: ReportType, params: Record<string, unknown>) =>
    api.post<Report>('/api/reports/generate', { type, ...params }),
  exportReport: (id: string, format: 'pdf' | 'csv') =>
    api.get(`/api/reports/${id}/export`, { params: { format }, responseType: 'blob' }),
};

// ---- Dashboard ----
export const dashboardApi = {
  getOverview: () => api.get('/api/dashboard/overview'),
  getRecentAttacks: () => api.get<AttackScenario[]>('/api/dashboard/recent-attacks'),
  getRecentOptimizations: () => api.get<OptimizationResult[]>('/api/dashboard/recent-optimizations'),
  getNetworkHealth: () => api.get('/api/dashboard/network-health'),
};

export default api;
