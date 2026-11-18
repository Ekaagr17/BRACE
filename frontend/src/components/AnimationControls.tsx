import React from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react';

interface AnimationControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onStepForward?: () => void;
  onStepBackward?: () => void;
  onRestart: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  currentStep?: number;
  totalSteps?: number;
  label?: string;
}

const speedOptions = [0.5, 1, 2, 4];

const AnimationControls: React.FC<AnimationControlsProps> = ({
  isPlaying,
  onPlay,
  onPause,
  onNext,
  onPrev,
  onStepForward,
  onStepBackward,
  onRestart,
  speed,
  onSpeedChange,
  currentStep,
  totalSteps,
  label,
}) => {
  const handleNext = onNext || onStepForward || (() => {});
  const handlePrev = onPrev || onStepBackward || (() => {});

  return (
    <div className="flex flex-wrap items-center gap-2.5 bg-[#11141a] border border-[#283142] rounded-md px-3 py-2 text-xs">
      {label && <span className="font-mono text-[11px] uppercase tracking-wider text-[#64748b] mr-1">{label}</span>}

      <button
        onClick={onRestart}
        className="p-1.5 rounded border border-transparent hover:border-[#283142] hover:bg-[#171c24] text-[#94a3b8] hover:text-[#d4af37] transition-colors"
        title="Restart"
      >
        <RotateCcw size={14} />
      </button>

      <button
        onClick={handlePrev}
        className="p-1.5 rounded border border-transparent hover:border-[#283142] hover:bg-[#171c24] text-[#94a3b8] hover:text-[#d4af37] transition-colors"
        title="Previous Step"
      >
        <SkipBack size={14} />
      </button>

      <button
        onClick={isPlaying ? onPause : onPlay}
        className="px-3 py-1.5 rounded bg-[#ff1e42] text-white font-semibold hover:bg-[#e01637] border border-[#d4af37]/40 transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#ff1e42]/20"
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause size={14} /> : <Play size={14} className="fill-current" />}
        <span className="font-mono text-[11px] uppercase">{isPlaying ? 'Pause' : 'Play'}</span>
      </button>

      <button
        onClick={handleNext}
        className="p-1.5 rounded border border-transparent hover:border-[#283142] hover:bg-[#171c24] text-[#94a3b8] hover:text-[#d4af37] transition-colors"
        title="Next Step"
      >
        <SkipForward size={14} />
      </button>

      <div className="h-4 w-px bg-[#283142] mx-1" />

      {/* Speed selector */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-mono text-[#64748b] mr-1 uppercase">Speed:</span>
        {speedOptions.map((s) => (
          <button
            key={s}
            onClick={() => onSpeedChange(s)}
            className={`px-2 py-0.5 rounded font-mono text-[10px] transition-colors ${
              speed === s
                ? 'bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37] font-bold'
                : 'text-[#64748b] hover:text-[#94a3b8] border border-transparent hover:border-[#283142]'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>

      {currentStep !== undefined && totalSteps !== undefined && (
        <span className="font-mono text-[11px] text-[#64748b] ml-2">
          {currentStep + 1}/{totalSteps}
        </span>
      )}
    </div>
  );
};

export default AnimationControls;
