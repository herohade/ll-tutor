import { StateCreator } from "zustand";

import { NavigationSlice } from "../types";

/**
 * Creates a new {@link NavigationSlice} with the given initial state.
 */
export const createNavigationSlice: StateCreator<NavigationSlice> = (
  set,
  get,
) => ({
  minPage: 0,
  maxPage: 9,
  page: 0,
  open: window.innerWidth > window.innerHeight || window.innerWidth > 800,
  // This tries to parse the settings from the local storage. If it fails
  // the default settings are used.
  settings: JSON.parse(
    localStorage.getItem("settings") ||
      '{"colorScheme": "system", "language": "en", "snackbarDuration": 5000, "tutorial": true}',
  ),
  tutorialPage: 0,
  previousPage: () => {
    set({ page: get().page - 1 });
  },
  nextPage: () => {
    set({ page: get().page + 1 });
  },
  setPage: (page) => {
    set({ page });
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
