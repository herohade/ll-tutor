import { createWithEqualityFn } from "zustand/traditional";

import { createNavigationSlice } from "./navigationSlice";
import { createGrammarSlice } from "./grammarSlice";
import { createGrammarSetupSlice } from "./grammarSetupSlice";
import { createEmptyNodeSlice } from "./emptyNodeSlice";

import { NavigationSlice, EmptyNodeSlice, GrammarSlice, GrammarSetupSlice } from "../types";

// this is our useStore hook that we can use in our components to get parts of the store and call actions
const useBoundStore = createWithEqualityFn<NavigationSlice & GrammarSlice & GrammarSetupSlice & EmptyNodeSlice>(
  (...args) => ({
    ...createNavigationSlice(...args),
    ...createGrammarSlice(...args),
    ...createGrammarSetupSlice(...args),
    ...createEmptyNodeSlice(...args),
  }),
);

export default useBoundStore;
