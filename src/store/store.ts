import { createWithEqualityFn } from "zustand/traditional";

import { createNavigationSlice } from "./navigationSlice";
import { createEmptyNodeSlice } from "./emptyNodeSlice";

import { NavigationSlice, EmptyNodeSlice } from "../types";

// this is our useStore hook that we can use in our components to get parts of the store and call actions
const useBoundStore = createWithEqualityFn<EmptyNodeSlice & NavigationSlice>(
  (...args) => ({
    ...createEmptyNodeSlice(...args),
    ...createNavigationSlice(...args),
  }),
);

export default useBoundStore;
