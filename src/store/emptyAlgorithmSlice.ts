import { StateCreator } from "zustand";
import { EmptyAlgorithmSlice, Production } from "../types";

export const createEmptyAlgorithmSlice: StateCreator<EmptyAlgorithmSlice> = (
  set
) => ({
  // Variables needed for the empty attribute algorithm
  // A mapping from Nonterminals, Terminals and Productions to booleans,
  // indicating whether they are empty. Used to update colors when empty changes
  emptyNonterminalMap: [],
  emptyTerminalMap: [],
  emptyProductionMap: [],
  // Indicates whether the current step of the empty algorithm is finished
  // undefined: not started yet (used to prepare the initial state)
  finishedEmptyStep: false,
  // Indicates that the user thinks they reached the fixpoint
  emptyUserFixpoint: false,
  // Indicates that the algorithm reached the fixpoint
  emptyFixpoint: false,
  // Worklist of the empty algorithm, used by the solution generator
  emptyWorkList: [],
  // Indicates whether the empty algorithm is finished
  // User can now proceed to the next page
  finishedEmpty: false,
  setEmptyNonterminalMap: (map: [string, boolean][]) => {
    set({ emptyNonterminalMap: map });
  },
  setEmptyTerminalMap: (map: [string, boolean][]) => {
    set({ emptyTerminalMap: map });
  },
  setEmptyProductionMap: (map: [string, boolean][]) => {
    set({ emptyProductionMap: map });
  },
  setFinishedEmptyStep: (finished: boolean) => {
    set({ finishedEmptyStep: finished });
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
