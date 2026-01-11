import React, { useEffect, useRef, useState } from 'react';

// Use a specific version for the CSS to match the expected library version
const CSS_URL = "https://api.mapbox.com/mapbox-gl-js/v3.9.4/mapbox-gl.css";
const TOKEN = "pk.eyJ1IjoicmFkamV0IiwiYSI6ImNsZmRyZm10NjBtNzEzdG82MjIxZTc0Z3AifQ.vgXGJlkIxIc6tgu6G-HRag";
const STYLE = "mapbox://styles/radjet/cmk9dscpw00o801s92wl50o7n";

export const MapboxGlobeView: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'active' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    const loadMapbox = async () => {
      try {
        console.log("MapboxGlobeView: Starting dynamic load sequence...");
        
        // 1. Inject CSS dynamically if not present
        if (!document.querySelector(`link[href="${CSS_URL}"]`)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = CSS_URL;
            document.head.appendChild(link);
        }

        // 2. Dynamic import of the heavy library
        // This prevents the import from blocking the main app bundle
        const mod = await import('mapbox-gl');
        // Handle both default export and named export patterns
        const mapboxgl = mod.default || mod;

        if (!mounted) return;

        console.log("MapboxGlobeView: Library loaded. Initializing map...");

        // 3. Initialize Map
        (mapboxgl as any).accessToken = TOKEN;

        if (!mapContainer.current) {
            throw new Error("Map container element not found");
        }

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

        // 4. Attach Listeners
        map.on('error', (e: any) => {
          console.error("Mapbox Internal Error:", e);
          if (mounted) {
             setStatus('error');
             setErrorMessage(`Internal Map Error: ${e.error?.message || 'Unknown'}`);
          }
        });

        map.on('load', () => {
          console.log("MapboxGlobeView: Map fully loaded.");
          map.setFog({
              color: 'rgb(10, 10, 18)', 
              'high-color': 'rgb(20, 20, 40)', 
              'horizon-blend': 0.05, 
              'space-color': 'rgb(2, 6, 23)',
              'star-intensity': 0.5 
          });
          if (mounted) setStatus('active');
        });

        mapInstance.current = map;

      } catch (err: any) {
        console.error("MAPBOX_MODE_FAILED:", err);
        if (mounted) {
          setStatus('error');
          setErrorMessage(err.message || String(err));
        }
      }
    };

    loadMapbox();

    return () => {
      mounted = false;
      if (mapInstance.current) {
        console.log("MapboxGlobeView: disposing map instance.");
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Error State UI
  if (status === 'error') {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950 p-8">
        <div className="max-w-xl w-full border border-red-500/30 bg-slate-900/90 p-6 rounded-xl shadow-2xl backdrop-blur-xl">
          <h3 className="text-xl font-bold mb-4 text-red-400 flex items-center gap-2">
            <span>⚠️</span> Mapbox Failed to Load
          </h3>
          <div className="font-mono text-xs text-red-200 whitespace-pre-wrap bg-black/50 p-4 rounded border border-red-900/50 overflow-auto max-h-[60vh]">
            {errorMessage}
          </div>
          <p className="mt-4 text-sm text-slate-400">
            Please check your internet connection or console logs for details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full bg-background overflow-hidden">
        {/* Loading Indicator */}
        {status === 'loading' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-10 space-y-4">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <div className="text-primary font-mono text-xs animate-pulse">INITIALIZING MAP ENGINE...</div>
            </div>
        )}
        
        {/* Map Container */}
        <div 
            ref={mapContainer} 
            className="absolute inset-0 w-full h-full transition-opacity duration-700"
            style={{ opacity: status === 'active' ? 1 : 0 }} 
        />
    </div>
  );
};