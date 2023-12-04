import { StateCreator } from "zustand";
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from "reactflow";

import {
  EmptyNodeSlice
} from "../types";

export const createEmptyNodeSlice: StateCreator<EmptyNodeSlice> = (
  set,
  get
) => ({
  emptyIdCounter: 0,
  emptyNodeTypes: {
  },
  emptyEdgeTypes: {
  },
  emptyNodes: [],
  emptyEdges: [],
  getEmptyNodeId: () => {
    const counter = get().emptyIdCounter;
    set({ emptyIdCounter: counter + 1 });
    return "EmptyNode" + counter;
  },
  getEmptyEdgeId: () => {
    const counter = get().emptyIdCounter;
    set({ emptyIdCounter: counter + 1 });
    return "EmptyEdge" + counter;
  },
  setEmptyNodes: (nodes: Node[]) => {
    set({ emptyNodes: nodes });
  },
  setEmptyEdges: (edges: Edge[]) => {
    set({ emptyEdges: edges });
  },
  onEmptyNodesChange: (changes: NodeChange[]) => {
    set({
      emptyNodes: applyNodeChanges(changes, get().emptyNodes),
    });
  },
  onEmptyEdgesChange: (changes: EdgeChange[]) => {
    set({
      emptyEdges: applyEdgeChanges(changes, get().emptyEdges),
    });
  },
  onEmptyConnect: (connection: Connection) => {
    set({
      emptyEdges: addEdge(connection, get().emptyEdges),
    });
  },
});
