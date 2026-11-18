import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', label }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-8">
    <motion.div
      className={`${sizes[size]} border-2 border-[#2a2a3d] border-t-[#00d4ff] rounded-full`}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
    />
    {label && <span className="text-sm text-[#6b6b80]">{label}</span>}
  </div>
);

export default LoadingSpinner;
