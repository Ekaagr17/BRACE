import React from 'react';

interface OrionCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: 'cyan' | 'red' | 'gold' | 'green' | 'none' | 'purple' | 'neutral' | 'titanium';
  onClick?: () => void;
}

const glowMap: Record<string, string> = {
  cyan: 'border-[#00f0ff]/40 shadow-[0_0_15px_rgba(0,240,255,0.12)]',
  red: 'border-[#ff1e42]/40 shadow-[0_0_15px_rgba(255,30,66,0.12)]',
  gold: 'border-[#d4af37]/40 shadow-[0_0_15px_rgba(212,175,55,0.12)]',
  titanium: 'border-[#8b9bb4]/40 shadow-[0_0_15px_rgba(139,155,180,0.12)]',
  green: 'border-[#00f0ff]/40 shadow-[0_0_15px_rgba(0,240,255,0.12)]',
  purple: 'border-[#d4af37]/40 shadow-[0_0_15px_rgba(212,175,55,0.12)]', // Remapped from purple to metallic gold
  neutral: 'border-[#283142]',
  none: 'border-[#283142]',
};

const OrionCard: React.FC<OrionCardProps> = ({ children, className = '', glow = 'none', onClick }) => {
  const glowClass = glowMap[glow] || glowMap.none;

  return (
    <div
      className={`bg-[#171c24] border rounded-lg p-5 transition-colors duration-150 ${glowClass} ${
        onClick ? 'cursor-pointer hover:border-[#00f0ff]' : ''
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default OrionCard;
