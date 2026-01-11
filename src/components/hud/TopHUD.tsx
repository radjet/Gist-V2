import React from 'react';
import { Globe, Search, User, Layers } from 'lucide-react';
import { useUIStore } from '../../state/uiStore';
import { Button } from '../Button';

export const TopHUD: React.FC = () => {
  const { toggleDrawer, isClusterDrawerOpen } = useUIStore();

  return (
    <div className="flex items-center justify-between w-full pointer-events-auto">
      {/* Brand */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2 text-white">
          <Globe className="text-primary w-6 h-6" />
          <span className="text-xl font-bold tracking-tight">Gist</span>
        </div>
        <span className="text-[10px] text-muted tracking-[0.2em] font-mono uppercase pl-8">
          Global Intelligence
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Search Bar */}
        <div className="relative group hidden sm:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search News, People, Regions…"
            className="block w-64 pl-10 pr-3 py-2 border border-white/10 rounded-full leading-5 bg-surface/50 text-slate-200 placeholder-slate-400 focus:outline-none focus:bg-surface/80 focus:ring-1 focus:ring-primary/50 focus:border-primary/50 sm:text-sm backdrop-blur-md transition-all shadow-lg"
          />
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-white/10 mx-1" />

        {/* Cluster Toggle */}
        <Button 
          variant="icon" 
          onClick={toggleDrawer}
          className={`relative backdrop-blur-md transition-all border border-white/5 ${
            isClusterDrawerOpen ? 'bg-primary text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-surface/50 text-slate-300 hover:bg-surface/80'
          }`}
          aria-label="Toggle Story Clusters"
          aria-pressed={isClusterDrawerOpen}
        >
          <Layers size={20} />
          {/* Notification Dot Placeholder */}
          <span className="absolute top-1 right-1.5 w-2 h-2 bg-blue-400 rounded-full border border-surface shadow-sm" />
        </Button>

        {/* Avatar */}
        <button 
          className="h-10 w-10 rounded-full bg-surface/50 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-surface/80 hover:border-white/20 transition-all backdrop-blur-md shadow-lg"
          aria-label="User Profile"
        >
          <User size={20} />
        </button>
      </div>
    </div>
  );
};