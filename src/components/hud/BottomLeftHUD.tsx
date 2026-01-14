import React from 'react';
import { Filter, BarChart3, ChevronLeft, ChevronRight, Radar, List } from 'lucide-react';
import { useUIStore } from '../../state/uiStore';

export const BottomLeftHUD: React.FC = () => {
  const { 
    isHeatmapEnabled, 
    toggleHeatmap, 
    isScanEnabled, 
    toggleScan, 
    nextHotspot, 
    prevHotspot,
    scanIndex,
    scannableClusterIds,
    isHotspotStackOpen,
    toggleHotspotStack
  } = useUIStore();

  const pillClass = "flex items-center gap-2 px-4 py-2 bg-surface/60 backdrop-blur-md border border-white/10 rounded-full text-sm font-medium text-slate-300 hover:text-white hover:bg-surface/80 hover:border-white/20 transition-all shadow-lg cursor-pointer select-none active:scale-95";
  const activePillClass = "flex items-center gap-2 px-4 py-2 bg-primary/20 backdrop-blur-md border border-primary/50 rounded-full text-sm font-medium text-primary-200 shadow-[0_0_15px_rgba(59,130,246,0.2)] cursor-pointer select-none active:scale-95";
  
  const iconBtnClass = "p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors active:scale-95";

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
      <button 
        className={isHeatmapEnabled ? activePillClass : pillClass}
        onClick={toggleHeatmap}
      >
        <BarChart3 size={16} />
        Density
      </button>

      {/* Hotspots Stack Toggle */}
      <button 
        className={isHotspotStackOpen ? activePillClass : pillClass}
        onClick={toggleHotspotStack}
      >
        <List size={16} />
        Hotspots
      </button>

      {/* Scan Hotspots Control */}
      {isScanEnabled ? (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface/80 backdrop-blur-md border border-primary/40 rounded-full shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-1 border-r border-white/10 pr-2 mr-1 cursor-pointer" onClick={toggleScan}>
             <Radar size={16} className="text-primary" />
             <span className="text-xs font-mono font-medium text-primary-200">
               {scanIndex + 1}/{scannableClusterIds.length}
             </span>
          </div>
          
          <button onClick={prevHotspot} className={iconBtnClass} title="Previous">
            <ChevronLeft size={18} />
          </button>
          
          <button onClick={nextHotspot} className={iconBtnClass} title="Next">
            <ChevronRight size={18} />
          </button>
        </div>
      ) : (
        <button 
          className={pillClass}
          onClick={toggleScan}
        >
          <Radar size={16} />
          Scan
        </button>
      )}
    </div>
  );
};
