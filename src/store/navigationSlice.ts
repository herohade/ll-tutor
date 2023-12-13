import { StateCreator } from "zustand";

import { NavigationSlice } from "../types";

export const createNavigationSlice: StateCreator<NavigationSlice> = (set, get) => ({
  minPage: 0,
  maxPage: 8,
  page: 0,
  open: window.innerWidth > window.innerHeight || window.innerWidth > 800,
  previousPage: () => {
    set({ page: get().page - 1 });
  },
  nextPage: () => {
    set({ page: get().page + 1 });
  },
  toggleOpen: () => {
    set({ open: !get().open });
  },
});
