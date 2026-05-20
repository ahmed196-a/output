import { create } from "zustand";

interface UIStore {
  sidebarOpen: boolean;
  adminSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setAdminSidebarOpen: (open: boolean) => void;
  toggleAdminSidebar: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: false,
  adminSidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setAdminSidebarOpen: (open) => set({ adminSidebarOpen: open }),
  toggleAdminSidebar: () => set((state) => ({ adminSidebarOpen: !state.adminSidebarOpen })),
}));
