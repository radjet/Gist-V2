import React from 'react';
import { Radio, MapPin, Zap } from 'lucide-react';
import { useUIStore } from '../../state/uiStore';
import { mockClusters } from '../../mock/mockClusters';
import { haversineKm } from '../../lib/geo';

const STACK_LIST_SIZE = 10;

export const HotspotStack: React.FC = () => {
  const { 
    scannableClusterIds, 
    scanIndex, 
    jumpToHotspot, 
    userLocation, 
    requestUserLocation, 
    isScanEnabled,
    isHotspotStackOpen
  } = useUIStore();

  if (!isHotspotStackOpen) return null;

  // Get the top N items from the ranked list
  const topIds = scannableClusterIds.slice(0, STACK_LIST_SIZE);
  const items = topIds.map(id => mockClusters.find(c => c.id === id)).filter(Boolean) as typeof mockClusters;

  return (
    <div className="absolute bottom-16 left-4 w-72 bg-surface/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 z-20 pointer-events-auto">
      
      {/* Header */}
      <div className="p-3 border-b border-white/10 flex items-center justify-between bg-white/5">
        <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <Radio size={12} className="text-primary" />
          Global Intel
        </span>
        
        {!userLocation ? (
          <button 
            onClick={requestUserLocation}
            className="flex items-center gap-1 text-[10px] bg-primary/20 text-primary-200 px-2 py-0.5 rounded hover:bg-primary/30 transition-colors"
          >
            <MapPin size={10} />
            Use Location
          </button>
        ) : (
           <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
             <MapPin size={10} />
             Loc: On
           </span>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto max-h-[300px] py-1 gist-scroll">
        {items.map((cluster, i) => {
          const isActive = isScanEnabled && scannableClusterIds[scanIndex] === cluster.id;
          
          let distStr = '';
          if (userLocation) {
             const km = haversineKm(userLocation.lat, userLocation.lng, cluster.lat, cluster.lng);
             distStr = km < 1000 ? `${Math.round(km)}km` : `${(km/1000).toFixed(1)}k km`;
          }

          return (
            <button
              key={cluster.id}
              onClick={() => jumpToHotspot(cluster.id)}
              className={`w-full text-left px-2 py-2 flex items-start gap-2 transition-colors border-l-2 ${
                isActive 
                  ? 'bg-primary/10 border-primary' 
                  : 'border-transparent hover:bg-white/5 hover:border-white/20'
              }`}
            >
              {/* Thumbnail or Fallback */}
              <div className="w-8 h-8 rounded bg-white/10 shrink-0 overflow-hidden mt-0.5">
                {cluster.imageUrl ? (
                   <img src={cluster.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                   <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500 font-bold">
                     {cluster.tag[0]}
                   </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                   <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                         {cluster.tag}
                      </span>
                      {cluster.displayLocation && (
                        <span className="text-[9px] text-slate-500 truncate">
                          • {cluster.displayLocation}
                        </span>
                      )}
                   </div>
                   {cluster.isBreaking && <Zap size={10} className="text-yellow-400 fill-yellow-400/20 shrink-0" />}
                </div>

                <div className={`truncate text-xs font-medium leading-snug ${isActive ? 'text-white' : 'text-slate-300'}`}>
                   {cluster.headline}
                </div>
                
                <div className="flex items-center gap-2 mt-1">
                   <div className="h-0.5 flex-1 bg-white/10 rounded-full overflow-hidden">
                     <div 
                       className={`h-full ${isActive ? 'bg-primary' : 'bg-slate-500'}`} 
                       style={{ width: `${cluster.intensity * 100}%` }}
                     />
                   </div>
                   {distStr && <span className="text-[9px] text-slate-500 font-mono">{distStr}</span>}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
