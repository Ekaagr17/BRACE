import React from 'react';

interface BadgeProps {
  variant:
    | 'critical'
    | 'high'
    | 'medium'
    | 'low'
    | 'info'
    | 'success'
    | 'warning'
    | 'default'
    | 'cyan'
    | 'purple'
    | 'danger'
    | 'neutral'
    | 'gold'
    | 'titanium';
  children: React.ReactNode;
  size?: 'sm' | 'md';
  dot?: boolean;
}

const variantStyles: Record<BadgeProps['variant'], { bg: string; text: string; dot: string; border: string }> = {
  critical: { bg: 'bg-[#ff1e42]/15', text: 'text-[#ff1e42]', dot: 'bg-[#ff1e42]', border: 'border-[#ff1e42]/30' },
  danger: { bg: 'bg-[#ff1e42]/15', text: 'text-[#ff1e42]', dot: 'bg-[#ff1e42]', border: 'border-[#ff1e42]/30' },
  high: { bg: 'bg-[#ff1e42]/15', text: 'text-[#ff1e42]', dot: 'bg-[#ff1e42]', border: 'border-[#ff1e42]/30' },
  warning: { bg: 'bg-[#d4af37]/15', text: 'text-[#d4af37]', dot: 'bg-[#d4af37]', border: 'border-[#d4af37]/30' },
  gold: { bg: 'bg-[#d4af37]/15', text: 'text-[#d4af37]', dot: 'bg-[#d4af37]', border: 'border-[#d4af37]/30' },
  medium: { bg: 'bg-[#d4af37]/15', text: 'text-[#d4af37]', dot: 'bg-[#d4af37]', border: 'border-[#d4af37]/30' },
  low: { bg: 'bg-[#8b9bb4]/15', text: 'text-[#8b9bb4]', dot: 'bg-[#8b9bb4]', border: 'border-[#8b9bb4]/30' },
  titanium: { bg: 'bg-[#8b9bb4]/15', text: 'text-[#8b9bb4]', dot: 'bg-[#8b9bb4]', border: 'border-[#8b9bb4]/30' },
  info: { bg: 'bg-[#00f0ff]/15', text: 'text-[#00f0ff]', dot: 'bg-[#00f0ff]', border: 'border-[#00f0ff]/30' },
  cyan: { bg: 'bg-[#00f0ff]/15', text: 'text-[#00f0ff]', dot: 'bg-[#00f0ff]', border: 'border-[#00f0ff]/30' },
  purple: { bg: 'bg-[#d4af37]/15', text: 'text-[#d4af37]', dot: 'bg-[#d4af37]', border: 'border-[#d4af37]/30' }, // Remapped from purple to metallic gold
  success: { bg: 'bg-[#00f0ff]/15', text: 'text-[#00f0ff]', dot: 'bg-[#00f0ff]', border: 'border-[#00f0ff]/30' },
  neutral: { bg: 'bg-[#283142]/40', text: 'text-[#94a3b8]', dot: 'bg-[#94a3b8]', border: 'border-[#283142]' },
  default: { bg: 'bg-[#283142]/40', text: 'text-[#94a3b8]', dot: 'bg-[#94a3b8]', border: 'border-[#283142]' },
};

const Badge: React.FC<BadgeProps> = ({ variant, children, size = 'sm', dot = false }) => {
  const s = variantStyles[variant] || variantStyles.default;
  const sizeClass = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border font-mono font-medium tracking-tight ${s.bg} ${s.text} ${s.border} ${sizeClass}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-sm ${s.dot}`} />}
      {children}
    </span>
  );
};

export default Badge;
