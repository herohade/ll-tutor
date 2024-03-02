import { StateCreator } from "zustand";
import { EmptyAlgorithmSlice, Production } from "../types";

/**
 * Creates a new {@link EmptyAlgorithmSlice} with the given initial state.
 */
export const createEmptyAlgorithmSlice: StateCreator<EmptyAlgorithmSlice> = (
  set
) => ({
  emptyNonterminalMap: [],
  emptyProductionMap: [],
  emptyUserFixpoint: false,
  emptyFixpoint: false,
  emptyWorkList: [],
  finishedEmpty: false,
  setEmptyNonterminalMap: (map: [string, boolean][]) => {
    set({ emptyNonterminalMap: map });
  },
  setEmptyProductionMap: (map: [string, boolean][]) => {
    set({ emptyProductionMap: map });
  },
  setEmptyUserFixpoint: (fixpoint: boolean) => {
    set({ emptyUserFixpoint: fixpoint });
  },
  setEmptyFixpoint: (fixpoint: boolean) => {
    set({ emptyFixpoint: fixpoint });
  },
  setEmptyWorkList: (workList: Production[]) => {
    set({ emptyWorkList: workList });
  },
  setFinishedEmpty: (finished: boolean) => {
    set({ finishedEmpty: finished });
  },
});
