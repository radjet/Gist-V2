import { Hotspot } from './gist';

export * from './gist';

// Alias Cluster to Hotspot for backward compatibility during refactor
export type Cluster = Hotspot;

export interface UserLocation {
  lat: number;
  lng: number;
}

export interface UIState {
  isClusterDrawerOpen: boolean;
  isPreviewOpen: boolean;
  selectedClusterId: string | null;
  selectedClusterLngLat: [number, number] | null;
  isHeatmapEnabled: boolean;
  viewportFeedIds: string[]; // Ordered list of story IDs currently in view
  
  // Navigation & Scan State
  isScanEnabled: boolean; // "Hotspot Nav Mode"
  scanIndex: number;
  scannableClusterIds: string[]; // Ordered by priority
  
  // Deterministic Navigation Signal
  navRequestId: number;
  navTargetClusterId: string | null;

  // Smart Ranking & Stack State
  userLocation: UserLocation | null;
  isHotspotStackOpen: boolean;

  // Performance Gating
  isMapMoving: boolean;

  openDrawer: () => void;
  closeDrawer: () => void;
  openPreview: () => void;
  closePreview: () => void;
  selectCluster: (id: string | null, latLng?: [number, number] | null) => void;
  toggleDrawer: () => void;
  toggleHeatmap: () => void;
  setViewportFeedIds: (ids: string[]) => void;
  setMapMoving: (isMoving: boolean) => void;
  
  // Navigation Actions
  toggleScan: () => void;
  nextHotspot: () => void;
  prevHotspot: () => void;
  exitScanMode: () => void;
  
  // Stack & Ranking Actions
  toggleHotspotStack: () => void;
  requestUserLocation: () => Promise<void>;
  jumpToHotspot: (id: string) => void;
  refreshHotspots: () => void;
}