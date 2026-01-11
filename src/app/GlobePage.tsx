import React, { useState } from 'react';
import GlobeCanvas from '../globe/GlobeCanvas';
import { MapboxGlobeView } from '../mapbox/MapboxGlobeView';
import { HUDShell } from '../components/hud/HUDShell';

const GlobePage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'three' | 'mapbox'>('three');

  return (
    <div className="relative w-full h-full bg-background overflow-hidden">
      {/* 3D Globe Background */}
      {viewMode === 'three' ? (
        <GlobeCanvas />
      ) : (
        <MapboxGlobeView />
      )}

      {/* Heads-Up Display Overlay */}
      <HUDShell />

      {/* Temporary Spike Toggle */}
      <div className="absolute top-24 left-4 z-50 pointer-events-auto">
        <button 
          onClick={() => setViewMode(prev => prev === 'three' ? 'mapbox' : 'three')}
          className="px-3 py-1.5 bg-surface/60 hover:bg-surface/90 border border-white/20 text-white text-xs font-mono rounded backdrop-blur-md transition-colors uppercase"
        >
          Mode: {viewMode === 'three' ? 'Three.js' : 'Mapbox GL'}
        </button>
      </div>
    </div>
  );
};

export default GlobePage;