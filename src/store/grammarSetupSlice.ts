import { StateCreator } from "zustand";

import { GrammarSetupSlice, Nonterminal } from "../types";

export const createGrammarSetupSlice: StateCreator<GrammarSetupSlice> = (
  set
) => ({
  // Variables needed for the selection of the start symbol
  // A mapping from nonterminals to booleans, indicating whether they are
  // the user selected start symbol (this is not the code generated S'!)
  // Used to update colors when start symbol changes
  start: [],
  // Variables needed when changing between pages
  // Indicates whether the grammar is needs to be sorted when switching
  // from page 2 to 3 (before selecting the start symbol)
  sorted: false,
  // Indicates whether the grammar is needs to be reduced when switching
  // from page 3 to 4 (before applying the empty attribute algorithm)
  reduced: false,
  preparedEmpty: false,
  preparedFirst: false,
  setStart: (start: [name: Nonterminal, start: boolean][]) => {
    set({ start: start });
  },
  setSorted: (sorted: boolean) => {
    set({ sorted: sorted });
  },
  setReduced: (reduced: boolean) => {
    set({ reduced: reduced });
  },
  setPreparedEmpty: (setup: boolean) => {
    set({ preparedEmpty: setup });
  },
  setPreparedFirst: (setup: boolean) => {
    set({ preparedFirst: setup });
  },
});
