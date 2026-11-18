import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode | React.ComponentType<any>;
  subtitle?: string;
  trend?: number; // percentage change
  trendLabel?: string;
  color?: 'cyan' | 'gold' | 'red' | 'titanium' | 'silver' | 'green' | 'purple' | 'orange' | 'blue';
  suffix?: string;
  prefix?: string;
}

const colorMap = {
  cyan: { accent: '#00f0ff', bg: 'rgba(0, 240, 255, 0.08)', border: '#00f0ff' },
  gold: { accent: '#d4af37', bg: 'rgba(212, 175, 55, 0.08)', border: '#d4af37' },
  red: { accent: '#ff1e42', bg: 'rgba(255, 30, 66, 0.08)', border: '#ff1e42' },
  titanium: { accent: '#8b9bb4', bg: 'rgba(139, 155, 180, 0.08)', border: '#8b9bb4' },
  silver: { accent: '#94a3b8', bg: 'rgba(148, 163, 184, 0.08)', border: '#94a3b8' },
  green: { accent: '#00f0ff', bg: 'rgba(0, 240, 255, 0.08)', border: '#00f0ff' },
  // Remapped variants to prevent purple
  purple: { accent: '#d4af37', bg: 'rgba(212, 175, 55, 0.08)', border: '#d4af37' },
  orange: { accent: '#d4af37', bg: 'rgba(212, 175, 55, 0.08)', border: '#d4af37' },
  blue: { accent: '#00f0ff', bg: 'rgba(0, 240, 255, 0.08)', border: '#00f0ff' },
};

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  subtitle,
  trend,
  trendLabel,
  color = 'cyan',
  suffix,
  prefix,
}) => {
  const c = colorMap[color] || colorMap.cyan;
  const TrendIcon = trend !== undefined ? (trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus) : null;
  const trendColor =
    trend !== undefined ? (trend > 0 ? 'text-[#00f0ff]' : trend < 0 ? 'text-[#ff1e42]' : 'text-[#8b9bb4]') : '';

  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    const IconComponent = icon as React.ComponentType<{ size?: number; className?: string }>;
    return <IconComponent size={18} />;
  };

  return (
    <div className="bg-[#171c24] border border-[#283142] rounded-lg p-5 shadow-md transition-colors duration-150 hover:border-[#39465e]">
      <div className="flex items-start justify-between mb-3">
        <span className="text-[11px] font-mono uppercase tracking-wider text-[#94a3b8]">{label}</span>
        {icon && (
          <div className="w-8 h-8 rounded border border-[#283142] flex items-center justify-center bg-[#11141a]">
            <span style={{ color: c.accent }}>{renderIcon()}</span>
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1">
        {prefix && <span className="text-base font-semibold text-[#94a3b8]">{prefix}</span>}
        <span className="text-2xl font-bold font-mono tracking-tight" style={{ color: c.accent }}>
          {value}
        </span>
        {suffix && <span className="text-xs font-mono text-[#94a3b8] ml-1">{suffix}</span>}
      </div>

      {subtitle && <p className="text-[11px] text-[#64748b] font-mono mt-1 truncate">{subtitle}</p>}

      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-mono ${trendColor}`}>
          {TrendIcon && <TrendIcon size={13} />}
          <span className="font-semibold">{Math.abs(trend)}%</span>
          {trendLabel && <span className="text-[#64748b] ml-1">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
};

export default StatCard;
