'use client';

import { create } from 'zustand';

type FleetShellState = {
  sidebarOpen: boolean;
  rightRailOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  setRightRailOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  toggleRightRail: () => void;
};

export const useFleetShellStore = create<FleetShellState>((set) => ({
  sidebarOpen: true,
  rightRailOpen: true,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setRightRailOpen: (rightRailOpen) => set({ rightRailOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleRightRail: () => set((state) => ({ rightRailOpen: !state.rightRailOpen })),
}));
