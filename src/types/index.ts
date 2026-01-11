export interface Cluster {
  id: string;
  title: string;
  summary: string;
  locationLabel: string;
  updatedAt: string; // ISO string
  breakingScore: number; // 0 to 100
}

export interface UIState {
  isClusterDrawerOpen: boolean;
  selectedClusterId: string | null;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  selectCluster: (id: string | null) => void;
}