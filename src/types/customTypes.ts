import {
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  NodeTypes,
  EdgeTypes,
} from "reactflow";

import { LayoutOptions } from "elkjs/lib/elk-api";

import { VariantType } from "notistack";

export { Terminal, Nonterminal, Production };
export type { printable };

////////////////////////////////////////
// Types for the grammar representation
////////////////////////////////////////

/**
 * A printable is the basis for all grammar elements which may be of interest
 * (and may therefore be displayed to the user).
 *
 * These are terminals, nonterminals and productions.
 *
 * @remarks
 *
 * The printable interface is used to define the basic properties of
 * terminals, nonterminals and productions which are required for the
 * tutor.
 *
 */
interface printable {
  /**
   * Intended for algorithmic use (e.g. comparison).
   *
   * @remarks
   *
   * The intention is to allow for special characters
   * to have printable names, like "" vs "ε" (empty string).
   *
   * At present, the tutor asigns the same string to
   * both name and representation. Nevertheless, it is
   * recommended to not use them interchangeably and
   * adhere to the intended use.
   */
  name: string;
  /** Intended for printing.
   *
   * @remarks
   *
   * The intention is to allow for special characters
   * to have printable names, like "" vs "ε" (empty string).
   *
   * At present, the tutor asigns the same string to
   * both name and representation. Nevertheless, it is
   * recommended to not use them interchangeably and
   * adhere to the intended use.
   */
  representation: string;
  /**
   * How many printables reference this printable.
   *
   * @remarks
   *
   * This is used to determine whether a printable is
   * still in use. If the references count is zero,
   * the printable is not used anymore and can be
   * removed from the grammar.
   *
   * @example
   *
   * ### Removing a production
   *
   * The user can remove productions by clicking a button.
   * Now, the tutor needs to remove the production and unused
   * terminals and nonterminals from the grammar.
   *
   * ```ts
   * clickHandler = (p: Production) => {
   *  // Reduce the references
   *  p.references--;
   *  p.leftSide.references--;
   *  p.rightSide.forEach((r) => r.references--);
   *  // Clean up the grammar
   *  setProductions(productions.filter((p) => p.references > 0));
   *  setNonTerminals(nonTerminals.filter((n) => n.references > 0));
   *  setTerminals(terminals.filter((t) => t.references > 0));
   * };
   * ```
   */
  references: number;
  /**
   * Whether the printable is productive.
   *
   * @remarks
   *
   * This is used when reducing the grammar.
   */
  productive: boolean;
  /**
   * Whether the printable is reachable.
   *
   * @remarks
   *
   * This is used when reducing the grammar.
   */
  reachable: boolean;
  /**
   * Whether the printable is empty.
   *
   * @remarks
   *
   * This is required when computing first and follow sets.
   */
  empty: boolean;
  /**
   * The first set of the printable.
   *
   * @remarks
   *
   * This is where the computed first set is stored.
   */
  first: Terminal[];
  /**
   * The follow set of the printable.
   *
   * @remarks
   *
   * This is where the computed follow set is stored.
   */
  follow: Terminal[];
}

/**
 * A Terminal is a symbol that represents a terminal in the grammar.
 *
 * @remarks
 *
 * Terminals should be unique, with their {@link Nonterminal.name | name}
 * being the unique identifier.
 * If a terminal is used multiple times in the grammar, it should be
 * the same instance. The {@link Terminal.references | references} property
 * is used to determine how many times a terminal is used.
 */
class Terminal implements printable {
  name: string;
  representation: string;
  references: number = 0;
  productive: boolean = true;
  reachable: boolean = false;
  empty: boolean;
  first: Terminal[] = [];
  follow: Terminal[] = [];

  /**
   * @param name - The name of the terminal
   */
  constructor(name: string) {
    this.name = name;
    this.representation = name;
    this.empty = name === "ε";
  }
}

/**
 * A Nonterminal is a symbol that represents a nonterminal in the grammar.
 *
 * @remarks
 *
 * Nonterminals should be unique, with their {@link Nonterminal.name | name}
 * being the unique identifier.
 * If a nonterminal is used multiple times in the grammar, it should be
 * the same instance. The {@link Nonterminal.references | references} property
 * is used to determine how many times a nonterminal is used.
 */
class Nonterminal implements printable {
  name: string;
  representation: string;
  references: number = 0;
  productive: boolean = false;
  reachable: boolean;
  empty: boolean = false;
  first: Terminal[] = [];
  follow: Terminal[] = [];
  /**
   * Whether the nonterminal is the start symbol of the grammar.
   */
  start: boolean = false;

  /**
   * @param name - The name of the nonterminal
   */
  constructor(name: string) {
    this.name = name;
    this.representation = name;
    this.reachable = name === "S'";
  }
}

/**
 * A Production represents a production in the grammar.
 *
 * @remarks
 *
 * Productions should be unique, with their {@link Production.name | name}
 * being the unique identifier.
 * If a production is used multiple times in the grammar, it should be
 * the same instance. The {@link Production.references | references} property
 * is used to determine how many times a production is used.
 */
class Production implements printable {
  name: string;
  representation: string;
  references: number = 0;
  productive: boolean = false;
  reachable: boolean = false;
  empty: boolean = false;
  first: Terminal[] = [];
  follow: Terminal[] = [];

  /**
   * The nonterminal on the left side of the production
   */
  leftSide: Nonterminal;
  /**
   * The array of terminals and nonterminals on the right side of the production (from left to right)
   */
  rightSide: Array<Terminal | Nonterminal>;
  /**
   * The number of the production
   *
   * @remarks
   *
   * Each production with the same left side has a unique number starting at 0.
   * This is used to display shortened representations of productions.
   *
   * @example
   *
   * ```ts
   * // long version
   * console.log(p1.numberedRepresentation()); // A => aA⁰
   * console.log(p2.numberedRepresentation()); // A => ε¹
   * // short version
   * console.log(p1.leftSide.representation + "-" + p1.number); // A-0
   * console.log(p2.leftSide.representation + "-" + p2.number); // A-1
   * ```
   */
  number: number = -1;
  /**
   * The uppercase version of the {@link Production.number | number}
   * of the production
   *
   * @remarks
   *
   * Each production with the same left side has a unique number starting at 0.
   * This is used to display shortened representations of productions.
   *
   * @example
   *
   * ```ts
   * // long version
   * console.log(p1.numberedRepresentation()); // A => aA⁰
   * console.log(p2.numberedRepresentation()); // A => ε¹
   * // short version
   * console.log(p1.leftSide.representation + "-" + p1.number); // A-0
   * console.log(p2.leftSide.representation + "-" + p2.number); // A-1
   * ```
   */
  uppercaseNumber: string = "";
  /**
   * A function that returns the productions representation and appends
   * the {@link Production.uppercaseNumber | uppercaseNumber} if it
   * exists.
   *
   * @remarks
   *
   * Each production with the same left side has a unique number starting at 0.
   * This is used to display shortened representations of productions.
   *
   * @example
   *
   * ```ts
   * // long version
   * console.log(p1.numberedRepresentation()); // A => aA⁰
   * console.log(p2.numberedRepresentation()); // A => ε¹
   * // short version
   * console.log(p1.leftSide.representation + "-" + p1.number); // A-0
   * console.log(p2.leftSide.representation + "-" + p2.number); // A-1
   * ```
   */
  numberedRepresentation: () => string;

  /**
   * @param leftSide - The nonterminal on the left side of the production
   * @param rightSide - The array of terminals and nonterminals on the right side of the production (from left to right)
   */
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

////////////////////////////////////////
// Types for the app
////////////////////////////////////////

/**
 * The object type that is stored in the local storage.
 */
export type localStoreSettings = {
  /**
   * The color scheme of the app. Can be "dark", "light" or "system".
   */
  colorScheme: "dark" | "light" | "system";
  /**
   * The language of the app. Can be "en" or "de".
   *
   * @privateRemarks
   * 
   * Currently unused since only english is supported.
   * 
   * @alpha
   */
  language: "en" | "de";
  /**
   * The duration that the snackbar messages are displayed in milliseconds.
   *
   * @remarks
   *
   * If null, the snackbar messages are displayed until the user closes them.
   * The default value is 5000 (5 seconds).
   */
  snackbarDuration: number | null;
  /**
   * Whether the tutorial is enabled or not.
   */
  tutorial: boolean;
};

/**
 * The direction type required by the layout algorithm (ELK)
 * 
 * @remarks
 * 
 * The direction type is used to specify the direction of the layout.
 */
export type ElkDirectionType = "RIGHT" | "LEFT" | "UP" | "DOWN";

/**
 * This function is used to layout the nodes and edges of a graph.
 *
 * @remarks
 *
 * This hook is used to layout the nodes and edges of the empty-graph,
 * first-graph or follow-graph. Additionally, it can be used to layout
 * the nodes and edges of a provided graph.
 * Since the layouting can take a while, the returned function
 * accepts a callback function that is called once the layouting is done.
 *
 * The layouting is done using
 * {@link https://eclipse.dev/elk/ | Eclipse Layout Kernel (ELK)}.
 * The default layouting options are:
 * ```json
 * {
 *   "elk.algorithm": "layered",
 *   "elk.direction": "RIGHT",
 *   "elk.edgeRouting": "SPLINES",
 *   "elk.interactive": "true",
 *   "elk.spacing.nodeNode": "100",
 *   "elk.spacing.edgeNode": "100",
 *   "elk.layered.spacing.nodeNodeBetweenLayers": "100",
 *   "elk.hierarchyHandling": "INCLUDE_CHILDREN",
 *   "elk.nodeLabels.placement": "[INSIDE, H_LEFT, V_TOP]",
 * };
 * ```
 *
 * @example
 *
 * ### Getting the layoutElements function
 * ```tsx
 * const { layoutElements } = useLayoutedElements(
 *   emptyNodes,
 *   emptyEdges,
 *   setEmptyNodes,
 *   setEmptyEdges,
 *   firstNodes,
 *   firstEdges,
 *   setFirstNodes,
 *   setFirstEdges,
 *   followNodes,
 *   followEdges,
 *   setFollowNodes,
 *   setFollowEdges,
 * );
 * ```
 *
 * ## Using the layoutElements function
 * ### Apply layout to the first-, empty- or follow-graph
 * ```tsx
 * // Apply a layout to the first-graph
 * layoutElements("first");
 * ```
 *
 * ### Apply layout to the empty-graph with custom options
 * ```tsx
 * layoutElements("empty", { "elk.direction": "UP", });
 * ```
 *
 * ### Apply layout a provided graph
 * ```tsx
 * layoutElements(
 *   "provided",
 *   undefined,
 *   nodes,
 *   edges,
 *   setFollowNodes,
 *   setFollowEdges,
 *   () => setLoading(undefined), // Stop the loading indicator
 * );
 * ```
 *
 * @param whichNodes - A string that specifies which nodes to layout
 * @param options - The options for the ELK layout algorithm
 * @param nodes - The nodes to layout (only for "provided")
 * @param edges - The edges to layout (only for "provided")
 * @param setNodes - The function to set the nodes (only for "provided")
 * @param setEdges - The function to set the edges (only for "provided")
 * @param cb - The callback function that is called once the layouting is done
 *
 * @returns void
 */
export interface layoutElementsInterface {
  (
    whichNodes: "empty" | "first" | "follow" | "provided",
    options?: LayoutOptions,
    nodes?: Node<NodeData>[],
    edges?: Edge<EdgeData>[],
    setNodes?: (nodes: Node<NodeData>[], fitView?: () => void) => void,
    setEdges?: (edges: Edge<EdgeData>[], fitView?: () => void) => void,
    cb?: () => void,
  ): void;
}

////////////////////////////////////////
// Types for the zustand store
////////////////////////////////////////

/**
 * The navigation slice is responsible for the navigation of the app.
 */
export type NavigationSlice = {
  /**
   * The minimum page number.
   */
  minPage: number;
  /**
   * The maximum page number.
   */
  maxPage: number;
  /**
   * The current page number.
   */
  page: number;
  /**
   * Whether the progress bar is enlaged or not.
   */
  open: boolean;
  /**
   * A copy of the local storage settings.
   */
  settings: localStoreSettings;
  /**
   * The current tutorial page number.
   *
   * @remarks
   *
   * Indicates which tutorial page has to be displayed next.
   */
  tutorialPage: number;
  /**
   * The function to change the {@link NavigationSlice.page | page} number
   * to the previous page.
   *
   * @remarks
   *
   * This function does not check if the new page number is within the
   * bounds of {@link NavigationSlice.minPage | minPage} and
   * {@link NavigationSlice.maxPage | maxPage}.
   */
  previousPage: () => void;
  /**
   * The function to change the {@link NavigationSlice.page | page} number
   * to the next page.
   *
   * @remarks
   *
   * This function does not check if the new page number is within the
   * bounds of {@link NavigationSlice.minPage | minPage} and
   * {@link NavigationSlice.maxPage | maxPage}.
   */
  nextPage: () => void;
  /**
   * The function to change the {@link NavigationSlice.page | page} number
   * to a specific page.
   *
   * @remarks
   *
   * This function does not check if the new page number is within the
   * bounds of {@link NavigationSlice.minPage | minPage} and
   * {@link NavigationSlice.maxPage | maxPage}.
   *
   * @param page - The new page number
   */
  setPage: (page: number) => void;
  /**
   * The function to toggle the {@link NavigationSlice.open | open} property.
   */
  toggleOpen: () => void;
  /**
   * The function to update the local storage settings.
   *
   * @remarks
   *
   * This function not only updates the
   * {@link NavigationSlice.settings | settings} property,
   * but also the actual local storage.
   *
   * @param settings - The new {@link localStoreSettings | settings} object
   *
   */
  setSettings: (settings: localStoreSettings) => void;
  /**
   * The function to update the
   * {@link NavigationSlice.tutorialPage | tutorialPage} property.
   *
   * @param tutorialPage - The new tutorial page number
   */
  setTutorialPage: (tutorialPage: number) => void;
};

/**
 * The grammar slice is responsible for storing and modifying the grammar.
 */
export type GrammarSlice = {
  /**
   * The {@link Nonterminal} representing the start symbol (S') of the grammar.
   */
  startSymbol: Nonterminal;
  /**
   * The {@link Terminal} representing the empty string (ε).
   */
  epsilon: Terminal;
  /**
   * The {@link Terminal} representing the end of input ($).
   */
  endOfInput: Terminal;
  /**
   * The productions of the grammar.
   */
  productions: Production[];
  /**
   * The nonterminals of the grammar.
   */
  nonTerminals: Nonterminal[];
  /**
   * The terminals of the grammar.
   */
  terminals: Terminal[];
  /**
   * The function to set the
   * {@link GrammarSlice.productions | productions} of the grammar.
   *
   * @param productions - The new production array
   */
  setProductions: (productions: Production[]) => void;
  /**
   * The function to set the
   * {@link GrammarSlice.nonTerminals | nonterminals} of the grammar.
   *
   * @param nonTerminals - The new nonterminal array
   */
  setNonTerminals: (nonTerminals: Nonterminal[]) => void;
  /**
   * The function to set the
   * {@link GrammarSlice.terminals | terminals} of the grammar.
   *
   * @param terminals - The new terminal array
   */
  setTerminals: (terminals: Terminal[]) => void;
};

/**
 * The grammar setup slice stores properties indicating the state
 * of the grammar and the progress of the app.
 * 
 * @remarks
 * 
 * It indicates whether the grammar is sorted and reduced and which algorithm
 * steps are prepared or even finished.
 */
export type GrammarSetupSlice = {
  /**
   * A map of nonterminals and whether they are the (user selected)
   * start symbol or not.
   * 
   * @remarks
   * 
   * This is used to color the selection when selecting the start symbol
   * of the grammar.
   */
  start: [name: Nonterminal, start: boolean][];
  /**
   * Whether the grammar rules have been sorted or not. (page 2-\>3)
   */
  sorted: boolean;
  /**
   * Whether the grammar has been reduced or not. (page 3-\>4)
   */
  reduced: boolean;
  /**
   * Whether we can proceed to the step of computing the empty attributes
   * or not.
   */
  preparedEmpty: boolean;
  /**
   * Whether we can proceed to the step of computing the first sets or not.
   */
  preparedFirst: boolean;
  /**
   * Whether the first set map has been prepared or not.
   * 
   * @remarks
   * 
   * The first set map keeps track of the progress of the first set algorithm.
   */
  preparedFirstMap: boolean;
  /**
   * Whether we can proceed to the step of computing the follow sets or not.
   */
  preparedFollow: boolean;
  /**
   * Whether the follow set map has been prepared or not.
   * 
   * @remarks
   * 
   * The follow set map keeps track of the progress of the follow set algorithm.
   */
  preparedFollowMap: boolean;
  /**
   * The function to set the start symbol map of the grammar.
   * 
   * @param start - The new start symbol map
   */
  setStart: (start: [name: Nonterminal, start: boolean][]) => void;
  /**
   * The function to set the {@link GrammarSetupSlice.sorted | sorted} property.
   * 
   * @param sorted - The new sorted property
   */
  setSorted: (sorted: boolean) => void;
  /**
   * The function to set the
   * {@link GrammarSetupSlice.reduced | reduced} property.
   * 
   * @param reduced - The new reduced property
   */
  setReduced: (reduced: boolean) => void;
  /**
   * The function to set the
   * {@link GrammarSetupSlice.preparedEmpty | preparedEmpty} property.
   * 
   * @param prepared - The new preparedEmpty property
   */
  setPreparedEmpty: (prepared: boolean) => void;
  /**
   * The function to set the
   * {@link GrammarSetupSlice.preparedFirst | preparedFirst} property.
   * 
   * @param prepared - The new preparedFirst property
   */
  setPreparedFirst: (prepared: boolean) => void;
  /**
   * The function to set the
   * {@link GrammarSetupSlice.preparedFirstMap | preparedFirstMap} property.
   * 
   * @param prepared - The new preparedFirstMap property
   */
  setPreparedFirstMap: (prepared: boolean) => void;
  /**
   * The function to set the
   * {@link GrammarSetupSlice.preparedFollow | preparedFollow} property.
   * 
   * @param prepared - The new preparedFollow property
   */
  setPreparedFollow: (prepared: boolean) => void;
  /**
   * The function to set the
   * {@link GrammarSetupSlice.preparedFollowMap | preparedFollowMap} property.
   * 
   * @param prepared - The new preparedFollowMap property
   */
  setPreparedFollowMap: (prepared: boolean) => void;
};

/**
 * These are the possible colors for the nodes of the graph (and their edges).
 */
export enum NodeColor {
  // Since we can't import @mui/material/colors here,
  // we just hardcode the hex values
  none = "#9e9e9e", // grey[500],
  thisTurn = "#8c9eff", // indigo.A100,
  lastTurn = "#536dfe", // indigo.A200,
  older = "#1a237e", // indigo[900],
}

/**
 * The node data type for the graph.
 * This allows us to store additional information for each ReactFlow node.
 */
export type NodeData = {
  /**
   * The name of the terminal or nonterminal this node represents.
   */
  name: string;
  /**
   * Whether the node (terminal or nonterminal) is empty or not.
   */
  empty: boolean;
  /**
   * The color of the node.
   */
  color: NodeColor;
  /**
   * The size of the label of the node.
   * 
   * @remarks
   * 
   * This is used for storing the size of the label of group nodes,
   * since we don't want the layout algorithm to place the child nodes
   * on top of the label.
   */
  labelSize?: { width: number; height: number };
};

/**
 * An enum for the different types of edges.
 * 
 * @remarks
 * 
 * The difference between the edge types is the way the edges are drawn.
 */
export enum EdgePathType {
  Straight = "straight",
  Smoothstep = "smoothstep",
  Bezier = "bezier",
}

/**
 * The edge data type for the graph.
 * This allows us to store additional information for each ReactFlow edge.
 */
export type EdgeData = {
  /**
   * The {@link EdgePathType | type} of the edge.
   */
  pathType: EdgePathType;
  /** 
   * Whether this edge connects group nodes or not.
   * 
   * @remarks
   * 
   * Since parent nodes are connected if and only if
   * some of their children are connected, we can hide
   * the edges between the child nodes to reduce clutter.
   */
  isGroupEdge: boolean;
  /**
   * The name of the edge.
   * 
   * @remarks
   * 
   * The name looks like this: "source-name -\> target-name"
   */
  name: string;
};

/**
 * The empty node slice is responsible for the empty graphs variables.
 * 
 * @remarks
 * 
 * The "empty graph" is used in the step of computing the empty attributes
 */
export type EmptyNodeSlice = {
  /**
   * The counter for generating new node ids.
   */
  emptyIdCounter: number;
  /**
   * The node types for the empty graph. These are required by ReactFlow.
   */
  emptyNodeTypes: NodeTypes;
  /**
   * The edge types for the empty graph. These are required by ReactFlow.
   */
  emptyEdgeTypes: EdgeTypes;
  /**
   * Whether the setup of the empty graph is complete or not.
   * 
   * @remarks
   * 
   * The setup is complete if the graph correctly models the
   * empty attribute relations.
   */
  emptySetupComplete: boolean;
  /**
   * The nodes of the empty graph.
   */
  emptyNodes: Node<NodeData>[];
  /**
   * The edges of the empty graph.
   */
  emptyEdges: Edge<EdgeData>[];
  /**
   * The function to generate a new node id.
   * 
   * @returns A new node id
   */
  getEmptyNodeId: () => string;
  /**
   * The function to generate a new edge id.
   * 
   * @returns A new edge id
   */
  getEmptyEdgeId: () => string;
  /**
   * The function to set the
   * {@link EmptyNodeSlice.emptySetupComplete | emptySetupComplete} property.
   * 
   * @param complete - The new emptySetupComplete property
   */
  setEmptySetupComplete: (complete: boolean) => void;
  /**
   * The function to set the
   * {@link EmptyNodeSlice.emptyNodes | emptyNodes} property.
   * 
   * @param nodes - The new node array
   * @param fitView - A function to center the graph in the viewport
   */
  setEmptyNodes: (nodes: Node<NodeData>[], fitView?: () => void) => void;
  /**
   * The function to set the
   * {@link EmptyNodeSlice.emptyEdges | emptyEdges} property.
   * 
   * @param edges - The new edge array
   * @param fitView - A function to center the graph in the viewport
   */
  setEmptyEdges: (edges: Edge<EdgeData>[], fitView?: () => void) => void;
  /**
   * The function to handle changes to the nodes of the empty graph.
   * 
   * @remarks
   * 
   * This is the default function for the onNodeChange event of ReactFlow.
   */
  onEmptyNodesChange: OnNodesChange;
  /**
   * The function to handle changes to the edges of the empty graph.
   * 
   * @remarks
   * 
   * This is the default function for the onEdgeChange event of ReactFlow.
   */
  onEmptyEdgesChange: OnEdgesChange;
  /**
   * The function to handle connections in the empty graph.
   * 
   * @param showSnackbar - A function to display a snackbar message
   */
  onEmptyConnect: (
    showSnackbar: (
      message: string,
      variant: VariantType,
      preventDuplicate: boolean,
    ) => void,
  ) => OnConnect;
  /**
   * The function to toggle the deletable and connectable properties of
   * the empty graph.
   * 
   * @param deletable - Whether the nodes and edges are deletable or not
   * @param connectable - Whether the nodes are connectable or not
   */
  toggleEmptyDeletableAndConnectable: (
    deletable: boolean,
    connectable: boolean,
  ) => void;
  /**
   * The function to toggle a node's {@link NodeData.empty | empty} property
   * 
   * @param nodeId - The id of the node to update
   * @param empty - The new empty property
   */
  updateEmptyNodeAndEdgeEmpty: (nodeId: string, empty: boolean) => void;
  /**
   * The function to update a node's name and empty
   * {@link NodeData | properties}
   * 
   * @remarks
   * 
   * It also updates the nodes edges.
   * 
   * @param nodeId - The id of the node to update
   * @param name - The new name property
   * @param empty - The new empty property
   */
  updateEmptyNodeAndEdges: (
    nodeId: string,
    name: string,
    empty: boolean,
  ) => void;
  /**
   * The function to update the colors of all nodes and edges
   * 
   * @remarks
   * 
   * Since the colors represent the state of the empty algorithm,
   * we need to update the colors when we start the next step of the algorithm.
   */
  updateAllEmptyNodeAndEdgeColors: () => void;
};

/**
 * The empty algorithm slice is responsible for the empty algorithms variables.
 * 
 * @remarks
 * 
 * The empty algorithm is used to compute the empty attributes of the grammar.
 */
export type EmptyAlgorithmSlice = {
  /**
   * A map of nonterminals and whether they are empty or not.
   * 
   * @remarks
   * 
   * This is used to display the progress of the empty algorithm by
   * coloring the grammar nonterminals.
   */
  emptyNonterminalMap: [string, boolean][];
  /**
   * A map of productions and whether they are empty or not.
   * 
   * @remarks
   * 
   * This is used to display the progress of the empty algorithm by
   * coloring the grammar productions.
   */
  emptyProductionMap: [string, boolean][];
  /**
   * Whether the user thinks they have reached a fixpoint in the empty
   * algorithm or not.
   */
  emptyUserFixpoint: boolean;
  /**
   * Whether the empty algorithm actually has reached a fixpoint or not.
   */
  emptyFixpoint: boolean;
  /**
   * The work list of productions that still need to be processed.
   */
  emptyWorkList: Production[];
  /**
   * Whether the empty algorithm is finished or not.
   */
  finishedEmpty: boolean;
  /**
   * The function to set the
   * {@link EmptyAlgorithmSlice.emptyNonterminalMap | emptyNonterminalMap} property.
   * 
   * @param map - The new emptyNonterminalMap
   */
  setEmptyNonterminalMap: (map: [string, boolean][]) => void;
  /**
   * The function to set the
   * {@link EmptyAlgorithmSlice.emptyProductionMap | emptyProductionMap} property.
   * 
   * @param map - The new emptyProductionMap
   */
  setEmptyProductionMap: (map: [string, boolean][]) => void;
  /**
   * The function to set the
   * {@link EmptyAlgorithmSlice.emptyUserFixpoint | emptyUserFixpoint} property.
   * 
   * @param fixpoint - The new emptyUserFixpoint property
   */
  setEmptyUserFixpoint: (fixpoint: boolean) => void;
  /**
   * The function to set the
   * {@link EmptyAlgorithmSlice.emptyFixpoint | emptyFixpoint} property.
   * 
   * @param fixpoint - The new emptyFixpoint property
   */
  setEmptyFixpoint: (fixpoint: boolean) => void;
  /**
   * The function to set the
   * {@link EmptyAlgorithmSlice.emptyWorkList | emptyWorkList} property.
   * 
   * @param workList - The new emptyWorkList property
   */
  setEmptyWorkList: (workList: Production[]) => void;
  /**
   * The function to set the
   * {@link EmptyAlgorithmSlice.finishedEmpty | finishedEmpty} property.
   * 
   * @param finished - The new finishedEmpty property
   */
  setFinishedEmpty: (finished: boolean) => void;
};

/**
 * The first node slice is responsible for the first graphs variables.
 * 
 * @remarks
 * 
 * The "first graph" is used in the step of computing the first sets
 */
export type FirstNodeSlice = {
  /**
   * The counter for generating new node ids.
   */
  firstIdCounter: number;
  /**
   * The node types for the first graph. These are required by ReactFlow.
   */
  firstNodeTypes: NodeTypes;
  /**
   * The edge types for the first graph. These are required by ReactFlow.
   */
  firstEdgeTypes: EdgeTypes;
  /**
   * Whether the setup of the first graph is complete or not.
   * 
   * @remarks
   * 
   * The setup is complete if the graph correctly models the
   * first set relations.
   */
  firstSetupComplete: boolean;
  /**
   * The nodes of the first graph.
   */
  firstNodes: Node<NodeData>[];
  /**
   * The edges of the first graph.
   */
  firstEdges: Edge<EdgeData>[];
  /**
   * The function to generate a new node id.
   * 
   * @returns A new node id
   */
  getFirstNodeId: () => string;
  /**
   * The function to generate a new edge id.
   * 
   * @returns A new edge id
   */
  getFirstEdgeId: () => string;
  /**
   * The function to set the
   * {@link FirstNodeSlice.firstSetupComplete | firstSetupComplete} property.
   * 
   * @param complete - The new firstSetupComplete property
   */
  setFirstSetupComplete: (complete: boolean) => void;
  /**
   * The function to set the
   * {@link FirstNodeSlice.firstNodes | firstNodes} property.
   * 
   * @param nodes - The new node array
   * @param fitView - A function to center the graph in the viewport
   */
  setFirstNodes: (nodes: Node<NodeData>[], fitView?: () => void) => void;
  /**
   * The function to set the
   * {@link FirstNodeSlice.firstEdges | firstEdges} property.
   * 
   * @param edges - The new edge array
   * @param fitView - A function to center the graph in the viewport
   */
  setFirstEdges: (edges: Edge<EdgeData>[], fitView?: () => void) => void;
  /**
   * The function to set the size of the label of a (group) node.
   * 
   * @remarks
   * 
   * The size is used when lay outing the graph. The label size depends on the
   * terminals of the grammar, as such we need to update the label size
   * dynamically.
   * 
   * @param nodeId - The id of the node to update
   * @param size - The new size property
   */
  setFirstLabelSize: (
    nodeId: string,
    size: { width: number; height: number } | undefined,
  ) => void;
  /**
   * The function to handle changes to the nodes of the first graph.
   * 
   * @remarks
   * 
   * This is the default function for the onNodeChange event of ReactFlow.
   */
  onFirstNodesChange: OnNodesChange;
  /**
   * The function to handle changes to the edges of the first graph.
   * 
   * @remarks
   * 
   * This is the default function for the onEdgeChange event of ReactFlow.
   */
  onFirstEdgesChange: OnEdgesChange;
  /**
   * The function to handle connections in the first graph.
   * 
   * @param showSnackbar - A function to display a snackbar message
   */
  onFirstConnect: (
    showSnackbar: (
      message: string,
      variant: VariantType,
      preventDuplicate: boolean,
    ) => void,
  ) => OnConnect;
  /**
   * The function to toggle the deletable and connectable properties of
   * the first graph.
   * 
   * @remarks
   * 
   * Group nodes need to stay deletable, so for them only the connectable
   * property is toggled.
   * 
   * @param deletable - Whether the nodes and edges are deletable or not
   * @param connectable - Whether the nodes are connectable or not
   */
  toggleFirstDeletableAndConnectable: (
    deletable: boolean,
    connectable: boolean,
  ) => void;
  /**
   * The function to set the visibility of the edges between child nodes
   * of the first graph.
   * 
   * @param hidden - Whether the edges are hidden or not
   */
  setFirstNodeEdgesHidden: (hidden: boolean) => void;
};

/**
 * The first algorithm node map is used to keep track of the progress
 * of the first algorithm.
 * 
 * @remarks
 * 
 * Each (group) node (button) has a first algorithm node map.
 * The map keeps track of the incoming first sets, the first set of the node
 * and whether the node is active or not.
 */
export type FirstAlgorithmNodeMap = {
  /**
   * Whether the node (=button) is active or not.
   * 
   * @remarks
   * 
   * A node (button) is disabled if any outgoing node is active.
   */
  active: boolean;
  /**
   * A map of all incoming nodes and their first sets.
   * 
   * @remarks
   * 
   * The first set of a node is undefined if the incoming node is not active.
   * When the incoming node becomes active, it needs to store its first set
   * in the incoming first map of the target node (this node).
   * 
   */
  incomingFirst: Map<string, string[] | undefined>;
  /**
   * The first set of this node. Needs to be updated by an incoming node
   * if it changes its incoming first entry.
   */
  first: Set<string>;
};

/**
 * The first algorithm slice is responsible for the first algorithms variables.
 * 
 * @remarks
 * 
 * The first algorithm is used to compute the first sets of the grammar.
 */
export type FirstAlgorithmSlice = {
  /**
   * Whether the first algorithm is finished or not.
   */
  finishedFirst: boolean;
  /**
   * A map of all nodes (ids) and their firstAlgorithmNodeMap.
   */
  firstNodeMap: Map<string, FirstAlgorithmNodeMap>;
  /**
   * The function to set the
   * {@link FirstAlgorithmSlice.finishedFirst | finishedFirst} property.
   * 
   * @param finished - The new finishedFirst property
   */
  setFinishedFirst: (finished: boolean) => void;
  /**
   * The function to set the
   * {@link FirstAlgorithmSlice.firstNodeMap | firstNodeMap} property.
   * 
   * @param map - The new firstNodeMap
   */
  setFirstNodeMap: (map: Map<string, FirstAlgorithmNodeMap>) => void;
};

/**
 * The follow node slice is responsible for the follow graphs variables.
 * 
 * @remarks
 * 
 * The "follow graph" is used in the step of computing the follow sets
 */
export type FollowNodeSlice = {
  /**
   * The counter for generating new node ids.
   */
  followIdCounter: number;
  /**
   * The node types for the follow graph. These are required by ReactFlow.
   */
  followNodeTypes: NodeTypes;
  /**
   * The edge types for the follow graph. These are required by ReactFlow.
   */
  followEdgeTypes: EdgeTypes;
  /**
   * Whether the setup of the follow graph is complete or not.
   * 
   * @remarks
   * 
   * The setup is complete if the graph correctly models the
   * follow set relations.
   */
  followSetupComplete: boolean;
  /**
   * The nodes of the follow graph.
   */
  followNodes: Node<NodeData>[];
  /**
   * The edges of the follow graph.
   */
  followEdges: Edge<EdgeData>[];
  /**
   * The function to generate a new node id.
   * 
   * @returns A new node id
   */
  getFollowNodeId: () => string;
  /**
   * The function to generate a new edge id.
   * 
   * @returns A new edge id
   */
  getFollowEdgeId: () => string;
  /**
   * The function to set the
   * {@link FollowNodeSlice.followSetupComplete | followSetupComplete} property.
   * 
   * @param complete - The new followSetupComplete property
   */
  setFollowSetupComplete: (complete: boolean) => void;
  /**
   * The function to set the
   * {@link FollowNodeSlice.followNodes | followNodes} property.
   * 
   * @param nodes - The new node array
   * @param fitView - A function to center the graph in the viewport
   */
  setFollowNodes: (nodes: Node<NodeData>[], fitView?: () => void) => void;
  /**
   * The function to set the
   * {@link FollowNodeSlice.followEdges | followEdges} property.
   * 
   * @param edges - The new edge array
   * @param fitView - A function to center the graph in the viewport
   */
  setFollowEdges: (edges: Edge<EdgeData>[], fitView?: () => void) => void;
  /**
   * The function to set the size of the label of a (group) node.
   * 
   * @remarks
   * 
   * The size is used when lay outing the graph. The label size depends on the
   * terminals of the grammar, as such we need to update the label size
   * dynamically.
   * 
   * @param nodeId - The id of the node to update
   * @param size - The new size property
   */
  setFollowLabelSize: (
    nodeId: string,
    size: { width: number; height: number } | undefined,
  ) => void;
  /**
   * The function to handle changes to the nodes of the follow graph.
   * 
   * @remarks
   * 
   * This is the default function for the onNodeChange event of ReactFlow.
   */
  onFollowNodesChange: OnNodesChange;
  /**
   * The function to handle changes to the edges of the follow graph.
   * 
   * @remarks
   * 
   * This is the default function for the onEdgeChange event of ReactFlow.
   */
  onFollowEdgesChange: OnEdgesChange;
  /**
   * The function to handle connections in the follow graph.
   * 
   * @param showSnackbar - A function to display a snackbar message
   */
  onFollowConnect: (
    showSnackbar: (
      message: string,
      variant: VariantType,
      preventDuplicate: boolean,
    ) => void,
  ) => OnConnect;
  /**
   * The function to toggle the deletable and connectable properties of
   * the follow graph.
   * 
   * @param deletable - Whether the nodes and edges are deletable or not
   * @param connectable - Whether the nodes are connectable or not
   */
  toggleFollowDeletableAndConnectable: (
    deletable: boolean,
    connectable: boolean,
  ) => void;
  /**
   * The function to set the visibility of the edges between child nodes
   * of the follow graph.
   * 
   * @param hidden - Whether the edges are hidden or not
   */
  setFollowNodeEdgesHidden: (hidden: boolean) => void;
  /**
   * 
   * The function to set the expandParent property of all reactflow
   * (follow) nodes.
   * 
   * @remarks
   * 
   * The expandParent property is used to expand the parent node of a node
   * if the node is dragged outside of the parent node.
   * 
   * @param expand - Whether the parent nodes should be expanded or not
   */
  setExpandFollowParent: (expand: boolean) => void;
};

/**
 * The follow algorithm node map is used to keep track of the progress
 * of the follow algorithm.
 * 
 * @remarks
 * 
 * Each (group) node (button) has a follow algorithm node map.
 * The map keeps track of the incoming follow sets, the follow set of the node
 * and whether the node is active or not.
 */
export type FollowAlgorithmNodeMap = {
  /**
   * Whether the node (=button) is active or not.
   * 
   * @remarks
   * 
   * A node (button) is disabled if any outgoing node is active.
   */
  active: boolean;
  /**
   * A map of all incoming nodes and their follow sets.
   * 
   * @remarks
   * 
   * The follow set of a node is undefined if the incoming node is not active.
   * When the incoming node becomes active, it needs to store its follow
   * (or F_epsilon) set in the incoming follow map of the target node
   * (this node).
   * 
   */
  incomingFollow: Map<string, string[] | undefined>;
  /**
   * The follow (or F_epsilon) set of this node.
   * Needs to be updated by an incoming node
   * if it changes its incoming follow entry.
   */
  follow: Set<string>;
};

/**
 * The follow algorithm slice is responsible for the follow algorithms variables.
 * 
 * @remarks
 * 
 * The follow algorithm is used to compute the follow sets of the grammar.
 */
export type FollowAlgorithmSlice = {
  /**
   * Whether the follow algorithm is finished or not.
   */
  finishedFollow: boolean;
  /**
   * A map of all nodes (ids) and their followAlgorithmNodeMap.
   */
  followNodeMap: Map<string, FollowAlgorithmNodeMap>;
  /**
   * The function to set the
   * {@link FollowAlgorithmSlice.finishedFollow | finishedFollow} property.
   * 
   * @param finished - The new finishedFollow property
   */
  setFinishedFollow: (finished: boolean) => void;
  /**
   * The function to set the
   * {@link FollowAlgorithmSlice.followNodeMap | followNodeMap} property.
   * 
   * @param map - The new followNodeMap
   */
  setFollowNodeMap: (map: Map<string, FollowAlgorithmNodeMap>) => void;
};
