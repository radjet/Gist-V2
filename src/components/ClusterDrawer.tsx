import React, { useEffect, useRef } from 'react';
import { X, MapPin, Clock, Newspaper, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import { useUIStore } from '../state/uiStore';
import { mockClusters } from '../mock/mockClusters';
import { BiasMeter } from './BiasMeter';

const ClusterDrawer: React.FC = () => {
  const { 
    isClusterDrawerOpen, 
    closeDrawer, 
    closePreview,
    isPreviewOpen,
    selectedClusterId, 
  } = useUIStore();
  
  const drawerRef = useRef<HTMLDivElement>(null);
  const selectedCluster = mockClusters.find(c => c.id === selectedClusterId);

  // Keyboard support (Escape only)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isPreviewOpen) closePreview();
        else if (isClusterDrawerOpen) closeDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isClusterDrawerOpen, isPreviewOpen]);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + 
           date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTagColor = (tag: string) => {
    switch(tag) {
      case 'CONFLICT': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'ECONOMY': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'TECH': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'CLIMATE': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  // Determine if we should show the perspective meter
  const showPerspective = selectedCluster && (
    selectedCluster.tag === 'POLITICS' || 
    selectedCluster.tag === 'CONFLICT' || 
    selectedCluster.tag === 'ECONOMY'
  );

  if (!isClusterDrawerOpen) return null;

  return (
    <>
      {/* Subtle Backdrop (Clickable) */}
      <div 
        className="fixed inset-0 z-30 bg-transparent"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Floating Panel */}
      <aside
        ref={drawerRef}
        className="fixed top-4 right-4 bottom-4 w-full sm:w-[420px] max-w-[calc(100vw-32px)] bg-surface/95 backdrop-blur-xl border border-white/10 shadow-2xl z-40 rounded-2xl overflow-hidden flex flex-col animate-in slide-in-from-right-8 duration-300"
      >
        {selectedCluster ? (
          <>
            {/* Header / Hero */}
            <div className="flex-shrink-0 bg-surface/50 border-b border-white/5 relative">
               {/* Close Overlay */}
               <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                 <button onClick={closeDrawer} className="p-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors shadow-sm">
                    <X size={16} />
                 </button>
               </div>

               {/* Hero Image */}
               {selectedCluster.imageUrl && (
                 <div className="w-full h-40 relative">
                    <img 
                      src={selectedCluster.imageUrl} 
                      alt="" 
                      className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface/95" />
                 </div>
               )}

               <div className="p-5 pt-4 relative">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider border ${getTagColor(selectedCluster.tag)}`}>
                      {selectedCluster.tag}
                    </span>
                    {selectedCluster.displayLocation && (
                      <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                        • {selectedCluster.displayLocation}
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl font-bold text-white leading-tight mb-3">
                    {selectedCluster.headline}
                  </h2>
                  
                  {/* Processing Status for Summary */}
                  {selectedCluster.status === 'processing' ? (
                     <div className="space-y-2 animate-pulse">
                        <div className="h-3 bg-white/10 rounded w-full" />
                        <div className="h-3 bg-white/10 rounded w-5/6" />
                        <div className="h-3 bg-white/10 rounded w-4/6" />
                        <div className="text-xs text-blue-400 flex items-center gap-2 mt-2">
                           <Loader2 size={12} className="animate-spin" />
                           Synthesizing overview...
                        </div>
                     </div>
                  ) : selectedCluster.status === 'failed' ? (
                     <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-300 flex items-center gap-2">
                        <AlertTriangle size={14} />
                        Unable to generate overview.
                     </div>
                  ) : (
                     <p className="text-sm text-slate-300 leading-relaxed">
                        {selectedCluster.summary}
                     </p>
                  )}

                  <div className="flex items-center gap-4 mt-4 text-[10px] text-slate-500 font-mono border-t border-white/5 pt-3">
                    <div className="flex items-center gap-1.5">
                       <TrendingUp size={12} />
                       INTENSITY: {Math.round(selectedCluster.intensity * 100)}
                    </div>
                    <div className="flex items-center gap-1.5">
                       <Clock size={12} />
                       {formatTime(selectedCluster.lastSeenAt)}
                    </div>
                  </div>
                  
                  {/* Bias Meter Block (Spectrum) - Conditionally Rendered */}
                  {showPerspective && selectedCluster.bias && (
                     <div className="mt-4 pt-3 border-t border-white/5">
                        <BiasMeter bias={selectedCluster.bias} />
                     </div>
                  )}
               </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-surface/30 gist-scroll">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider sticky top-0 bg-surface/95 backdrop-blur py-2 z-10">
                <Newspaper size={14} className="text-primary" />
                Coverage ({selectedCluster.coverage.length})
              </div>

              {selectedCluster.coverage.map((item) => (
                <a 
                  key={item.id}
                  href={item.url}
                  className="block group rounded-xl border border-white/5 bg-white/5 overflow-hidden hover:bg-white/10 hover:border-white/20 transition-all"
                >
                   <div className="flex">
                      {item.imageUrl && (
                         <div className="w-24 h-auto relative shrink-0">
                           <img src={item.imageUrl} className="w-full h-full object-cover" alt="" />
                         </div>
                      )}
                      <div className="p-3 flex-1 min-w-0">
                         <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-bold text-primary/90">
                              {item.sourceName} <span className="opacity-50 font-normal">{item.sourceCountry}</span>
                            </span>
                            <span className="text-[9px] text-slate-500 whitespace-nowrap ml-2">
                               {formatTime(item.publishedAt)}
                            </span>
                         </div>
                         <h3 className="text-xs font-medium text-slate-200 group-hover:text-white leading-snug line-clamp-2 mb-1.5">
                           {item.headline}
                         </h3>
                         {item.status === 'processing' ? (
                            <div className="h-2 w-2/3 bg-white/10 rounded animate-pulse" />
                         ) : (
                            <p className="text-[10px] text-slate-400 line-clamp-2">
                               {item.summary}
                            </p>
                         )}
                      </div>
                   </div>
                </a>
              ))}
            </div>
          </>
        ) : (
           <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
              <MapPin className="mb-4 opacity-50" size={32} />
              <p className="text-sm">Select a hotspot to view intelligence.</p>
           </div>
        )}
      </aside>
    </>
  );
};

export default ClusterDrawer;
