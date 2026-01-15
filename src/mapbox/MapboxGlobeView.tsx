import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { mockClusters, mockArticlePoints } from '../mock/mockClusters';
import { useUIStore } from '../state/uiStore';
import { PinContextLayer } from './PinContextLayer';

const STYLE = "mapbox://styles/radjet/cmk9dscpw00o801s92wl50o7n";

// --- TUNING KNOBS (Atmosphere) ---
const ATMOSPHERE_HIGH_COLOR = "rgba(56, 189, 248, 0.3)";
const ATMOSPHERE_HORIZON_BLEND = 0.02;
const ATMOSPHERE_RANGE: [number, number] = [0.1, 9];
const ATMOSPHERE_STAR_INTENSITY = 0.0;

// --- TUNING KNOBS (Camera) ---
const NAV_ZOOM_LEVEL = 4.0;
const NAV_PITCH = 45;
const CAMERA_DURATION_MS = 800; // Smooth transition
const DRAWER_WIDTH_PX = 420;

const SCAN_HIGHLIGHT_RADIUS = 25;

// --- ZOOM RESOLVE KNOBS ---
const RESOLVE_ZOOM_THRESHOLD = 5.2; 
const ARTICLE_DOT_RADIUS = 4;
const ARTICLE_DOT_OPACITY = 0.85;

// --- PULSE KNOBS ---
const PULSE_DURATION_MS = 1800;
const PULSE_RADIUS_DELTA = 60; 
const PULSE_OPACITY_MAX = 0.9;

// --- VIGNETTE KNOBS ---
const VIGNETTE_MID_ALPHA = 0.22;
const VIGNETTE_EDGE_ALPHA = 0.85;
const VIGNETTE_INNER_RADIUS = 220;
const VIGNETTE_OUTER_RADIUS = 720;

// --- COLORS ---
const COLOR_DEFAULT_BLUE = '#3b82f6';
const COLOR_SELECTED_PINE = '#10b981';
const COLOR_STROKE_PINE = '#34d399';
const COLOR_STROKE_DEFAULT = 'rgba(255,255,255,0.3)';
const COLOR_ARTICLE_DOT = '#e2e8f0'; 

const applyAtmosphere = (map: mapboxgl.Map) => {
  if (!map) return;
  try {
    if (typeof map.setFog === 'function') {
      map.setFog({
        "range": ATMOSPHERE_RANGE,
        "color": "rgba(2, 6, 23, 0.0)",
        "high-color": ATMOSPHERE_HIGH_COLOR,
        "space-color": "rgba(0, 0, 0, 0.0)",
        "horizon-blend": ATMOSPHERE_HORIZON_BLEND,
        "star-intensity": ATMOSPHERE_STAR_INTENSITY
      });
    }
  } catch (e) {
    console.warn("Gist: Failed to apply atmosphere settings.", e);
  }
};

export const MapboxGlobeView: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const vignetteRef = useRef<HTMLDivElement>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurGateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationFrameRef = useRef<number>(0);
  
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  
  // Dev Debug State
  const [debugLastEvent, setDebugLastEvent] = useState<string>('-');

  // Local state for hover effects only (low frequency)
  const [hoveredClusterId, setHoveredClusterId] = useState<string | null>(null);
  
  const { 
    selectCluster, 
    openDrawer, 
    closePreview,
    isHeatmapEnabled, 
    selectedClusterId, 
    selectedClusterLngLat,
    isClusterDrawerOpen,
    isPreviewOpen,
    setViewportFeedIds,
    isScanEnabled,
    navRequestId,
    navTargetClusterId,
    setMapMoving,
    isMapMoving
  } = useUIStore(); 

  const token = (import.meta as any).env.VITE_MAPBOX_TOKEN;

  // --- Dynamic Spotlight Tracker (Optimized: No React State Sync) ---
  useLayoutEffect(() => {
    const map = mapInstance.current;
    if (!map || !mapReady) return;

    // Direct DOM manipulation to avoid re-rendering component on every frame
    const updateVignette = () => {
       if (!vignetteRef.current) return;
       
       if (selectedClusterLngLat && isClusterDrawerOpen) {
          const pos = map.project(selectedClusterLngLat);
          
          // Apply dynamic gradient centered on pin
          vignetteRef.current.style.background = `radial-gradient(circle at ${pos.x}px ${pos.y}px, rgba(0,0,0,0) 0px, rgba(0,0,0,${VIGNETTE_MID_ALPHA}) ${VIGNETTE_INNER_RADIUS}px, rgba(0,0,0,${VIGNETTE_EDGE_ALPHA}) ${VIGNETTE_OUTER_RADIUS}px)`;
       } else {
          // Fallback centered gradient
          vignetteRef.current.style.background = `radial-gradient(circle at center, rgba(0,0,0,0) 0%, rgba(0,0,0,${VIGNETTE_MID_ALPHA}) 40%, rgba(0,0,0,${VIGNETTE_EDGE_ALPHA}) 100%)`;
       }
    };

    const onMove = () => {
       requestAnimationFrame(updateVignette);
    };

    map.on('move', onMove);
    map.on('moveend', updateVignette);
    
    // Initial call
    updateVignette();

    return () => {
      map.off('move', onMove);
      map.off('moveend', updateVignette);
    };
  }, [selectedClusterLngLat, isClusterDrawerOpen, mapReady]);

  // --- DETERMINISTIC CAMERA NAVIGATION ---
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !mapReady) return;
    if (!navTargetClusterId) return;

    const cluster = mockClusters.find(c => c.id === navTargetClusterId);
    if (!cluster) return;

    const targetLngLat: [number, number] = [cluster.lng, cluster.lat];

    if (map.isMoving()) {
       map.stop();
    }

    const padding = { 
        top: 0, 
        bottom: 0, 
        left: 0, 
        right: isClusterDrawerOpen ? DRAWER_WIDTH_PX : 0 
    };

    map.easeTo({
        center: targetLngLat,
        zoom: Math.max(map.getZoom(), NAV_ZOOM_LEVEL),
        pitch: NAV_PITCH,
        padding: padding,
        duration: CAMERA_DURATION_MS,
        essential: true
    });

    triggerScanPulse(map);

    if (!isClusterDrawerOpen) {
       openDrawer();
    }

  }, [navRequestId, mapReady]); 

  const triggerScanPulse = (map: mapboxgl.Map) => {
    const startTime = performance.now();
    const animate = (time: number) => {
      if (!map || !map.isStyleLoaded() || !map.getLayer('clusters-scan-pulse')) return;
      const elapsed = time - startTime;
      if (elapsed > PULSE_DURATION_MS) {
        map.setPaintProperty('clusters-scan-pulse', 'circle-radius', SCAN_HIGHLIGHT_RADIUS);
        map.setPaintProperty('clusters-scan-pulse', 'circle-stroke-opacity', 0);
        return;
      }
      const progress = elapsed / PULSE_DURATION_MS;
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const radius = SCAN_HIGHLIGHT_RADIUS + (PULSE_RADIUS_DELTA * easeOut);
      const opacity = PULSE_OPACITY_MAX * (1 - progress);
      map.setPaintProperty('clusters-scan-pulse', 'circle-radius', radius);
      map.setPaintProperty('clusters-scan-pulse', 'circle-stroke-opacity', opacity);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // --- Highlight Scan Active Layer ---
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !mapReady || !map.isStyleLoaded()) return;

    const activeId = selectedClusterId || '';

    if (map.getLayer('clusters-scan-active')) {
      map.setFilter('clusters-scan-active', ['==', ['get', 'id'], activeId]);
      map.setLayoutProperty('clusters-scan-active', 'visibility', isScanEnabled ? 'visible' : 'none');
    }

    if (map.getLayer('clusters-scan-pulse')) {
       map.setFilter('clusters-scan-pulse', ['==', ['get', 'id'], activeId]);
       map.setLayoutProperty('clusters-scan-pulse', 'visibility', isScanEnabled ? 'visible' : 'none');
       map.setPaintProperty('clusters-scan-pulse', 'circle-radius', SCAN_HIGHLIGHT_RADIUS);
       map.setPaintProperty('clusters-scan-pulse', 'circle-stroke-opacity', 0);
    }
  }, [selectedClusterId, isScanEnabled, mapReady]);


  // --- Selection Layer Effect & Dimming Logic ---
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !mapReady || !map.isStyleLoaded()) return;

    const selectedId = selectedClusterId || '';

    // -- CLUSTERS --
    if (map.getLayer('clusters-circles')) {
      map.setPaintProperty('clusters-circles', 'circle-stroke-width', [
        'case',
        ['==', ['get', 'id'], selectedId], 3.5, 1 
      ] as any);
      
      map.setPaintProperty('clusters-circles', 'circle-stroke-color', [
        'case',
        ['==', ['get', 'id'], selectedId], COLOR_STROKE_PINE, COLOR_STROKE_DEFAULT
      ] as any);
      
      map.setPaintProperty('clusters-circles', 'circle-color', [
        'case',
        ['==', ['get', 'id'], selectedId], COLOR_SELECTED_PINE, COLOR_DEFAULT_BLUE
      ] as any);

      // FADE OUT clusters when zoomed in deep
      map.setPaintProperty('clusters-circles', 'circle-opacity', [
         'interpolate', ['linear'], ['zoom'],
         RESOLVE_ZOOM_THRESHOLD, 0.8,
         RESOLVE_ZOOM_THRESHOLD + 2, 0.2
      ] as any);
      
      map.setPaintProperty('clusters-circles', 'circle-stroke-opacity', [
        'interpolate', ['linear'], ['zoom'],
        RESOLVE_ZOOM_THRESHOLD, 0.5,
        RESOLVE_ZOOM_THRESHOLD + 2, 0.1
      ] as any);
    }
    
    // -- ARTICLES DOTS --
    if (map.getLayer('articles-layer')) {
       map.setPaintProperty('articles-layer', 'circle-opacity', [
          'interpolate', ['linear'], ['zoom'],
          RESOLVE_ZOOM_THRESHOLD - 0.5, 0,
          RESOLVE_ZOOM_THRESHOLD + 0.5, ARTICLE_DOT_OPACITY
       ] as any);

       map.setPaintProperty('articles-layer', 'circle-stroke-opacity', [
          'interpolate', ['linear'], ['zoom'],
          RESOLVE_ZOOM_THRESHOLD - 0.5, 0,
          RESOLVE_ZOOM_THRESHOLD + 0.5, 0.4
       ] as any);
    }

  }, [selectedClusterId, isClusterDrawerOpen, mapReady]);

  // --- Sync Heatmap ---
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !mapReady || !map.isStyleLoaded()) return;

    if (map.getLayer('clusters-heat')) {
      map.setLayoutProperty('clusters-heat', 'visibility', isHeatmapEnabled ? 'visible' : 'none');
    }
  }, [isHeatmapEnabled, mapReady]);

  // --- Map Initialization ---
  useEffect(() => {
    if (!token) {
      setError("Missing VITE_MAPBOX_TOKEN");
      return;
    }

    if (!mapContainer.current) return;
    if (mapInstance.current) return;

    try {
      mapboxgl.accessToken = token;

      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: STYLE,
        projection: { name: 'globe' } as any,
        zoom: 1.5,
        center: [0, 20],
        pitch: 0,
        attributionControl: false,
        failIfMajorPerformanceCaveat: true
      });

      mapInstance.current = map;

      const handleUserInteraction = (e: any) => {
         // No-op for now as autoplay is removed
      };

      // --- BLUR GATING LOGIC ---
      map.on('movestart', () => {
        if (blurGateTimer.current) clearTimeout(blurGateTimer.current);
        setMapMoving(true);
        if ((import.meta as any).env.DEV) setDebugLastEvent('movestart');
      });

      map.on('idle', () => {
        // Debounce the restoration of blur to ensure we are settled
        if (blurGateTimer.current) clearTimeout(blurGateTimer.current);
        blurGateTimer.current = setTimeout(() => {
          setMapMoving(false);
          if ((import.meta as any).env.DEV) setDebugLastEvent('idle (settled)');
        }, 150);
      });

      // --- VIEWPORT FEED UPDATE (Debounced) ---
      const handleMoveEnd = () => {
        const m = mapInstance.current;
        if (!m || !m.getStyle()) return;

        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        debounceTimer.current = setTimeout(() => {
            if (!m || !m.getStyle()) return;

            const bounds = m.getBounds();
            if (!bounds) return;

            const visibleClusters = mockClusters.filter(c => 
                bounds.contains([c.lng, c.lat])
            );
            visibleClusters.sort((a, b) => b.intensity - a.intensity);
            setViewportFeedIds(visibleClusters.map(c => c.id));
        }, 400); 
      };

      map.on('mousedown', handleUserInteraction);
      map.on('wheel', handleUserInteraction);
      map.on('dragstart', handleUserInteraction);
      
      map.on('load', () => {
          if (!map || !map.getStyle()) return;

          applyAtmosphere(map);

          // -- Source: Clusters --
          const clusterGeojson: any = {
            type: 'FeatureCollection',
            features: mockClusters.map(c => ({
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [c.lng, c.lat] },
              properties: { id: c.id, intensity: c.intensity }
            }))
          };

          if (!map.getSource('clusters')) {
            map.addSource('clusters', { type: 'geojson', data: clusterGeojson });
          }

          // -- Source: Articles (Zoom Resolve) --
          const articlesGeojson: any = {
             type: 'FeatureCollection',
             features: mockArticlePoints.map(a => ({
               type: 'Feature',
               geometry: { type: 'Point', coordinates: [a.lng, a.lat] },
               properties: { id: a.id, clusterId: a.clusterId, title: a.title }
             }))
          };

          if (!map.getSource('articles')) {
             map.addSource('articles', { type: 'geojson', data: articlesGeojson });
          }

          // -- Layers --
          if (!map.getLayer('clusters-heat')) {
              map.addLayer({
                id: 'clusters-heat',
                type: 'heatmap',
                source: 'clusters',
                maxzoom: 9,
                layout: { visibility: 'none' },
                paint: {
                  'heatmap-weight': ['interpolate', ['linear'], ['get', 'intensity'], 0, 0, 1, 1],
                  'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
                  'heatmap-color': [
                    'interpolate', ['linear'], ['heatmap-density'],
                    0, 'rgba(33,102,172,0)', 0.2, 'rgb(103,169,207)', 0.4, 'rgb(209,229,240)',
                    0.6, 'rgb(253,219,199)', 0.8, 'rgb(239,138,98)', 1, 'rgb(178,24,43)'
                  ],
                  'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 9, 20],
                  'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 1, 9, 0]
                }
              });
          }

          if (!map.getLayer('clusters-scan-active')) {
             map.addLayer({
               id: 'clusters-scan-active',
               type: 'circle',
               source: 'clusters',
               minzoom: 0,
               layout: { visibility: 'none' },
               paint: {
                 'circle-radius': SCAN_HIGHLIGHT_RADIUS,
                 'circle-color': 'rgba(0,0,0,0)',
                 'circle-stroke-width': 2,
                 'circle-stroke-color': '#38bdf8',
                 'circle-stroke-opacity': 0.8,
                 'circle-pitch-alignment': 'map'
               }
             });
          }

          if (!map.getLayer('clusters-scan-pulse')) {
             map.addLayer({
               id: 'clusters-scan-pulse',
               type: 'circle',
               source: 'clusters',
               minzoom: 0,
               layout: { visibility: 'none' },
               paint: {
                 'circle-radius': SCAN_HIGHLIGHT_RADIUS, 
                 'circle-color': 'rgba(0,0,0,0)',
                 'circle-stroke-width': 3,
                 'circle-stroke-color': '#38bdf8',
                 'circle-stroke-opacity': 0, 
                 'circle-pitch-alignment': 'map'
               }
             });
          }

          // CLUSTERS LAYER
          if (!map.getLayer('clusters-circles')) {
              map.addLayer({
                id: 'clusters-circles',
                type: 'circle',
                source: 'clusters',
                minzoom: 0,
                paint: {
                  'circle-radius': ['interpolate', ['linear'], ['get', 'intensity'], 0.2, 4, 1, 12],
                  'circle-color': '#3b82f6',
                  'circle-stroke-color': 'rgba(255,255,255,0.3)',
                  'circle-stroke-width': 1,
                  'circle-opacity': 0.8 
                }
              });
          }

          // ARTICLES LAYER (Zoom Resolve)
          if (!map.getLayer('articles-layer')) {
             map.addLayer({
               id: 'articles-layer',
               type: 'circle',
               source: 'articles',
               minzoom: 2, 
               paint: {
                 'circle-radius': ARTICLE_DOT_RADIUS,
                 'circle-color': COLOR_ARTICLE_DOT,
                 'circle-stroke-width': 1,
                 'circle-stroke-color': 'rgba(0,0,0,0.5)',
                 'circle-opacity': 0
               }
             });
          }

          // Interactions
          map.on('mouseenter', 'clusters-circles', (e) => {
             map.getCanvas().style.cursor = 'pointer';
             if (e.features && e.features[0]) {
               const id = e.features[0].properties?.id;
               setHoveredClusterId(id);
             }
          });
          map.on('mouseleave', 'clusters-circles', () => {
             map.getCanvas().style.cursor = '';
             setHoveredClusterId(null);
          });
          
          map.on('mouseenter', 'articles-layer', () => map.getCanvas().style.cursor = 'pointer');
          map.on('mouseleave', 'articles-layer', () => map.getCanvas().style.cursor = '');

          map.on('click', 'clusters-circles', (e) => {
             e.preventDefault(); 
             if (!e.features || e.features.length === 0) return;
             const feature = e.features[0];
             const clusterId = feature.properties?.id;
             let coords: [number, number] | undefined;
             if (feature.geometry.type === 'Point') {
                 coords = feature.geometry.coordinates as [number, number];
             }
             if (clusterId && coords) selectCluster(clusterId, coords); 
          });

          // Click on article dot -> Selects parent cluster
          map.on('click', 'articles-layer', (e) => {
             e.preventDefault();
             if (!e.features || e.features.length === 0) return;
             const feature = e.features[0];
             const clusterId = feature.properties?.clusterId;
             
             if (clusterId) {
                const cluster = mockClusters.find(c => c.id === clusterId);
                if (cluster) {
                   selectCluster(clusterId, [cluster.lng, cluster.lat]);
                }
             }
          });

          map.on('click', (e) => {
              if (e.defaultPrevented) return;
              if (useUIStore.getState().isPreviewOpen) closePreview();
          });
          
          map.on('moveend', handleMoveEnd);
          handleMoveEnd(); 

          setMapReady(true);
      });

      map.on('style.load', () => applyAtmosphere(map));
      map.on('error', (e) => console.warn("Mapbox warning/error:", e));

    } catch (err: any) {
      console.error("Mapbox init failed:", err);
      setError(err.message || "Mapbox failed to initialize");
    }

    return () => {
      setMapReady(false); 
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (blurGateTimer.current) clearTimeout(blurGateTimer.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [token]); 

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/90 text-red-400 font-mono text-sm z-50">
        [ERROR: {error}]
      </div>
    );
  }

  return (
    <>
        {/* DEV OVERLAY */}
        {(import.meta as any).env.DEV && (
          <div className="absolute top-24 left-4 z-50 pointer-events-none bg-black/70 p-2 rounded text-[10px] font-mono text-green-400 border border-green-900">
            <div>MAP MOVING: {isMapMoving ? 'YES' : 'NO'}</div>
            <div>LAST EVT: {debugLastEvent}</div>
          </div>
        )}

        {/* Pin-Centered Spotlight Vignette (Managed via Ref, no State) */}
        <div 
          ref={vignetteRef}
          className="absolute inset-0 pointer-events-none z-10 transition-all duration-300 ease-out"
          style={{
            background: `radial-gradient(circle at center, rgba(0,0,0,0) 0%, rgba(0,0,0,${VIGNETTE_MID_ALPHA}) 40%, rgba(0,0,0,${VIGNETTE_EDGE_ALPHA}) 100%)`
          }}
        />

        <div 
          ref={mapContainer} 
          className="absolute inset-0 w-full h-full bg-background"
        />

        {/* --- Intelligent Pin Context Labels --- */}
        <PinContextLayer 
           map={mapInstance.current} 
           clusters={mockClusters} 
           selectedId={selectedClusterId}
           hoveredId={hoveredClusterId}
        />
    </>
  );
};