import { create } from 'zustand';
import { UIState } from '../types';
import { mockClusters } from '../mock/mockClusters';
import { haversineKm, clamp } from '../lib/geo';

// --- TUNING KNOBS ---
const RANKING_DISTANCE_PENALTY_STRENGTH = 0.6; // 0..1 (How much distance affects score)
const RANKING_BREAKING_BOOST = 0.2; // Add 0.2 to score if intensity > 0.9
const MAX_DISTANCE_PENALTY_KM = 12000; // Distance at which penalty is maxed out

// Helper to calculate score
const calculateScore = (cluster: typeof mockClusters[0], userLoc: { lat: number; lng: number } | null) => {
  const base = cluster.intensity || 0.5;
  
  // Breaking Boost
  const isBreaking = base > 0.9;
  const breakingBoost = isBreaking ? RANKING_BREAKING_BOOST : 0;

  // Distance Penalty
  let distancePenalty = 0;
  if (userLoc) {
    const dist = haversineKm(userLoc.lat, userLoc.lng, cluster.lat, cluster.lng);
    // Normalize distance 0..1
    const normalizedDist = clamp(dist / MAX_DISTANCE_PENALTY_KM, 0, 1);
    distancePenalty = base * RANKING_DISTANCE_PENALTY_STRENGTH * normalizedDist;
  }

  // Final Score: Higher is better
  return base + breakingBoost - distancePenalty;
};

const getRankedIds = (userLoc: { lat: number; lng: number } | null) => {
  return mockClusters
    .slice()
    .sort((a, b) => {
      const scoreA = calculateScore(a, userLoc);
      const scoreB = calculateScore(b, userLoc);
      return scoreB - scoreA;
    })
    .map(c => c.id);
};

export const useUIStore = create<UIState>((set, get) => ({
  isClusterDrawerOpen: false,
  isPreviewOpen: false,
  selectedClusterId: null,
  selectedClusterLngLat: null,
  isHeatmapEnabled: false,
  viewportFeedIds: [],

  // Navigation Defaults
  isScanEnabled: false,
  scanIndex: 0,
  scannableClusterIds: getRankedIds(null), 
  
  // Navigation Bus
  navRequestId: 0,
  navTargetClusterId: null,

  // Ranking & Stack Defaults
  userLocation: null,
  isHotspotStackOpen: false,

  openDrawer: () => set({ isClusterDrawerOpen: true, isPreviewOpen: false }),
  closeDrawer: () => set({ isClusterDrawerOpen: false }),
  
  openPreview: () => set({ isPreviewOpen: true }),
  closePreview: () => set({ isPreviewOpen: false }),
  
  selectCluster: (id, latLng) => set((state) => {
    // If selecting a cluster, we implicitly enter "Scan Mode" (show bottom nav)
    // and trigger a navigation request.
    const newIndex = id ? state.scannableClusterIds.indexOf(id) : -1;
    
    return { 
      selectedClusterId: id,
      selectedClusterLngLat: latLng || (id === null ? null : state.selectedClusterLngLat),
      isPreviewOpen: !!id,
      scanIndex: newIndex !== -1 ? newIndex : state.scanIndex,
      isScanEnabled: !!id, 
      navRequestId: state.navRequestId + 1,
      navTargetClusterId: id
    };
  }),

  toggleDrawer: () => set((state) => ({ isClusterDrawerOpen: !state.isClusterDrawerOpen })),
  toggleHeatmap: () => set((state) => ({ isHeatmapEnabled: !state.isHeatmapEnabled })),
  setViewportFeedIds: (ids) => set({ viewportFeedIds: ids }),

  // Navigation Actions
  toggleScan: () => set((state) => {
    const nextEnabled = !state.isScanEnabled;
    // If turning on, select first item
    const initialId = nextEnabled ? state.scannableClusterIds[0] : null;
    const initialCluster = initialId ? mockClusters.find(c => c.id === initialId) : null;

    return {
      isScanEnabled: nextEnabled,
      scanIndex: 0, 
      selectedClusterId: initialId,
      selectedClusterLngLat: initialCluster ? [initialCluster.lng, initialCluster.lat] : state.selectedClusterLngLat,
      isPreviewOpen: nextEnabled ? state.isPreviewOpen : false,
      navRequestId: state.navRequestId + 1,
      navTargetClusterId: initialId
    };
  }),

  nextHotspot: () => set((state) => {
    const nextIndex = (state.scanIndex + 1) % state.scannableClusterIds.length;
    const nextId = state.scannableClusterIds[nextIndex];
    const cluster = mockClusters.find(c => c.id === nextId);
    
    return {
      scanIndex: nextIndex,
      selectedClusterId: nextId,
      selectedClusterLngLat: cluster ? [cluster.lng, cluster.lat] : state.selectedClusterLngLat,
      navRequestId: state.navRequestId + 1,
      navTargetClusterId: nextId
    };
  }),

  prevHotspot: () => set((state) => {
    const prevIndex = (state.scanIndex - 1 + state.scannableClusterIds.length) % state.scannableClusterIds.length;
    const prevId = state.scannableClusterIds[prevIndex];
    const cluster = mockClusters.find(c => c.id === prevId);

    return {
      scanIndex: prevIndex,
      selectedClusterId: prevId,
      selectedClusterLngLat: cluster ? [cluster.lng, cluster.lat] : state.selectedClusterLngLat,
      navRequestId: state.navRequestId + 1,
      navTargetClusterId: prevId
    };
  }),

  exitScanMode: () => set((state) => ({ 
    isScanEnabled: false, 
    selectedClusterId: null, 
    isPreviewOpen: false,
    navRequestId: state.navRequestId + 1,
    navTargetClusterId: null
  })),

  // Stack & Ranking Implementation
  toggleHotspotStack: () => set((state) => ({ isHotspotStackOpen: !state.isHotspotStackOpen })),

  requestUserLocation: async () => {
    if (!navigator.geolocation) {
      console.warn("Geolocation not supported");
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });

      const userLoc = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      const newRankedIds = getRankedIds(userLoc);

      set({ 
        userLocation: userLoc,
        scannableClusterIds: newRankedIds,
        scanIndex: 0 
      });

    } catch (error) {
      console.warn("Location access denied or failed", error);
    }
  },

  jumpToHotspot: (id) => set((state) => {
    const index = state.scannableClusterIds.indexOf(id);
    const cluster = mockClusters.find(c => c.id === id);

    if (index === -1) {
       // Should rarely happen if lists are synced
       return {
         selectedClusterId: id,
         selectedClusterLngLat: cluster ? [cluster.lng, cluster.lat] : state.selectedClusterLngLat,
         navRequestId: state.navRequestId + 1,
         navTargetClusterId: id
       };
    }

    return {
      isScanEnabled: true, 
      scanIndex: index,
      selectedClusterId: id,
      selectedClusterLngLat: cluster ? [cluster.lng, cluster.lat] : state.selectedClusterLngLat,
      navRequestId: state.navRequestId + 1,
      navTargetClusterId: id
    };
  }),

  refreshHotspots: () => set((state) => ({
    scannableClusterIds: getRankedIds(state.userLocation),
    scanIndex: 0
  }))
}));
