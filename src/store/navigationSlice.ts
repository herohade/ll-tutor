import { StateCreator } from "zustand";

import { NavigationSlice } from "../types";

export const createNavigationSlice: StateCreator<NavigationSlice> = (set, get) => ({
  minPage: 0,
  maxPage: 7,
  page: 0,
  open: true,
  backButtonFailed: false,
  nextButtonFailed: false,
  backButtonTimeout: undefined,
  nextButtonTimeout: undefined,
  previousPage: () => {
    set({ page: get().page - 1 });
  },
  nextPage: () => {
    set({ page: get().page + 1 });
  },
  toggleOpen: () => {
    set({ open: !get().open });
  },
  setBackButtonFailed: (failed: boolean) => {
    set({ backButtonFailed: failed });
  },
  setNextButtonFailed: (failed: boolean) => {
    set({ nextButtonFailed: failed });
  },
  setBackButtonTimeout: (timeout: number | undefined) => {
    set({ backButtonTimeout: timeout });
  },
  setNextButtonTimeout: (timeout: number | undefined) => {
    set({ nextButtonTimeout: timeout });
  },
});
