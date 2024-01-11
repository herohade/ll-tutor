import { StateCreator } from "zustand";

import { NavigationSlice } from "../types";

export const createNavigationSlice: StateCreator<NavigationSlice> = (set, get) => ({
  minPage: 0,
  maxPage: 9,
  page: 0,
  open: window.innerWidth > window.innerHeight || window.innerWidth > 800,
  // settings to store in local storage
  // tutorial: whether to show tutorial (default: true)
  // colorScheme: dark (default), light, or system
  // language: en (default) (not implemented)
  settings: JSON.parse(
    localStorage.getItem("settings") ||
      '{"tutorial": true, "colorScheme": "system", "language": "en"}',
  ),
  tutorialPage: 0,
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
  setTutorialPage: (tutorialPage) => {
    set({ tutorialPage });
  },
});
