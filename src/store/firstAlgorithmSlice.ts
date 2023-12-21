import { StateCreator } from "zustand";

import { FirstAlgorithmSlice } from "../types";

export const createFirstAlgorithmSlice: StateCreator<FirstAlgorithmSlice> = (
  set,
) => ({
  // Indicates whether the empty algorithm is finished
  // User can now proceed to the next page
  finishedFirst: false,
  setFinishedFirst: (finished: boolean) => {
    set({ finishedFirst: finished });
  },
});
