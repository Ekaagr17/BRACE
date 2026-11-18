// ============================================================
// BRACE Platform — TypeScript Type Definitions
// Matches backend FastAPI schemas
// ============================================================

// ---- Network / Assets ----
export type AssetType = 'server' | 'workstation' | 'router' | 'firewall' | 'database' | 'iot_device' | 'cloud_service';

export interface Asset {
  id: string;
  name: string;
  asset_type: AssetType;
  criticality: number;       // 0-10
  vulnerability: number;     // 0-10
  x?: number;
  y?: number;
  compromised?: boolean;
  defense_controls?: string[];
}

export interface Connection {
  id: string;
  source: string;
  target: string;
  protocol?: string;
  port?: number;
  encrypted?: boolean;
}

export interface Network {
  id: string;
  name: string;
  assets: Asset[];
  connections: Connection[];
  created_at?: string;
}

// ---- Threats / Vulnerabilities ----
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface Vulnerability {
  id: string;
  cve_id?: string;
  name: string;
  description: string;
  severity: Severity;
  cvss_score: number;
  asset_id: string;
  asset_name?: string;
  exploitability: number;
  impact: number;
  remediation?: string;
}

export interface ThreatIntel {
  vulnerabilities: Vulnerability[];
  risk_distribution: Record<Severity, number>;
  top_exposed_assets: Asset[];
}

// ---- Attack Simulation ----
export type AttackStage =
  | 'reconnaissance'
  | 'initial_access'
  | 'execution'
  | 'persistence'
  | 'privilege_escalation'
  | 'defense_evasion'
  | 'credential_access'
  | 'discovery'
  | 'lateral_movement'
  | 'collection'
  | 'exfiltration'
  | 'impact';

export interface AttackEvent {
  id: string;
  timestamp: number;          // seconds offset
  stage: AttackStage;
  source_asset_id: string;
  target_asset_id: string;
  technique: string;
  description: string;
  success: boolean;
  impact_score: number;
  details?: Record<string, unknown>;
}

export interface AttackScenario {
  id: string;
  name: string;
  description: string;
  events: AttackEvent[];
  total_impact: number;
  duration_seconds: number;
  attack_paths: string[][];   // arrays of asset IDs
  created_at?: string;
}

export interface AttackExplanation {
  technical: string;
  plain_english: string;
  why_it_matters: string;
}

// ---- Defense Controls / Optimization ----
export interface DefenseControl {
  id: string;
  name: string;
  description: string;
  cost: number;
  value: number;              // risk-reduction value
  weight?: number;            // resource weight for knapsack
  category: string;
  applicable_asset_types?: AssetType[];
  effectiveness?: number;     // 0-1
}

export interface OptimizationRequest {
  budget: number;
  controls?: DefenseControl[];
  algorithm?: string;
  items?: any[];
  network_id?: string;
}

export interface OptimizationResult {
  algorithm?: string;
  algorithm_used?: string;
  budget?: number;
  total_cost: number;
  total_value: number;
  remaining_budget?: number;
  selected_controls?: DefenseControl[];
  selected_items?: any[];
  decision_vector?: number[];
  baseline_risk?: number;
  residual_risk?: number;
  risk_reduction_pct?: number;
  runtime_ms: number;
  nodes_explored?: number;
  is_optimal?: boolean;
  optimality_gap?: number;
  optimality_gap_pct?: number;
}

export type AlgorithmType = 'brute_force' | 'greedy' | 'branch_and_bound_dfs' | 'branch_and_bound_best_first';

export interface KnapsackItem {
  id: string;
  name: string;
  cost: number;    // weight
  value: number;   // profit
  ratio?: number;  // value/cost
}

export interface AlgorithmStep {
  step_number: number;
  description: string;
  current_node?: TreeNode;
  current_subset?: string[];
  current_value: number;
  current_cost: number;
  best_value: number;
  best_subset: string[];
  upper_bound?: number;
  lower_bound?: number;
  pruned?: boolean;
  action: 'explore' | 'prune' | 'update_best' | 'backtrack' | 'complete' | 'select' | 'skip';
}

export interface TreeNode {
  id: string | number;
  level: number;
  item_id?: string;
  included?: boolean;
  decision?: number;
  decision_path?: number[];
  status?: string;
  value?: number;
  cost?: number;
  upper_bound?: number;
  pruned?: boolean;
  is_solution?: boolean;
  children?: string[];
  parent_id?: string | number;
}

export interface AlgorithmExecution {
  algorithm: AlgorithmType;
  items: KnapsackItem[];
  budget: number;
  steps: AlgorithmStep[];
  result?: OptimizationResult;
  tree_nodes?: TreeNode[];
  total_steps?: number;
  final_value?: number;
  final_cost?: number;
  selected_items?: string[];
  execution_time_ms?: number;
  nodes_explored?: number;
  pruning_count?: number;
  is_optimal?: boolean;
  optimality_gap_pct?: number;
}

// ---- Benchmark ----
export interface BenchmarkConfig {
  input_sizes: number[];
  budget_ratio?: number;
  num_trials?: number;
  algorithms: AlgorithmType[];
}

export interface BenchmarkDataPoint {
  input_size: number;
  algorithm: AlgorithmType;
  runtime_ms: number;
  nodes_explored: number;
  solution_value: number;
  optimality_gap: number;
  memory_kb: number;
  pruning_efficiency?: number;
}

export interface BenchmarkResult {
  id: string;
  config: BenchmarkConfig;
  data: BenchmarkDataPoint[];
  created_at: string;
  status: 'running' | 'completed' | 'failed';
}

// ---- Reports ----
export type ReportType = 'incident' | 'optimization' | 'benchmark';

export interface Report {
  id?: string;
  report_id?: string;
  title: string;
  type: ReportType;
  created_at?: string;
  generated_at?: string;
  summary?: string | Record<string, unknown>;
  content?: Record<string, unknown>;
  [key: string]: any;
}

export type DefensiveControlSchema = DefenseControl;

// ---- API Responses ----
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: 'success' | 'error';
}

// ---- UI State ----
export interface NavItem {
  label: string;
  path: string;
  icon: string;
}

export interface ChartTheme {
  paper_bgcolor: string;
  plot_bgcolor: string;
  font: { color: string; family: string };
  colorway: string[];
  xaxis: { gridcolor: string; zerolinecolor: string };
  yaxis: { gridcolor: string; zerolinecolor: string };
}
