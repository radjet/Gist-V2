import { create } from 'zustand';
import { UIState } from '../types';

export const useUIStore = create<UIState>((set) => ({
  isClusterDrawerOpen: false,
  selectedClusterId: null,
  openDrawer: () => set({ isClusterDrawerOpen: true }),
  closeDrawer: () => set({ isClusterDrawerOpen: false }),
  toggleDrawer: () => set((state) => ({ isClusterDrawerOpen: !state.isClusterDrawerOpen })),
  selectCluster: (id) => set({ selectedClusterId: id }),
}));