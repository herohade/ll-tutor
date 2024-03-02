import { StateCreator } from "zustand";

import { GrammarSetupSlice, Nonterminal } from "../types";

/**
 * Creates a new {@link GrammarSetupSlice} with the given initial state.
 */
export const createGrammarSetupSlice: StateCreator<GrammarSetupSlice> = (
  set,
) => ({
  start: [],
  sorted: false,
  reduced: false,
  preparedEmpty: false,
  preparedFirst: false,
  preparedFirstMap: false,
  preparedFollow: false,
  preparedFollowMap: false,
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
  setPreparedFirstMap: (setup: boolean) => {
    set({ preparedFirstMap: setup });
  },
  setPreparedFollow: (setup: boolean) => {
    set({ preparedFollow: setup });
  },
  setPreparedFollowMap: (setup: boolean) => {
    set({ preparedFollowMap: setup });
  },
});
