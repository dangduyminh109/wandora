'use client';
import { create } from 'zustand';
type UiState = {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebarCollapsed: () => void;
};
export const useUiStore = create<UiState>()((set) => ({
  sidebarOpen: false,
  sidebarCollapsed: false,
  openSidebar: () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),
  toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));
