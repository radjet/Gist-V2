import React, { useEffect, useRef } from 'react';
import { createGlobeScene } from './createGlobeScene';

const GlobeCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize the Three.js scene
    const { cleanup } = createGlobeScene(containerRef.current);

    // Clean up on unmount
    return () => {
      cleanup();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full z-0 cursor-grab active:cursor-grabbing"
      aria-label="Interactive 3D Globe"
    />
  );
};

export default GlobeCanvas;