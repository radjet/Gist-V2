import React, { useEffect, useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { Hotspot } from '../types';

interface PinContextLayerProps {
  map: mapboxgl.Map | null;
  clusters: Hotspot[];
  selectedId: string | null;
  hoveredId: string | null;
}

interface PopupState {
  id: string;
  x: number;
  y: number;
  cluster: Hotspot;
  type: 'selected' | 'hovered' | 'auto';
}

// --- TUNING KNOBS ---
const SAFE_MARGIN_X_PCT = 0.15; // 15% margin on sides
const SAFE_MARGIN_Y_PCT = 0.15; // 15% margin top/bottom
const MAX_POPUPS_CAP = 10;

// Budget Config: Max popups allowed at given zoom ranges (excluding selected/hovered)
const ZOOM_BUDGETS = [
  { zoom: 0, count: 0 },   // Zoom 0-2: Clean globe (only selected)
  { zoom: 3, count: 2 },   // Zoom 3+: Top 2
  { zoom: 4.5, count: 5 }, // Zoom 4.5+: Top 5
  { zoom: 6, count: MAX_POPUPS_CAP } // Zoom 6+: Max
];

export const PinContextLayer: React.FC<PinContextLayerProps> = ({ 
  map, 
  clusters, 
  selectedId, 
  hoveredId 
}) => {
  const [popups, setPopups] = useState<PopupState[]>([]);
  
  // We use a ref to track the animation frame request to avoid stacking
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!map) return;

    const update = () => {
      // Clear any pending frame
      if (rafRef.current) {
         cancelAnimationFrame(rafRef.current);
      }

      // Schedule the work for the next animation frame
      rafRef.current = requestAnimationFrame(() => {
          performUpdate();
      });
    };

    const performUpdate = () => {
        if (!map) return;

        const zoom = map.getZoom();
        const canvas = map.getCanvas();
        const width = canvas.width;
        const height = canvas.height;

        // 1. Determine "Auto" Budget
        let autoBudget = 0;
        for (const level of ZOOM_BUDGETS) {
          if (zoom >= level.zoom) autoBudget = level.count;
        }

        // 2. Identify Rendered (Visible) Features for Occlusion Check
        // queryRenderedFeatures is the source of truth for "is this point on the visible face of the globe?"
        // We query the circles layer to know what Mapbox thinks is visible.
        const rendered = map.queryRenderedFeatures({ layers: ['clusters-circles'] });
        const renderedIds = new Set(rendered.map(f => f.properties?.id));

        // 3. Prepare Lists
        const nextPopups: PopupState[] = [];
        const processedIds = new Set<string>();

        // Helper to project and add
        const addPopup = (c: Hotspot, type: 'selected' | 'hovered' | 'auto') => {
            if (processedIds.has(c.id)) return;

            // Project
            const projected = map.project([c.lng, c.lat]);
            
            // Basic screen bounds check (loose)
            if (projected.x < -50 || projected.x > width + 50 || projected.y < -50 || projected.y > height + 50) {
               return;
            }

            nextPopups.push({
                id: c.id,
                x: projected.x,
                y: projected.y,
                cluster: c,
                type
            });
            processedIds.add(c.id);
        };

        // 4. Priority 1: Selected
        // Always attempt to show selected, even if momentarily occluded by fast zoom
        if (selectedId) {
            const c = clusters.find(x => x.id === selectedId);
            if (c) addPopup(c, 'selected');
        }

        // 5. Priority 2: Hovered
        if (hoveredId && hoveredId !== selectedId) {
            const c = clusters.find(x => x.id === hoveredId);
            // Only show hover if actually visible/rendered to avoid confusing ghosts through the globe
            if (c && renderedIds.has(c.id)) {
                addPopup(c, 'hovered');
            }
        }

        // 6. Priority 3: Auto (Budgeted)
        // Filter candidates
        const candidates = clusters.filter(c => {
            if (processedIds.has(c.id)) return false; // Already added
            if (!renderedIds.has(c.id)) return false; // Occluded/Off-screen according to Mapbox
            return true;
        });

        // Safe Zone Check for Auto Only (Don't clutter edges)
        const safeXMin = width * SAFE_MARGIN_X_PCT;
        const safeXMax = width * (1 - SAFE_MARGIN_X_PCT);
        const safeYMin = height * SAFE_MARGIN_Y_PCT;
        const safeYMax = height * (1 - SAFE_MARGIN_Y_PCT);

        const scoredCandidates = candidates.map(c => {
            const p = map.project([c.lng, c.lat]);
            const inSafe = p.x >= safeXMin && p.x <= safeXMax && p.y >= safeYMin && p.y <= safeYMax;
            return { c, inSafe, score: c.intensity };
        }).filter(item => item.inSafe);

        // Sort by intensity
        scoredCandidates.sort((a, b) => b.score - a.score);

        // Fill Budget
        for (let i = 0; i < Math.min(scoredCandidates.length, autoBudget); i++) {
            addPopup(scoredCandidates[i].c, 'auto');
        }

        setPopups(nextPopups);
    };

    // Bind to high-frequency events
    map.on('move', update);
    map.on('zoom', update);
    map.on('rotate', update);
    map.on('pitch', update);
    map.on('resize', update);
    
    // Initial run
    performUpdate();

    return () => {
      map.off('move', update);
      map.off('zoom', update);
      map.off('rotate', update);
      map.off('pitch', update);
      map.off('resize', update);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [map, clusters, selectedId, hoveredId]);

  if (!map || popups.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {popups.map(p => {
        const isSelected = p.type === 'selected';
        
        // CSS Transform for Position (Hardware Accelerated, No Transition Lag)
        // Note: -160% Y translation centers it above the pin
        // IMPORTANT: We use translate3d for GPU acceleration and to avoid sub-pixel blurring issues sometimes seen with translate
        const transform = `translate3d(${p.x}px, ${p.y}px, 0) translate(-50%, -160%)`;

        return (
          <div
            key={p.id}
            className="absolute top-0 left-0 will-change-transform"
            style={{ transform }}
          >
            {/* 
               Inner Card: Handles visuals & layout.
               We keep transitions here for opacity/scale/hover effects, 
               but NOT position.
            */}
            <div className={`
               flex flex-col items-start p-2 rounded-lg border shadow-xl backdrop-blur-md transition-all duration-300 ease-out origin-bottom
               ${isSelected 
                 ? 'bg-surface/90 border-primary/50 shadow-primary/20 scale-105 z-30 min-w-[180px] max-w-[220px]' 
                 : 'bg-surface/60 border-white/10 scale-90 opacity-90 z-10 min-w-[140px] max-w-[180px]'
               }
            `}>
               {/* Image (Selected Only) */}
               {isSelected && p.cluster.imageUrl && (
                 <div className="w-full h-20 mb-2 rounded overflow-hidden relative bg-black/20">
                    <img 
                      src={p.cluster.imageUrl} 
                      alt="" 
                      className="w-full h-full object-cover opacity-90" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface/80 to-transparent" />
                 </div>
               )}

               {/* Tag & Location */}
               <div className="flex items-center gap-1.5 mb-1 w-full">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border
                    ${isSelected 
                      ? 'bg-primary/20 text-primary-200 border-primary/20' 
                      : 'bg-white/10 text-slate-400 border-transparent'
                    }
                  `}>
                    {p.cluster.tag}
                  </span>
                  {p.cluster.displayLocation && (
                    <span className="text-[9px] text-slate-400 truncate flex-1 text-right">
                      {p.cluster.displayLocation}
                    </span>
                  )}
               </div>
               
               {/* Headline */}
               <div className={`text-xs font-medium leading-tight line-clamp-2
                 ${isSelected ? 'text-white' : 'text-slate-200'}
               `}>
                 {p.cluster.headline}
               </div>

               {/* Hint (Selected Only) */}
               {isSelected && (
                 <div className="mt-2 text-[9px] text-primary/80 font-mono flex items-center gap-1">
                   Tap for Intel &rarr;
                 </div>
               )}
            </div>
            
            {/* Optional Stem/Line */}
            <div className={`
              absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-px 
              bg-gradient-to-b from-white/20 to-transparent transition-all duration-300
              ${isSelected ? 'h-6 opacity-80' : 'h-3 opacity-30'}
            `} />
          </div>
        );
      })}
    </div>
  );
};
