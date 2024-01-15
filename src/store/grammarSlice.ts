import { StateCreator } from "zustand";
import { GrammarSlice, Nonterminal, Production, Terminal } from "../types";

// Variables generally needed for the webtutor
export const createGrammarSlice: StateCreator<GrammarSlice> = (set) => ({
  // Special (non)terminals we need regardless of the input grammar
  startSymbol: new Nonterminal("S'"),
  epsilon: new Terminal("ε"),
  endOfInput: new Terminal("$"),
  // Productions, Nonterminals and Terminals of the input grammar
  // Generated from User input
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
