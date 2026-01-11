import React from 'react';
import { Filter, SlidersHorizontal, BarChart3 } from 'lucide-react';

export const BottomLeftHUD: React.FC = () => {
  const pillClass = "flex items-center gap-2 px-4 py-2 bg-surface/60 backdrop-blur-md border border-white/10 rounded-full text-sm font-medium text-slate-300 hover:text-white hover:bg-surface/80 hover:border-white/20 transition-all shadow-lg cursor-pointer select-none active:scale-95";

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pointer-events-auto">
      {/* Filter Chips Group */}
      <div className="flex items-center gap-2 p-1 bg-surface/30 backdrop-blur-sm rounded-full border border-white/5">
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface/60 border border-white/10 text-xs font-medium text-slate-200 shadow-sm hover:bg-surface/80 transition-colors">
          <Filter size={12} />
          Filter
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-white/5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors">
          General
        </button>
      </div>

      {/* Article Density */}
      <button className={pillClass}>
        <BarChart3 size={16} />
        Article Density
      </button>
    </div>
  );
};