import React, { useEffect, useState } from 'react';
import OrionCard from '@/components/OrionCard';
import Badge from '@/components/Badge';
import { reportApi } from '@/services/api';
import type { Report, ReportType } from '@/types';
import {
  FileText,
  Download,
  Printer,
  Shield,
  BarChart3,
  Cpu,
  Flame,
  CheckCircle,
} from 'lucide-react';

const Reports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ReportType>('incident');

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await reportApi.getReports();
      if (res.data && res.data.length > 0) {
        setReports(res.data);
        setSelectedReport(res.data[0]);
      }
    } catch {
      // Demo report fallback
      const demoReports: any[] = [
        {
          report_id: 'INC-2024-001',
          type: 'incident',
          title: 'Cybersecurity Incident Forensics: Ransomware Kill Chain',
          generated_at: new Date().toISOString(),
          executive_summary:
            'Adversary exploited external edge firewall vulnerability (CVE-2024-3400) and achieved lateral movement across 3 subnets. Automated SIEM behavioral detection isolated the infected hosts.',
          affected_assets: ['gw-01', 'srv-app', 'db-main'],
          compromised_assets: ['srv-app'],
          containment_status: 'Contained',
          recommendations: [
            'Deploy Endpoint Detection & Response (EDR) on initial pivot hosts.',
            'Enforce VLAN micro-segmentation between user workstations and database clusters.',
            'Implement Zero Trust Identity & MFA across administrative boundaries.',
          ],
        },
        {
          report_id: 'OPT-2024-082',
          type: 'optimization',
          title: 'Defensive Resource Allocation (0/1 Knapsack B&B)',
          generated_at: new Date().toISOString(),
          summary: {
            algorithm_used: 'Branch and Bound (DFS)',
            budget_allocated: 150.0,
            budget_utilized: 140.0,
            total_risk_reduction: 228.0,
            baseline_risk: 432.5,
            residual_risk: 204.5,
            risk_reduction_pct: 52.7,
          },
          mathematical_model:
            'Maximize Z = Σ(v_i · x_i) subject to Σ(c_i · x_i) ≤ B, x_i ∈ {0, 1}.',
        },
        {
          report_id: 'BMK-2024-990',
          type: 'benchmark',
          title: 'Academic DAA Algorithmic Benchmark & Complexity Report',
          generated_at: new Date().toISOString(),
          abstract:
            'Rigorous evaluation of Brute Force O(n·2ⁿ), Greedy Heuristic O(n log n), and Branch & Bound O(2ⁿ with practical pruning) on 0/1 Knapsack defense allocation.',
          complexity_matrix: [
            { algorithm: 'Brute Force', time: 'O(n · 2ⁿ)', space: 'O(n)', optimal: 'Yes' },
            { algorithm: 'Greedy', time: 'O(n log n)', space: 'O(n)', optimal: 'No (Heuristic)' },
            { algorithm: 'Branch & Bound', time: 'O(2ⁿ) Worst / O(1.3ⁿ) Avg', space: 'O(n) Stack', optimal: 'Yes' },
          ],
        },
      ];
      setReports(demoReports);
      setSelectedReport(demoReports[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExportJSON = () => {
    if (!selectedReport) return;
    const blob = new Blob([JSON.stringify(selectedReport, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedReport.report_id || 'report'}.json`;
    a.click();
  };

  const filteredReports = reports.filter((r) => !activeTab || r.type === activeTab);

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Header & Category Filter Bar */}
      <OrionCard glow="cyan" className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/30">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#f8fafc]">Reports & Forensic Evidence</h2>
              <p className="text-xs text-[#8b9bb4]">
                Official audit reports, mathematical optimization proofs, and academic benchmark records
              </p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2">
            {[
              { id: 'incident', label: 'Incident Forensics', icon: Flame },
              { id: 'optimization', label: 'Optimization Audits', icon: Cpu },
              { id: 'benchmark', label: 'Academic Benchmarks', icon: BarChart3 },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ReportType)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-mono font-semibold transition-colors ${
                    activeTab === tab.id
                      ? 'bg-[#00f0ff]/15 border-[#00f0ff] text-[#00f0ff]'
                      : 'bg-[#171c24] border-[#1e2430] text-[#8b9bb4] hover:text-[#f8fafc]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </OrionCard>

      {/* Reports Workspace: Sidebar List + Report Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Reports Index List (4 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          <OrionCard glow="none">
            <div className="pb-3 border-b border-[#1e2430] mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#f8fafc]">
                Archived Reports ({filteredReports.length})
              </span>
              <Badge variant="cyan">{activeTab.toUpperCase()}</Badge>
            </div>

            <div className="space-y-2">
              {filteredReports.map((rep, idx) => {
                const repId = rep.report_id || rep.id || `rep-${idx}`;
                const genAt = rep.generated_at || rep.created_at || new Date().toISOString();
                const isSelected = selectedReport?.report_id === repId || selectedReport?.id === repId;
                return (
                  <div
                    key={repId}
                    onClick={() => setSelectedReport(rep)}
                    className={`p-3 rounded border cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#1e2430] border-[#00f0ff] text-[#f8fafc]'
                        : 'bg-[#11141a] border-[#1e2430] hover:bg-[#171c24]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                      <span className="text-[#00f0ff] font-bold">{repId}</span>
                      <span className="text-[#8b9bb4]">
                        {new Date(genAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-[#f8fafc] truncate">{rep.title}</div>
                  </div>
                );
              })}
            </div>
          </OrionCard>
        </div>

        {/* Detailed Report Document View (8 Cols) */}
        <div className="lg:col-span-8">
          <OrionCard glow="none" className="p-6 space-y-6 print:border-none print:shadow-none">
            {selectedReport ? (
              <>
                {/* Document Top Bar */}
                <div className="flex flex-wrap items-center justify-between pb-4 border-b border-[#1e2430] gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-[#00f0ff] block mb-1">
                      DOCUMENT REF: {selectedReport.report_id}
                    </span>
                    <h3 className="text-lg font-bold text-[#f8fafc]">{selectedReport.title}</h3>
                    <span className="text-xs text-[#8b9bb4] font-mono">
                      Generated: {new Date(selectedReport.generated_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 print:hidden">
                    <button
                      onClick={handlePrint}
                      className="px-3 py-1.5 rounded bg-[#171c24] border border-[#1e2430] text-[#d4af37] text-xs font-mono font-semibold hover:border-[#d4af37] transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="h-3.5 w-3.5" /> Print / PDF
                    </button>
                    <button
                      onClick={handleExportJSON}
                      className="px-3 py-1.5 rounded bg-[#ff1e42] text-white text-xs font-mono font-bold hover:bg-[#e01637] border border-[#d4af37]/40 transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#ff1e42]/20"
                    >
                      <Download className="h-3.5 w-3.5" /> Export JSON
                    </button>
                  </div>
                </div>

                {/* Report Content Sections */}
                {selectedReport.type === 'incident' && (
                  <div className="space-y-4 text-xs">
                    <div>
                      <h4 className="font-mono uppercase text-[#8b9bb4] text-[10px] mb-1">
                        Executive Forensics Summary
                      </h4>
                      <p className="text-[#f8fafc] leading-relaxed bg-[#171c24] p-3 rounded border border-[#1e2430]">
                        {selectedReport.executive_summary}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded bg-[#171c24] border border-[#1e2430]">
                        <span className="font-mono text-[#8b9bb4] text-[10px] uppercase block mb-1">
                          Affected Assets
                        </span>
                        <div className="font-mono text-[#f8fafc]">
                          {selectedReport.affected_assets?.join(', ') || 'None'}
                        </div>
                      </div>
                      <div className="p-3 rounded bg-[#171c24] border border-[#1e2430]">
                        <span className="font-mono text-[#8b9bb4] text-[10px] uppercase block mb-1">
                          Compromised Assets
                        </span>
                        <div className="font-mono text-[#ff1e42] font-bold">
                          {selectedReport.compromised_assets?.join(', ') || 'None'}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-mono uppercase text-[#8b9bb4] text-[10px] mb-2">
                        Strategic Mitigation Recommendations
                      </h4>
                      <ul className="space-y-2">
                        {selectedReport.recommendations?.map((rec: string, i: number) => (
                          <li
                            key={i}
                            className="p-2.5 rounded bg-[#11141a] border border-[#1e2430] text-[#f8fafc] flex items-center gap-2"
                          >
                            <CheckCircle className="h-4 w-4 text-[#00f0ff] flex-shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {selectedReport.type === 'optimization' && (
                  <div className="space-y-4 text-xs">
                    <div>
                      <h4 className="font-mono uppercase text-[#8b9bb4] text-[10px] mb-1">
                        Optimization Model
                      </h4>
                      <p className="text-[#f8fafc] font-mono bg-[#171c24] p-3 rounded border border-[#1e2430]">
                        {selectedReport.mathematical_model}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 font-mono">
                      <div className="p-3 rounded bg-[#171c24] border border-[#1e2430]">
                        <span className="text-[#8b9bb4] text-[10px] uppercase block">Budget Utilized</span>
                        <span className="text-lg font-bold text-[#00f0ff]">
                          ${selectedReport.summary?.budget_utilized}
                        </span>
                      </div>
                      <div className="p-3 rounded bg-[#171c24] border border-[#1e2430]">
                        <span className="text-[#8b9bb4] text-[10px] uppercase block">Risk Reduction</span>
                        <span className="text-lg font-bold text-[#00f0ff]">
                          +{selectedReport.summary?.total_risk_reduction} pts
                        </span>
                      </div>
                      <div className="p-3 rounded bg-[#171c24] border border-[#1e2430]">
                        <span className="text-[#8b9bb4] text-[10px] uppercase block">Reduction %</span>
                        <span className="text-lg font-bold text-[#f8fafc]">
                          {selectedReport.summary?.risk_reduction_pct}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedReport.type === 'benchmark' && (
                  <div className="space-y-4 text-xs">
                    <div>
                      <h4 className="font-mono uppercase text-[#8b9bb4] text-[10px] mb-1">
                        DAA Algorithmic Abstract
                      </h4>
                      <p className="text-[#f8fafc] leading-relaxed bg-[#171c24] p-3 rounded border border-[#1e2430]">
                        {selectedReport.abstract}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-mono uppercase text-[#8b9bb4] text-[10px] mb-2">
                        Theoretical vs Measured Complexity Matrix
                      </h4>
                      <div className="border border-[#1e2430] rounded overflow-hidden">
                        <table className="w-full text-left font-mono">
                          <thead className="bg-[#11141a] text-[#8b9bb4] border-b border-[#1e2430]">
                            <tr>
                              <th className="p-2.5">Algorithm</th>
                              <th className="p-2.5">Time Complexity</th>
                              <th className="p-2.5">Space</th>
                              <th className="p-2.5">Optimal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1e2430] text-[#f8fafc]">
                            {selectedReport.complexity_matrix?.map((row: any, i: number) => (
                              <tr key={i} className="hover:bg-[#171c24]">
                                <td className="p-2.5 font-bold">{row.algorithm}</td>
                                <td className="p-2.5 text-[#00f0ff]">{row.time || row.time_complexity}</td>
                                <td className="p-2.5 text-[#8b9bb4]">{row.space || row.space_complexity}</td>
                                <td className="p-2.5 text-[#00f0ff]">
                                  {row.optimal ? 'Yes' : 'No'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-24 text-center text-xs text-[#8b9bb4]">
                Select a report from the list to view full document
              </div>
            )}
          </OrionCard>
        </div>
      </div>
    </div>
  );
};

export default Reports;
