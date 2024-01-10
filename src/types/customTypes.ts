import {
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  NodeTypes,
  EdgeTypes,
} from "reactflow";

import { VariantType } from "notistack";

export { Terminal, Nonterminal, Production };
export type { printable };

// Types for the empty, first and follow algorithms
interface printable {
  // for algorithmic use (e.g. comparison)
  name: string;
  // for printing
  representation: string;
  references: number;
  productive: boolean;
  reachable: boolean;
  empty: boolean;
  first: Terminal[];
  follow: Terminal[];
}

class Terminal implements printable {
  name: string;
  representation: string;
  references: number = 0;
  productive: boolean = true;
  reachable: boolean = false;
  empty: boolean;
  first: Terminal[] = [];
  follow: Terminal[] = [];

  constructor(name: string) {
    this.name = name;
    this.representation = name; // (name === "ε" || name === "$") ? "" : name;
    this.empty = name === "ε";
  }
}

class Nonterminal implements printable {
  name: string;
  representation: string;
  references: number = 0;
  start: boolean = false;
  productive: boolean = false;
  reachable: boolean;
  empty: boolean = false;
  first: Terminal[] = [];
  follow: Terminal[] = [];

  lookahead: Array<[Terminal, Production]> = [];

  constructor(name: string) {
    this.name = name;
    this.representation = name;
    this.reachable = name === "S'";
  }
}

class Production implements printable {
  name: string;
  representation: string;
  references: number = 0;
  productive: boolean = false;
  reachable: boolean = false;
  empty: boolean = false;
  first: Terminal[] = [];
  follow: Terminal[] = [];

  leftSide: Nonterminal;
  rightSide: Array<Terminal | Nonterminal>;
  number: number = -1;
  uppercaseNumber: string = "";
  numberedRepresentation: () => string;

  constructor(leftSide: Nonterminal, rightSide: Array<Terminal | Nonterminal>) {
    this.name = leftSide.name + " => " + rightSide.map((v) => v.name).join(" ");
    this.representation =
      leftSide.representation +
      " => " +
      rightSide.map((v) => v.representation).join(" ");
    this.numberedRepresentation = (): string => {
      if (this.number < 0) {
        return (
          leftSide.representation +
          " => " +
          rightSide.map((v) => v.representation).join(" ")
        );
      } else {
        return (
          leftSide.representation +
          " => " +
          rightSide.map((v) => v.representation).join(" ") +
          " " +
          this.uppercaseNumber
        );
      }
    };
    this.leftSide = leftSide;
    this.rightSide = rightSide;
  }
}

export type localStoreSettings = {
  tutorial: boolean;
  language: "en" | "de"; // currently unused since only english is supported
  colorScheme: "dark" | "light" | "system";
};

// Type for the layout algorithm (ELK)
export type ElkDirectionType = "RIGHT" | "LEFT" | "UP" | "DOWN";

// Types for the zustand store
export type NavigationSlice = {
  minPage: number;
  maxPage: number;
  page: number;
  open: boolean;
  settings: localStoreSettings;
  tutorialPage: number;
  previousPage: () => void;
  nextPage: () => void;
  toggleOpen: () => void;
  setSettings: (settings: localStoreSettings) => void;
  setTutorialPage: (tutorialPage: number) => void;
};

export type GrammarSlice = {
  startSymbol: Nonterminal;
  epsilon: Terminal;
  endOfInput: Terminal;
  productions: Production[];
  nonTerminals: Nonterminal[];
  terminals: Terminal[];
  setProductions: (productions: Production[]) => void;
  setNonTerminals: (nonTerminals: Nonterminal[]) => void;
  setTerminals: (terminals: Terminal[]) => void;
};

export type GrammarSetupSlice = {
  start: [name: Nonterminal, start: boolean][];
  sorted: boolean;
  reduced: boolean;
  preparedEmpty: boolean;
  preparedFirst: boolean;
  preparedFirstMap: boolean;
  preparedFollow: boolean;
  setStart: (start: [name: Nonterminal, start: boolean][]) => void;
  setSorted: (sorted: boolean) => void;
  setReduced: (reduced: boolean) => void;
  setPreparedEmpty: (prepared: boolean) => void;
  setPreparedFirst: (prepared: boolean) => void;
  setPreparedFirstMap: (prepared: boolean) => void;
  setPreparedFollow: (prepared: boolean) => void;
};

export enum NodeColor {
  // @mui/material/colors
  none = "#9e9e9e", // grey[500],
  // thisTurn = "#00b0ff", // lightBlue.A400,
  // lastTurn = "#2979ff", // blue.A400,
  // older = "#651fff", // deepPurple.A400,
  thisTurn = "#8c9eff", // indigo.A100,
  lastTurn = "#536dfe", // indigo.A200,
  older = "#1a237e", // indigo[900],
}

export type NodeData = {
  name: string;
  empty: boolean;
  color: NodeColor;
  labelSize?: { width: number; height: number };
};

export enum EdgePathType {
  Straight = "straight",
  Smoothstep = "smoothstep",
  Bezier = "bezier",
}

export type EdgeData = {
  pathType: EdgePathType;
  isGroupEdge: boolean; // wether this edge connects group nodes or not
  name: string;
};

export type EmptyNodeSlice = {
  emptyIdCounter: number;
  emptyNodeTypes: NodeTypes;
  emptyEdgeTypes: EdgeTypes;
  emptySetupComplete: boolean;
  emptyNodes: Node<NodeData>[];
  emptyEdges: Edge<EdgeData>[];
  getEmptyNodeId: () => string;
  getEmptyEdgeId: () => string;
  setEmptySetupComplete: (complete: boolean) => void;
  setEmptyNodes: (nodes: Node<NodeData>[], fitView?: () => void) => void;
  setEmptyEdges: (edges: Edge<EdgeData>[], fitView?: () => void) => void;
  onEmptyNodesChange: OnNodesChange;
  onEmptyEdgesChange: OnEdgesChange;
  onEmptyConnect: (
    showSnackbar: (
      message: string,
      variant: VariantType,
      preventDuplicate: boolean,
    ) => void,
  ) => OnConnect;
  toggleEmptyDeletableAndConnectable: (
    deletable: boolean,
    connectable: boolean,
  ) => void;
  updateEmptyNodeAndEdgeEmpty: (nodeId: string, empty: boolean) => void;
  updateEmptyNodeAndEdges: (
    nodeId: string,
    name: string,
    empty: boolean,
  ) => void;
  updateAllEmptyNodeAndEdgeColors: () => void;
};

export type EmptyAlgorithmSlice = {
  emptyNonterminalMap: [string, boolean][];
  emptyProductionMap: [string, boolean][];
  emptyUserFixpoint: boolean;
  emptyFixpoint: boolean;
  emptyWorkList: Production[];
  finishedEmpty: boolean;
  setEmptyNonterminalMap: (map: [string, boolean][]) => void;
  setEmptyProductionMap: (map: [string, boolean][]) => void;
  setEmptyUserFixpoint: (fixpoint: boolean) => void;
  setEmptyFixpoint: (fixpoint: boolean) => void;
  setEmptyWorkList: (workList: Production[]) => void;
  setFinishedEmpty: (finished: boolean) => void;
};

export type FirstNodeSlice = {
  firstIdCounter: number;
  firstNodeTypes: NodeTypes;
  firstEdgeTypes: EdgeTypes;
  firstSetupComplete: boolean;
  firstNodes: Node<NodeData>[];
  firstEdges: Edge<EdgeData>[];
  getFirstNodeId: () => string;
  getFirstEdgeId: () => string;
  setFirstSetupComplete: (complete: boolean) => void;
  setFirstNodes: (nodes: Node<NodeData>[], fitView?: () => void) => void;
  setFirstEdges: (edges: Edge<EdgeData>[], fitView?: () => void) => void;
  setLabelSize: (
    nodeId: string,
    size: { width: number; height: number } | undefined,
  ) => void;
  onFirstNodesChange: OnNodesChange;
  onFirstEdgesChange: OnEdgesChange;
  onFirstConnect: (
    showSnackbar: (
      message: string,
      variant: VariantType,
      preventDuplicate: boolean,
    ) => void,
  ) => OnConnect;
  toggleFirstDeletableAndConnectable: (
    deletable: boolean,
    connectable: boolean,
  ) => void;
  setFirstNodeEdgesHidden: (hidden: boolean) => void;
};

// Every FirstNode has a FirstAlgorithmNodeMap
export type FirstAlgorithmNodeMap = {
  // Wheter the node (=button) is active or not.
  // A node (button) is disabled if any outgoing node is active.
  active: boolean;
  // A map of all incoming nodes and their first sets.
  incomingFirst: Map<string, string[] | undefined>;
  // The first set of this node. Needs to be updated by an incoming node
  // if it changes its incoming first value.
  // It is a set of unique terminals.
  first: Set<string>;
}

export type FirstAlgorithmSlice = {
  // Indicates whether the empty algorithm is finished
  // User can now proceed to the next page
  finishedFirst: boolean;
  // A map of all nodes (ids) and their firstAlgorithmNodeMap.
  firstNodeMap: Map<string, FirstAlgorithmNodeMap>;
  setFinishedFirst: (finished: boolean) => void;
  setFirstNodeMap: (map: Map<string, FirstAlgorithmNodeMap>) => void;
  changeFirstNodeMap: (nodeName: string, map: FirstAlgorithmNodeMap) => void;
};

export type FollowNodeSlice = {
  followIdCounter: number;
  followNodeTypes: NodeTypes;
  followEdgeTypes: EdgeTypes;
  followSetupComplete: boolean;
  followNodes: Node<NodeData>[];
  followEdges: Edge<EdgeData>[];
  getFollowNodeId: () => string;
  getFollowEdgeId: () => string;
  setFollowSetupComplete: (complete: boolean) => void;
  setFollowNodes: (nodes: Node<NodeData>[], fitView?: () => void) => void;
  setFollowEdges: (edges: Edge<EdgeData>[], fitView?: () => void) => void;
  setLabelSize: (
    nodeId: string,
    size: { width: number; height: number } | undefined,
  ) => void;
  onFollowNodesChange: OnNodesChange;
  onFollowEdgesChange: OnEdgesChange;
  onFollowConnect: (
    showSnackbar: (
      message: string,
      variant: VariantType,
      preventDuplicate: boolean,
    ) => void,
  ) => OnConnect;
  toggleFollowDeletableAndConnectable: (
    deletable: boolean,
    connectable: boolean,
  ) => void;
  setFollowNodeEdgesHidden: (hidden: boolean) => void;
};
