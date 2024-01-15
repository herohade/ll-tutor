import { StateCreator } from "zustand";

import { FirstAlgorithmNodeMap, FirstAlgorithmSlice } from "../types";

export const createFirstAlgorithmSlice: StateCreator<FirstAlgorithmSlice> = (
  set,
) => ({
  // Indicates whether the empty algorithm is finished
  // User can now proceed to the next page
  finishedFirst: false,
  // A map of all nodes (ids) and their firstAlgorithmNodeMap.
  firstNodeMap: new Map<string, FirstAlgorithmNodeMap>([]),
  setFinishedFirst: (finished: boolean) => {
    set({ finishedFirst: finished });
  },
  setFirstNodeMap: (map: Map<string, FirstAlgorithmNodeMap>) => {
    set({ firstNodeMap: map });
  },
});
