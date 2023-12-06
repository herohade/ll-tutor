import {
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  NodeTypes,
  EdgeTypes,
} from "reactflow";

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
  setStart: (start: [name: Nonterminal, start: boolean][]) => void;
  setSorted: (sorted: boolean) => void;
  setReduced: (reduced: boolean) => void;
  setPreparedEmpty: (prepared: boolean) => void;
  setPreparedFirst: (prepared: boolean) => void;
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
