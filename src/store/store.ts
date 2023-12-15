import { createWithEqualityFn } from "zustand/traditional";

import { createNavigationSlice } from "./navigationSlice";
import { createGrammarSlice } from "./grammarSlice";
import { createGrammarSetupSlice } from "./grammarSetupSlice";
import { createEmptyNodeSlice } from "./emptyNodeSlice";
import { createEmptyAlgorithmSlice } from "./emptyAlgorithmSlice";
import { createFirstNodeSlice } from "./firstNodeSlice";

import { NavigationSlice, EmptyNodeSlice, GrammarSlice, GrammarSetupSlice, EmptyAlgorithmSlice, FirstNodeSlice } from "../types";

// this is our useStore hook that we can use in our components to get parts of the store and call actions
const useBoundStore = createWithEqualityFn<NavigationSlice & GrammarSlice & GrammarSetupSlice & EmptyNodeSlice & EmptyAlgorithmSlice & FirstNodeSlice>(
  (...args) => ({
    ...createNavigationSlice(...args),
    ...createGrammarSlice(...args),
    ...createGrammarSetupSlice(...args),
    ...createEmptyNodeSlice(...args),
    ...createEmptyAlgorithmSlice(...args),
    ...createFirstNodeSlice(...args),
  }),
);

export default useBoundStore;
