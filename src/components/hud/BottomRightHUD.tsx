import React from 'react';
import { Crosshair, Plus, Minus } from 'lucide-react';

export const BottomRightHUD: React.FC = () => {
  const buttonBase = "flex items-center justify-center bg-surface/60 backdrop-blur-md border border-white/10 text-slate-300 hover:text-white hover:bg-surface/80 hover:border-white/20 transition-all shadow-lg active:bg-surface";

  return (
    <div className="flex flex-col items-center gap-3 pointer-events-auto">
      {/* Locate Button */}
      <button 
        className={`${buttonBase} w-10 h-10 rounded-full`}
        aria-label="Locate me"
      >
        <Crosshair size={20} />
      </button>

      {/* Zoom Controls */}
      <div className="flex flex-col rounded-full overflow-hidden border border-white/10 shadow-lg">
        <button 
          className="flex items-center justify-center w-10 h-10 bg-surface/60 backdrop-blur-md hover:bg-surface/80 text-slate-300 hover:text-white transition-colors border-b border-white/10 active:bg-surface"
          aria-label="Zoom in"
        >
          <Plus size={20} />
        </button>
        <button 
          className="flex items-center justify-center w-10 h-10 bg-surface/60 backdrop-blur-md hover:bg-surface/80 text-slate-300 hover:text-white transition-colors active:bg-surface"
          aria-label="Zoom out"
        >
          <Minus size={20} />
        </button>
      </div>
    </div>
  );
};