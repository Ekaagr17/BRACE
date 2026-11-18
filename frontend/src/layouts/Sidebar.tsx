import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Network,
  ShieldAlert,
  Flame,
  Cpu,
  Layers,
  Swords,
  BarChart3,
  FileText,
  Shield,
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Command Center', path: '/', icon: LayoutDashboard },
  { name: 'Network Lab', path: '/network-lab', icon: Network },
  { name: 'Threat Intelligence', path: '/threat-intel', icon: ShieldAlert },
  { name: 'Attack Reconstruction', path: '/attack-reconstruction', icon: Flame, badge: 'Live' },
  { name: 'Optimization Engine', path: '/optimization', icon: Cpu },
  { name: 'Algorithm Studio', path: '/algorithm-studio', icon: Layers },
  { name: 'Algorithm Arena', path: '/algorithm-arena', icon: Swords, badge: 'Run All' },
  { name: 'Performance Lab', path: '/performance-lab', icon: BarChart3 },
  { name: 'Reports & Evidence', path: '/reports', icon: FileText },
];

const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 flex-shrink-0 bg-[#0d0f12] border-r border-[#283142] flex flex-col h-screen select-none overflow-x-hidden">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-[#283142]">
        <div className="h-9 w-9 rounded border border-[#ff1e42]/60 bg-[#11141a] flex items-center justify-center shadow-[0_0_12px_rgba(255,30,66,0.3)]">
          <Shield className="h-5 w-5 text-[#d4af37] stroke-[2.2]" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-base tracking-wider text-[#f8fafc]">BRACE</span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/40">
              v1.0
            </span>
          </div>
          <p className="text-[10px] text-[#8b9bb4] font-mono tracking-tight truncate max-w-[150px]">
            Branch-and-Bound Risk
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-[#64748b]">
          Core Navigation
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded text-xs font-mono font-medium transition-colors duration-150 ${
                  isActive
                    ? 'bg-[#171c24] text-[#d4af37] border-l-2 border-[#ff1e42] shadow-inner font-semibold'
                    : 'text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#171c24]/60'
                }`
              }
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                    item.badge === 'Live'
                      ? 'bg-[#ff1e42]/20 text-[#ff1e42] border border-[#ff1e42]/40'
                      : 'bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/40'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-3.5 border-t border-[#283142] bg-[#11141a]">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-[#64748b] font-mono">DAA SOLVER</span>
          <span className="flex items-center gap-1.5 text-[10px] text-[#d4af37] font-mono">
            <span className="h-1.5 w-1.5 rounded-sm bg-[#ff1e42] animate-pulse" />
            ONLINE
          </span>
        </div>
        <div className="text-[10px] text-[#8b9bb4] font-mono truncate">
          0/1 Knapsack Branch & Bound
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
