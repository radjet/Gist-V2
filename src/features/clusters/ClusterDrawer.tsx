import React, { useEffect, useRef } from 'react';
import { X, MapPin, Clock, AlertCircle } from 'lucide-react';
import { useUIStore } from '../../state/uiStore';
import { mockClusters } from './mockData';
import { Cluster } from '../../types';

const ClusterDrawer: React.FC = () => {
  const { isClusterDrawerOpen, closeDrawer, selectedClusterId, selectCluster } = useUIStore();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isClusterDrawerOpen) {
        closeDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isClusterDrawerOpen, closeDrawer]);

  // Focus management
  useEffect(() => {
    if (isClusterDrawerOpen && drawerRef.current) {
      drawerRef.current.focus();
    }
  }, [isClusterDrawerOpen]);

  // Format helper
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMins / 60);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 z-40 ${
          isClusterDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside
        ref={drawerRef}
        tabIndex={-1}
        role="dialog"
        aria-labelledby="drawer-title"
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-surface border-l border-border shadow-2xl z-50 transform transition-transform duration-300 ease-in-out outline-none flex flex-col ${
          isClusterDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface/50 backdrop-blur-md sticky top-0 z-10">
          <h2 id="drawer-title" className="text-lg font-semibold text-white flex items-center gap-2">
            Story Clusters
            <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
              {mockClusters.length}
            </span>
          </h2>
          <button 
            onClick={closeDrawer}
            className="p-2 text-muted hover:text-white rounded-full hover:bg-white/10 transition-colors"
            aria-label="Close drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {mockClusters.map((cluster) => (
            <div 
              key={cluster.id}
              onClick={() => selectCluster(cluster.id)}
              className={`group p-4 rounded-xl border transition-all cursor-pointer hover:border-primary/50 relative overflow-hidden ${
                selectedClusterId === cluster.id 
                  ? 'bg-primary/10 border-primary/60' 
                  : 'bg-background/50 border-border hover:bg-background'
              }`}
            >
              {/* Highlight bar for active state */}
              {selectedClusterId === cluster.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
              )}

              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2 text-xs text-muted">
                   <span className="flex items-center gap-1">
                     <MapPin size={12} /> {cluster.locationLabel}
                   </span>
                   <span>•</span>
                   <span className="flex items-center gap-1">
                     <Clock size={12} /> {formatTime(cluster.updatedAt)}
                   </span>
                </div>
                {cluster.breakingScore > 80 && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">
                    <AlertCircle size={10} /> BREAKING
                  </span>
                )}
              </div>
              
              <h3 className={`font-medium text-sm mb-1 line-clamp-2 ${
                selectedClusterId === cluster.id ? 'text-white' : 'text-slate-200 group-hover:text-white'
              }`}>
                {cluster.title}
              </h3>
              
              <p className="text-xs text-muted line-clamp-3 leading-relaxed">
                {cluster.summary}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface text-xs text-center text-muted">
          Updated continuously from global sources.
        </div>
      </aside>
    </>
  );
};

export default ClusterDrawer;