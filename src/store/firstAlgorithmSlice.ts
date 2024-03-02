import { StateCreator } from "zustand";

import { FirstAlgorithmNodeMap, FirstAlgorithmSlice } from "../types";


/**
 * Creates a new {@link FirstAlgorithmSlice} with the given initial state.
 */
export const createFirstAlgorithmSlice: StateCreator<FirstAlgorithmSlice> = (
  set,
) => ({
  finishedFirst: false,
  firstNodeMap: new Map<string, FirstAlgorithmNodeMap>([]),
  setFinishedFirst: (finished: boolean) => {
    set({ finishedFirst: finished });
  },
  setFirstNodeMap: (map: Map<string, FirstAlgorithmNodeMap>) => {
    set({ firstNodeMap: map });
  },
});
