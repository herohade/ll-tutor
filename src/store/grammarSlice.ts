import { StateCreator } from "zustand";
import { GrammarSlice, Nonterminal, Production, Terminal } from "../types";

/**
 * Creates a new {@link GrammarSlice} with the given initial state.
 */
export const createGrammarSlice: StateCreator<GrammarSlice> = (set) => ({
  startSymbol: new Nonterminal("S'"),
  epsilon: new Terminal("ε"),
  endOfInput: new Terminal("$"),
  productions: [],
  nonTerminals: [],
  terminals: [],
  setProductions: (productions: Production[]) => {
    set({ productions: productions });
  },
  setNonTerminals: (nonTerminals: Nonterminal[]) => {
    set({ nonTerminals: nonTerminals });
  },
  setTerminals: (terminals: Terminal[]) => {
    set({ terminals: terminals });
  },
});
