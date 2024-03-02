import { StateCreator } from "zustand";

import { FollowAlgorithmNodeMap, FollowAlgorithmSlice } from "../types";

/**
 * Creates a new {@link FollowAlgorithmSlice} with the given initial state.
 */
export const createFollowAlgorithmSlice: StateCreator<FollowAlgorithmSlice> = (
  set,
) => ({
  finishedFollow: false,
  followNodeMap: new Map<string, FollowAlgorithmNodeMap>([]),
  setFinishedFollow: (finished: boolean) => {
    set({ finishedFollow: finished });
  },
  setFollowNodeMap: (map: Map<string, FollowAlgorithmNodeMap>) => {
    set({ followNodeMap: map });
  },
});
