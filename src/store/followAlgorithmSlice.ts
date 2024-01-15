import { StateCreator } from "zustand";

import { FollowAlgorithmNodeMap, FollowAlgorithmSlice } from "../types";

export const createFollowAlgorithmSlice: StateCreator<FollowAlgorithmSlice> = (
  set,
) => ({
  // Indicates whether the empty algorithm is finished
  // User can now proceed to the next page
  finishedFollow: false,
  // A map of all nodes (ids) and their followAlgorithmNodeMap.
  followNodeMap: new Map<string, FollowAlgorithmNodeMap>([]),
  setFinishedFollow: (finished: boolean) => {
    set({ finishedFollow: finished });
  },
  setFollowNodeMap: (map: Map<string, FollowAlgorithmNodeMap>) => {
    set({ followNodeMap: map });
  },
});
