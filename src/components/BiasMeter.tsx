import React from 'react';
import { BiasInfo } from '../types/gist';

interface BiasMeterProps {
  bias: BiasInfo;
  className?: string;
}

export const BiasMeter: React.FC<BiasMeterProps> = ({ bias, className = '' }) => {
  // Determine active chip
  const isLeft = bias.label === 'left' || (bias.label !== 'non_political' && bias.score < 0.4);
  const isCenter = bias.label === 'center' || (bias.label !== 'non_political' && bias.score >= 0.4 && bias.score <= 0.6);
  const isRight = bias.label === 'right' || (bias.label !== 'non_political' && bias.score > 0.6);
  const isNonPol = bias.label === 'non_political';

  const getConfidenceText = () => {
    if (bias.confidence > 0.8) return 'High';
    if (bias.confidence > 0.5) return 'Medium';
    return 'Low';
  };

  const Chip: React.FC<{ active: boolean; label: string; colorClass: string }> = ({ active, label, colorClass }) => (
    <div 
      className={`
        flex-1 py-1.5 px-1 rounded-md text-[9px] font-mono uppercase tracking-wider text-center border transition-all duration-500
        ${active 
          ? `${colorClass} text-white border-transparent scale-105 shadow-[0_0_12px_rgba(255,255,255,0.25)] ring-1 ring-white/20` 
          : 'bg-white/5 text-slate-500 border-white/5 hover:border-white/10'
        }
      `}
    >
      {label}
    </div>
  );

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted font-mono">
        <span>Perspective (Beta)</span>
      </div>
      
      {/* Spectrum Chips */}
      <div className="flex items-center gap-1.5 w-full">
        <Chip active={isLeft} label="Left" colorClass="bg-blue-600" />
        <Chip active={isCenter} label="Center" colorClass="bg-purple-600" />
        <Chip active={isRight} label="Right" colorClass="bg-red-600" />
        <Chip active={isNonPol} label="Non-Pol" colorClass="bg-slate-600" />
      </div>

      <div className="text-[9px] text-slate-500 font-mono text-right">
        Confidence: <span className="text-slate-400">{getConfidenceText()}</span>
      </div>
    </div>
  );
};
