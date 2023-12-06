import {
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  NodeTypes,
  EdgeTypes,
} from "reactflow";

// Types for the zustand store
export type NavigationSlice = {
  minPage: number;
  maxPage: number;
  page: number;
  open: boolean;
  previousPage: () => void;
  nextPage: () => void;
  toggleOpen: () => void;
};

export type EmptyNodeSlice = {
  emptyIdCounter: number;
  emptyNodeTypes: NodeTypes;
  emptyEdgeTypes: EdgeTypes;
  emptyNodes: Node[];
  emptyEdges: Edge[];
  getEmptyNodeId: () => string;
  getEmptyEdgeId: () => string;
  setEmptyNodes: (nodes: Node[]) => void;
  setEmptyEdges: (edges: Edge[]) => void;
  onEmptyNodesChange: OnNodesChange;
  onEmptyEdgesChange: OnEdgesChange;
  onEmptyConnect: OnConnect;
};
