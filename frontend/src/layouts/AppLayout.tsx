import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': {
    title: 'Command Center',
    subtitle: 'Cybersecurity posture, asset status, and defense optimization overview',
  },
  '/network-lab': {
    title: 'Network Lab',
    subtitle: 'Interactive virtual network topology, asset profiling, and vulnerability graph',
  },
  '/threat-intel': {
    title: 'Threat Intelligence',
    subtitle: 'Identified vulnerabilities, CVE severity breakdown, and defensive control catalogue',
  },
  '/attack-reconstruction': {
    title: 'Attack Reconstruction Engine',
    subtitle: 'Synchronized kill chain replay, event inspector, and BRACE Explain',
  },
  '/optimization': {
    title: 'Defensive Optimization Engine',
    subtitle: '0/1 Knapsack resource allocation under budgetary constraints',
  },
  '/algorithm-studio': {
    title: 'Algorithm Studio',
    subtitle: 'Step-by-step search visualization: Brute Force, Greedy, and Branch & Bound trees',
  },
  '/algorithm-arena': {
    title: 'Algorithm Arena',
    subtitle: 'Three-algorithm head-to-head comparison: Brute Force vs Greedy vs Branch & Bound',
  },
  '/performance-lab': {
    title: 'Performance Lab',
    subtitle: '10 academic benchmark analytics: runtime scaling, pruning efficiency, and optimality gap',
  },
  '/reports': {
    title: 'Reports & Evidence',
    subtitle: 'Incident forensics, optimization summaries, and academic benchmark reports',
  },
};

const AppLayout: React.FC = () => {
  const location = useLocation();
  const currentInfo = PAGE_TITLES[location.pathname] || {
    title: 'BRACE Platform',
    subtitle: 'Branch-and-Bound Risk Analysis for Cybersecurity and Exposure',
  };

  return (
    <div className="flex h-screen w-screen max-w-full overflow-x-hidden bg-[#0a0c0f] text-[#f8fafc] font-sans antialiased">
      {/* Orion Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen max-w-full overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="h-16 flex-shrink-0 border-b border-[#283142] bg-[#11141a]/95 px-6 flex items-center justify-between z-10">
          <div className="truncate mr-4">
            <h1 className="text-base font-bold tracking-tight text-[#f8fafc] flex items-center gap-2">
              {currentInfo.title}
            </h1>
            <p className="text-[11px] text-[#94a3b8] font-normal tracking-normal truncate max-w-xl">
              {currentInfo.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Simulation Status Badge - Sharp, Stark Red and Metallic Gold */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#171c24] border border-[#283142] text-xs font-mono">
              <span className="h-2 w-2 rounded-sm bg-[#ff1e42] animate-pulse" />
              <span className="text-[#8b9bb4]">KERNEL:</span>
              <span className="text-[#d4af37] font-bold">DAA-01-KNAPSACK</span>
            </div>
          </div>
        </header>

        {/* Dynamic Page Viewport - Strict overflow-x-hidden, no horizontal scroll */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-6 custom-scrollbar bg-[#0a0c0f] max-w-full">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
