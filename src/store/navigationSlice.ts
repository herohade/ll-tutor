import { StateCreator } from "zustand";

import { NavigationSlice } from "../types";

export const createNavigationSlice: StateCreator<NavigationSlice> = (set, get) => ({
  minPage: 0,
  maxPage: 8,
  page: 0,
  open: window.innerWidth > window.innerHeight || window.innerWidth > 800,
  settings: JSON.parse(
    localStorage.getItem("settings") ||
      '{"tutorial": true, "colorScheme": "system", "language": "en"}',
  ),
  previousPage: () => {
    set({ page: get().page - 1 });
  },
  nextPage: () => {
    set({ page: get().page + 1 });
  },
  toggleOpen: () => {
    set({ open: !get().open });
  },
  setSettings: (settings) => {
    localStorage.setItem("settings", JSON.stringify(settings));
    set({ settings });
  },
});
