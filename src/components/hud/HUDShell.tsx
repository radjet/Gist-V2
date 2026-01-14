import React from 'react';
import { TopHUD } from './TopHUD';
import { BottomLeftHUD } from './BottomLeftHUD';
import { BottomRightHUD } from './BottomRightHUD';
import { HotspotStack } from './HotspotStack';

export const HUDShell: React.FC = () => {
  return (
    <div className="absolute inset-0 z-10 pointer-events-none p-4 sm:p-6 flex flex-col justify-between overflow-hidden">
      {/* Top Section */}
      <header className="w-full">
        <TopHUD />
      </header>
      
      {/* Floating Panels */}
      <HotspotStack />

      {/* Bottom Section */}
      <div className="w-full flex items-end justify-between">
        <div className="flex-1">
          <BottomLeftHUD />
        </div>
        <div>
          <BottomRightHUD />
        </div>
      </div>
    </div>
  );
};
