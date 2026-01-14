import React, { useState, useEffect } from 'react';
import GlobeCanvas from '../globe/GlobeCanvas';
import { MapboxGlobeView } from '../mapbox/MapboxGlobeView';
import { HUDShell } from '../components/hud/HUDShell';
import { useUIStore } from '../state/uiStore';

const GlobePage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'three' | 'mapbox'>('mapbox');
  const [showDevToggle, setShowDevToggle] = useState(false);
  
  const { 
    isScanEnabled, 
    nextHotspot, 
    prevHotspot, 
    exitScanMode
  } = useUIStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('dev') === '1') {
      setShowDevToggle(true);
    }
  }, []);

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable
      ) {
        return;
      }

      // Ignore if modifier keys are pressed
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      if (isScanEnabled) {
        switch (e.key) {
          case 'ArrowRight':
          case 'k':
          case 'K':
            e.preventDefault();
            nextHotspot();
            break;
          case 'ArrowLeft':
          case 'j':
          case 'J':
            e.preventDefault();
            prevHotspot();
            break;
          case 'Escape':
            e.preventDefault();
            exitScanMode();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isScanEnabled, nextHotspot, prevHotspot, exitScanMode]);

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

      {/* Dev Toggle (Hidden by default) */}
      {showDevToggle && (
        <div className="absolute top-24 left-4 z-50 pointer-events-auto">
          <button 
            onClick={() => setViewMode(prev => prev === 'three' ? 'mapbox' : 'three')}
            className="px-3 py-1.5 bg-surface/60 hover:bg-surface/90 border border-white/20 text-white text-xs font-mono rounded backdrop-blur-md transition-colors uppercase"
          >
            Mode: {viewMode === 'three' ? 'Three.js' : 'Mapbox GL'}
          </button>
        </div>
      )}
    </div>
  );
};

export default GlobePage;
