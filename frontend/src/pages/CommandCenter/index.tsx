import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OrionCard from '@/components/OrionCard';
import StatCard from '@/components/StatCard';
import OrionChart from '@/components/OrionChart';
import OrionTable, { type Column } from '@/components/OrionTable';
import Badge from '@/components/Badge';
import {
  ShieldCheck,
  Server,
  AlertTriangle,
  Flame,
  DollarSign,
  TrendingDown,
  Swords,
  Play,
  ArrowRight,
} from 'lucide-react';
import { dashboardApi, networkApi } from '@/services/api';
import useNetworkStore from '@/store/networkStore';

const CommandCenter: React.FC = () => {
  const navigate = useNavigate();
  const { currentNetwork, loadNetworks } = useNetworkStore();

  const [overview, setOverview] = useState({
    securityScore: 84,
    totalAssets: 12,
    activeThreats: 3,
    compromisedAssets: 1,
    totalExposure: 432.5,
    availableBudget: 150.0,
    estimatedRiskReduction: 68.2,
  });

  const [recentAttacks, setRecentAttacks] = useState<any[]>([]);
  const [recentOptimizations, setRecentOptimizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNetworks();
    dashboardApi
      .getOverview()
      .then((res) => {
        if (res.data) {
          setOverview({
            securityScore: res.data.security_score || 84,
            totalAssets: res.data.total_assets || 12,
            activeThreats: res.data.active_threats || 3,
            compromisedAssets: res.data.compromised_assets || 1,
            totalExposure: res.data.total_exposure || 432.5,
            availableBudget: res.data.available_budget || 150.0,
            estimatedRiskReduction: res.data.estimated_risk_reduction || 68.2,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    dashboardApi.getRecentAttacks().then((res) => setRecentAttacks(res.data || [])).catch(() => {});
    dashboardApi.getRecentOptimizations().then((res) => setRecentOptimizations(res.data || [])).catch(() => {});
  }, [loadNetworks]);

  // Area Chart Data: Network Exposure vs Mitigated Risk Trend
  const healthChartData = [
    {
      x: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', 'Now'],
      y: [490, 480, 520, 560, 460, 440, overview.totalExposure],
      type: 'scatter' as const,
      mode: 'lines+markers' as const,
      name: 'Baseline Risk Exposure',
      line: { color: '#ff1e42', width: 2.5 },
      fill: 'tozeroy' as const,
      fillcolor: 'rgba(255, 30, 66, 0.08)',
    },
    {
      x: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', 'Now'],
      y: [220, 210, 240, 290, 200, 180, overview.totalExposure - overview.estimatedRiskReduction * 2],
      type: 'scatter' as const,
      mode: 'lines+markers' as const,
      name: 'Residual Risk (Post-B&B)',
      line: { color: '#00f0ff', width: 2.5 },
      fill: 'tozeroy' as const,
      fillcolor: 'rgba(0, 240, 255, 0.12)',
    },
  ];

  // Donut Chart: Threat Distribution by Category
  const threatCategoryData = [
    {
      values: [40, 25, 20, 15],
      labels: ['Perimeter Ingress', 'Credential Abuse', 'Lateral Spread', 'Data Exfiltration'],
      type: 'pie' as const,
      hole: 0.65,
      marker: {
        colors: ['#00f0ff', '#d4af37', '#8b9bb4', '#ff1e42'],
      },
      textinfo: 'none' as const,
      hoverinfo: 'label+percent+value' as const,
    },
  ];

  const attackColumns: Column<any>[] = [
    { key: 'name', header: 'Scenario Name' },
    {
      key: 'attack_paths',
      header: 'Propagation Hops',
      render: (v) => <span className="font-mono text-xs text-[#8b9bb4]">{Array.isArray(v) ? v.length : 3} hops</span>,
    },
    {
      key: 'total_impact',
      header: 'Impact Score',
      render: (v) => <span className="font-mono text-xs text-[#ff1e42] font-semibold">{v || 45.0}</span>,
    },
    {
      key: 'containment_successful',
      header: 'Status',
      render: (v) => (
        <Badge variant={v ? 'success' : 'danger'}>
          {v ? 'Contained' : 'Active Breach'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Top Quick Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded border border-[#1e2430] bg-[#11141a]">
        <div>
          <h2 className="text-base font-bold text-[#f8fafc] flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#00f0ff]" />
            Enterprise Security Posture Monitored
          </h2>
          <p className="text-xs text-[#8b9bb4]">
            Optimal defensive controls calculated via 0/1 Knapsack Branch & Bound relaxation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/attack-reconstruction')}
            className="flex items-center gap-2 px-4 py-2 rounded bg-[#ff1e42]/15 border border-[#ff1e42]/40 text-[#ff1e42] text-xs font-semibold hover:bg-[#ff1e42]/25 transition-colors"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Replay Active Attack
          </button>
          <button
            onClick={() => navigate('/algorithm-arena')}
            className="flex items-center gap-2 px-4 py-2 rounded bg-[#ff1e42] text-white text-xs font-bold hover:bg-[#e01637] border border-[#d4af37] transition-colors shadow-lg shadow-[#ff1e42]/25"
          >
            <Swords className="h-3.5 w-3.5" />
            Run Algorithm Arena
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label="Total Assets"
          value={overview.totalAssets}
          icon={Server}
          color="cyan"
          subtitle="Monitored in topology"
        />
        <StatCard
          label="Active Threats"
          value={overview.activeThreats}
          icon={AlertTriangle}
          color="gold"
          subtitle="Simulated vectors"
        />
        <StatCard
          label="Compromised"
          value={overview.compromisedAssets}
          icon={Flame}
          color="red"
          subtitle="Isolated nodes"
        />
        <StatCard
          label="Network Exposure"
          value={overview.totalExposure.toFixed(1)}
          icon={ShieldCheck}
          color="titanium"
          subtitle="Σ Impact × Prob"
        />
        <StatCard
          label="Defense Budget"
          value={`$${overview.availableBudget.toFixed(0)}`}
          icon={DollarSign}
          color="silver"
          subtitle="Capacity constraint B"
        />
        <StatCard
          label="Risk Reduction"
          value={`-${overview.estimatedRiskReduction.toFixed(1)}%`}
          icon={TrendingDown}
          color="cyan"
          subtitle="Optimal Z* gain"
        />
      </div>

      {/* Primary Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <OrionCard glow="cyan">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-[#f8fafc]">Baseline vs Residual Network Risk</h3>
                <p className="text-xs text-[#8b9bb4]">
                  Dynamic risk reduction after applying Branch & Bound selected security controls
                </p>
              </div>
              <Badge variant="cyan">DAA OPTIMAL</Badge>
            </div>
            <OrionChart data={healthChartData} height={280} />
          </OrionCard>
        </div>

        <div>
          <OrionCard glow="gold">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-[#f8fafc]">Threat Vectors by Category</h3>
              <Badge variant="gold">MITRE ATT&CK</Badge>
            </div>
            <p className="text-xs text-[#8b9bb4] mb-2">Proportion of simulated active kill chain paths</p>
            <OrionChart
              data={threatCategoryData}
              height={260}
              layout={{
                showlegend: true,
                legend: { orientation: 'h', y: -0.2, font: { size: 10, color: '#8b9bb4' } },
              }}
            />
          </OrionCard>
        </div>
      </div>

      {/* Bottom Tables / Workflows Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Attack Simulations */}
        <OrionCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#f8fafc] flex items-center gap-2">
              <Flame className="h-4 w-4 text-[#ff1e42]" />
              Recent Simulated Attacks
            </h3>
            <button
              onClick={() => navigate('/attack-reconstruction')}
              className="text-xs text-[#d4af37] hover:text-[#ff1e42] flex items-center gap-1 font-mono uppercase tracking-wider transition-colors"
            >
              Reconstruct <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <OrionTable
            columns={attackColumns}
            data={
              recentAttacks.length > 0
                ? recentAttacks
                : [
                    {
                      name: 'Enterprise Ransomware Intrusion',
                      attack_paths: ['ws-01', 'srv-02', 'db-core'],
                      total_impact: 42.0,
                      containment_successful: true,
                    },
                    {
                      name: 'APT Data Exfiltration Pivot',
                      attack_paths: ['vpn-gw', 'srv-app', 'db-cust'],
                      total_impact: 65.5,
                      containment_successful: false,
                    },
                  ]
            }
          />
        </OrionCard>

        {/* Recent Optimization Experiments */}
        <OrionCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#f8fafc] flex items-center gap-2">
              <Swords className="h-4 w-4 text-[#ff1e42]" />
              Recent Algorithmic Allocations
            </h3>
            <button
              onClick={() => navigate('/algorithm-arena')}
              className="text-xs text-[#d4af37] hover:text-[#ff1e42] flex items-center gap-1 font-mono uppercase tracking-wider transition-colors"
            >
              Algorithm Arena <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-3">
            {[
              {
                name: 'Budget $150 Allocation (Branch & Bound DFS)',
                cost: '$140.0',
                value: '228.0 Value Points',
                opt: 'Global Optimal',
                gap: '0.0% Gap',
                color: 'text-[#00f0ff]',
              },
              {
                name: 'Budget $150 Allocation (Greedy Heuristic)',
                cost: '$135.0',
                value: '194.0 Value Points',
                opt: 'Suboptimal',
                gap: '14.9% Gap',
                color: 'text-[#d4af37]',
              },
              {
                name: 'Budget $100 Allocation (Best-First B&B)',
                cost: '$95.0',
                value: '162.0 Value Points',
                opt: 'Global Optimal',
                gap: '0.0% Gap',
                color: 'text-[#00f0ff]',
              },
            ].map((exp, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded border border-[#1e2430] bg-[#171c24]"
              >
                <div>
                  <div className="text-xs font-semibold text-[#f8fafc]">{exp.name}</div>
                  <div className="text-[11px] text-[#8b9bb4] font-mono">
                    Cost: {exp.cost} • Gain: {exp.value}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-bold font-mono ${exp.color}`}>{exp.opt}</div>
                  <div className="text-[10px] text-[#8b9bb4] font-mono">{exp.gap}</div>
                </div>
              </div>
            ))}
          </div>
        </OrionCard>
      </div>
    </div>
  );
};

export default CommandCenter;
