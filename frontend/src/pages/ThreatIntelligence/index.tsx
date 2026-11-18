import React, { useEffect, useState } from 'react';
import OrionCard from '@/components/OrionCard';
import OrionChart from '@/components/OrionChart';
import OrionTable, { type Column } from '@/components/OrionTable';
import Badge from '@/components/Badge';
import { threatApi } from '@/services/api';
import type { Vulnerability } from '@/types';
import {
  ShieldAlert,
  Lock,
  Layers,
  Flame,
  CheckCircle2,
  DollarSign,
  TrendingDown,
} from 'lucide-react';

const ThreatIntelligence: React.FC = () => {
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [controls, setControls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([threatApi.getVulnerabilities(), threatApi.getDefenseControls()])
      .then(([vulnRes, ctrlRes]) => {
        setVulnerabilities(vulnRes.data || []);
        setControls(ctrlRes.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const vulnColumns: Column<any>[] = [
    {
      key: 'cve_id',
      header: 'CVE Identifier',
      render: (v: any) => <span className="font-mono text-xs text-[#00f0ff] font-semibold">{v || 'CVE-2024-XXXX'}</span>,
    },
    { key: 'name', header: 'Vulnerability Name' },
    {
      key: 'severity',
      header: 'Severity',
      render: (v: any) => {
        const variant =
          v === 'critical' ? 'danger' : v === 'high' ? 'gold' : v === 'medium' ? 'titanium' : 'neutral';
        return <Badge variant={variant as any}>{v?.toUpperCase()}</Badge>;
      },
    },
    {
      key: 'cvss_score',
      header: 'CVSS Score',
      render: (v: any) => (
        <span
          className={`font-mono font-bold text-xs ${
            v >= 9.0 ? 'text-[#ff1e42]' : v >= 7.0 ? 'text-[#d4af37]' : 'text-[#00f0ff]'
          }`}
        >
          {v?.toFixed(1) || '5.0'}
        </span>
      ),
    },
    {
      key: 'asset_name',
      header: 'Impacted Asset',
      render: (v: any) => <span className="text-[#8b9bb4] text-xs font-mono">{v || 'Core Server'}</span>,
    },
  ];

  const controlColumns: Column<any>[] = [
    { key: 'name', header: 'Defense Control' },
    {
      key: 'category',
      header: 'Domain',
      render: (v) => <Badge variant="cyan">{v?.toUpperCase()}</Badge>,
    },
    {
      key: 'cost',
      header: 'Cost c_i',
      render: (v) => <span className="font-mono text-xs text-[#8b9bb4] font-semibold">${v?.toFixed(1)}</span>,
    },
    {
      key: 'risk_reduction',
      header: 'Risk Reduction v_i',
      render: (v) => <span className="font-mono text-xs text-[#00f0ff] font-semibold">+{v?.toFixed(1)} pts</span>,
    },
    {
      key: 'confidence',
      header: 'Efficacy Ratio',
      render: (_, row) => {
        const ratio = row.cost > 0 ? (row.risk_reduction / row.cost).toFixed(2) : '0';
        return <span className="font-mono text-xs text-[#d4af37] font-bold">{ratio} v/c</span>;
      },
    },
  ];

  // Chart: Severity breakdown
  const severityChart = [
    {
      x: ['Critical', 'High', 'Medium', 'Low', 'Info'],
      y: [3, 4, 3, 2, 1],
      type: 'bar' as const,
      marker: {
        color: ['#ff1e42', '#d4af37', '#8b9bb4', '#00f0ff', '#4d5666'],
      },
    },
  ];

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <OrionCard glow="red" className="flex items-center gap-4">
          <div className="p-3 rounded bg-[#ff1e42]/15 text-[#ff1e42] border border-[#ff1e42]/30">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-[#8b9bb4]">Active CVE Exposures</span>
            <div className="text-xl font-extrabold text-[#f8fafc] font-mono">
              {vulnerabilities.length || 8} Identified
            </div>
            <span className="text-[11px] text-[#ff1e42]">3 Unmitigated Remote Exploits</span>
          </div>
        </OrionCard>

        <OrionCard glow="cyan" className="flex items-center gap-4">
          <div className="p-3 rounded bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/30">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-[#8b9bb4]">Available Defenses</span>
            <div className="text-xl font-extrabold text-[#f8fafc] font-mono">
              {controls.length || 8} Security Controls
            </div>
            <span className="text-[11px] text-[#00f0ff]">0/1 Knapsack Optimization Ready</span>
          </div>
        </OrionCard>

        <OrionCard glow="gold" className="flex items-center gap-4">
          <div className="p-3 rounded bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-[#8b9bb4]">Framework Baseline</span>
            <div className="text-xl font-extrabold text-[#f8fafc] font-mono">NIST SP 800-53</div>
            <span className="text-[11px] text-[#d4af37]">Zero Trust Mapped</span>
          </div>
        </OrionCard>
      </div>

      {/* Vulnerabilities Table & Severity Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <OrionCard glow="none">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-[#f8fafc]">Identified System Vulnerabilities</h3>
                <p className="text-xs text-[#8b9bb4]">Synthetic reproducible CVE audit across active topology</p>
              </div>
              <Badge variant="danger">CVSS AUDIT</Badge>
            </div>
            <OrionTable columns={vulnColumns} data={vulnerabilities} />
          </OrionCard>
        </div>

        <div>
          <OrionCard glow="gold">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-[#f8fafc]">Severity Breakdown</h3>
              <Badge variant="gold">DISTRIBUTION</Badge>
            </div>
            <p className="text-xs text-[#8b9bb4] mb-3">Threat count categorized by CVSS severity tier</p>
            <OrionChart data={severityChart} height={260} />
          </OrionCard>
        </div>
      </div>

      {/* Defensive Controls Catalogue */}
      <OrionCard glow="cyan">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-[#f8fafc]">Defensive Security Controls Catalogue</h3>
            <p className="text-xs text-[#8b9bb4]">
              Item candidates for the 0/1 Knapsack optimization algorithm with costs c_i and risk reductions v_i
            </p>
          </div>
          <Badge variant="cyan">KNAPSACK INPUTS</Badge>
        </div>
        <OrionTable columns={controlColumns} data={controls} />
      </OrionCard>
    </div>
  );
};

export default ThreatIntelligence;
