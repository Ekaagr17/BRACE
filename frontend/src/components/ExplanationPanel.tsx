import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, MessageCircle, AlertTriangle, ChevronDown } from 'lucide-react';
import type { AttackExplanation } from '@/types';

interface ExplanationPanelProps {
  explanation?: AttackExplanation | null;
  technical?: string;
  plainEnglish?: string;
  whyItMatters?: string;
  title?: string;
}

type Layer = 'technical' | 'plain_english' | 'why_it_matters';

const layerConfig: { key: Layer; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'technical', label: 'Technical Detail', icon: <Code2 size={14} />, color: '#00f0ff' },
  { key: 'plain_english', label: 'Plain English', icon: <MessageCircle size={14} />, color: '#d4af37' },
  { key: 'why_it_matters', label: 'Why It Matters', icon: <AlertTriangle size={14} />, color: '#ff1e42' },
];

const ExplanationPanel: React.FC<ExplanationPanelProps> = ({
  explanation,
  technical,
  plainEnglish,
  whyItMatters,
  title,
}) => {
  const [activeLayer, setActiveLayer] = useState<Layer>('plain_english');

  const expObj = explanation || {
    technical: technical || '',
    plain_english: plainEnglish || '',
    why_it_matters: whyItMatters || '',
  };

  if (!expObj.technical && !expObj.plain_english && !expObj.why_it_matters) {
    return (
      <div className="bg-[#11141a] border border-[#1e2430] rounded p-5">
        <h3 className="text-xs font-bold text-[#8b9bb4] uppercase tracking-wider mb-3">
          {title || 'BRACE Explain'}
        </h3>
        <p className="text-[#8b9bb4] text-sm">Select an event to see its explanation.</p>
      </div>
    );
  }

  const content: Record<Layer, string> = {
    technical: expObj.technical,
    plain_english: expObj.plain_english,
    why_it_matters: expObj.why_it_matters,
  };

  return (
    <div className="bg-[#11141a] border border-[#1e2430] rounded p-5">
      <h3 className="text-xs font-bold text-[#8b9bb4] uppercase tracking-wider mb-3">
        {title || 'BRACE Explain'}
      </h3>
      {/* Layer tabs */}
      <div className="flex gap-1.5 mb-3">
        {layerConfig.map((layer) => (
          <button
            key={layer.key}
            onClick={() => setActiveLayer(layer.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeLayer === layer.key
                ? 'text-[#f8fafc] border'
                : 'text-[#8b9bb4] border border-transparent hover:text-[#f8fafc]'
            }`}
            style={
              activeLayer === layer.key
                ? { backgroundColor: `${layer.color}15`, color: layer.color, borderColor: `${layer.color}40` }
                : {}
            }
          >
            {layer.icon}
            {layer.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeLayer}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="text-sm text-[#8b9bb4] leading-relaxed whitespace-pre-line"
        >
          {content[activeLayer]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ExplanationPanel;
