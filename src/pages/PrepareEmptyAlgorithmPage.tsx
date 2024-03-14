import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

import { Edge, MarkerType, Node } from "reactflow";

import { VariantType, useSnackbar } from "notistack";

import {
  EdgeData,
  EdgePathType,
  EmptyNodeSlice,
  FirstNodeSlice,
  FollowNodeSlice,
  GrammarSlice,
  NodeColor,
  NodeData,
} from "../types";

import useBoundStore from "../store/store";
import { shallow } from "zustand/shallow";

import { useLayoutedElements } from "../utils";

/**
 * The props for the {@link PrepareEmptyAlgorithmPage} component.
 * 
 * @param graphCanvas - The reactflow canvas to display the grammar.
 */
export interface Props {
  graphCanvas: JSX.Element;
}

/**
 * This is the fourth page of the webtutor.
 * The user adds the nodes and edges to the graph to model
 * the dependency graph for the empty set computation.
 * 
 * @param graphCanvas - The reactflow canvas to display the grammar.
 */
function PrepareEmptyAlgorithmPage({ graphCanvas }: Props) {
  const selector = (
    state: GrammarSlice & EmptyNodeSlice & FirstNodeSlice & FollowNodeSlice,
  ) => ({
    // GrammarSlice
    epsilon: state.epsilon,
    productions: state.productions,
    nonTerminals: state.nonTerminals,
    terminals: state.terminals,
    // EmptyNodeSlice
    emptySetupComplete: state.emptySetupComplete,
    emptyNodes: state.emptyNodes,
    emptyEdges: state.emptyEdges,
    getEmptyNodeId: state.getEmptyNodeId,
    getEmptyEdgeId: state.getEmptyEdgeId,
    setEmptySetupComplete: state.setEmptySetupComplete,
    setEmptyNodes: state.setEmptyNodes,
    setEmptyEdges: state.setEmptyEdges,
    toggleEmptyDeletableAndConnectable:
      state.toggleEmptyDeletableAndConnectable,
    // FirstNodeSlice
    firstNodes: state.firstNodes,
    firstEdges: state.firstEdges,
    setFirstNodes: state.setFirstNodes,
    setFirstEdges: state.setFirstEdges,
    // FollowNodeSlice
    followNodes: state.followNodes,
    followEdges: state.followEdges,
    setFollowNodes: state.setFollowNodes,
    setFollowEdges: state.setFollowEdges,
  });
  const {
    // GrammarSlice
    epsilon,
    productions,
    nonTerminals,
    terminals,
    // EmptyNodeSlice
    emptySetupComplete,
    emptyNodes,
    emptyEdges,
    getEmptyNodeId,
    getEmptyEdgeId,
    setEmptySetupComplete,
    setEmptyNodes,
    setEmptyEdges,
    toggleEmptyDeletableAndConnectable,
    // FirstNodeSlice
    firstNodes,
    firstEdges,
    setFirstNodes,
    setFirstEdges,
    // FollowNodeSlice
    followNodes,
    followEdges,
    setFollowNodes,
    setFollowEdges,
  } = useBoundStore(selector, shallow);

  const { enqueueSnackbar } = useSnackbar();
  /**
   * Function to display a notification to the user.
   * 
   * @param message - The message to be displayed.
   * @param variant - The variant of the notification. Could be success, error, warning, info, or default.
   * @param preventDuplicate - If true, the notification will not be displayed if it is already displayed.
   */
  const showSnackbar = (
    message: string,
    variant: VariantType,
    preventDuplicate: boolean,
  ) => {
    enqueueSnackbar(message, {
      variant,
      preventDuplicate,
    });
  };

  const { layoutElements } = useLayoutedElements(
    emptyNodes,
    emptyEdges,
    setEmptyNodes,
    setEmptyEdges,
    firstNodes,
    firstEdges,
    setFirstNodes,
    setFirstEdges,
    followNodes,
    followEdges,
    setFollowNodes,
    setFollowEdges,
  );

  /**
   * Function to check if the graph is correct.
   * 
   * @remarks
   * 
   * The function checks if the graph is correct by checking if all nodes and
   * edges are there and if there are no unnecessary nodes and edges.
   * If the graph is correct, a success notification is displayed.
   * If the graph is not correct, the user is notified about the first error
   * that was found.
   * 
   * @returns True if the graph is correct, false otherwise.
   */
  const check = () => {
    // check if there are duplicate nodes
    const nodeMap = new Map<string, boolean>();
    for (const node of emptyNodes) {
      if (nodeMap.has(node.data.name)) {
        // node exists multiple times
        if (import.meta.env.DEV) {
          console.error("Node exists multiple times", node);
        }
        showSnackbar(
          "Node " + node.data.name + " exists multiple times!",
          "error",
          true,
        );
        return false;
      } else {
        nodeMap.set(node.data.name, false);
      }
    }
    const symbols =
      epsilon.references > 0
        ? [epsilon, ...terminals, ...nonTerminals]
        : [...terminals, ...nonTerminals];
    // check if all symbols have a node
    for (const printable of symbols) {
      const entry = nodeMap.get(printable.name);
      if (entry === undefined) {
        // printable does not exist in node list
        if (import.meta.env.DEV) {
          console.error("Printable does not exist in node list", printable);
        }
        showSnackbar(printable.name + " has no node!", "error", true);
        return false;
      } else {
        if (entry) {
          // printable exists multiple times
          // this should not be possible
          if (import.meta.env.DEV) {
            console.error(
              "Error Code 30f30a: Node is already accounted for",
              printable,
            );
            showSnackbar(
              "Error Code 30f30a: Please contact the developer!",
              "error",
              true,
            );
            return false;
          }
        } else {
          nodeMap.set(printable.name, true);
        }
      }
    }
    // check if there are nodes that should not be there
    const unnecessaryNode = [...nodeMap].find(([, value]) => !value);
    if (unnecessaryNode !== undefined) {
      // there are nodes that should not be there
      if (import.meta.env.DEV) {
        console.error("There are nodes that should not be there", nodeMap);
      }
      showSnackbar(unnecessaryNode[0] + " is unnecessary!", "error", true);
      return false;
    }

    // check if there are duplicate edges
    const edgeMap = new Map<string, boolean>();
    for (const edge of emptyEdges) {
      if (!edge.data) {
        if (import.meta.env.DEV) {
          console.error("Error Code bb0f8a: Edge has no data", edge);
        }
        showSnackbar(
          "Error Code bb0f8a: Please contact the developer!",
          "error",
          true,
        );
        return false;
      }
      if (edgeMap.has(edge.data.name)) {
        // edge exists multiple times
        if (import.meta.env.DEV) {
          console.error("Edge exists multiple times", edge);
        }
        showSnackbar(
          "Edge " + edge.data.name + " exists multiple times!",
          "error",
          true,
        );
        return false;
      } else {
        edgeMap.set(edge.data.name, false);
      }
    }
    // check if all productions have their edges
    for (const production of productions) {
      for (const symbol of production.rightSide) {
        const edgeName = symbol.name + "->" + production.leftSide.name;
        const entry = edgeMap.get(edgeName);
        if (entry === undefined) {
          // edge does not exist in edge list
          if (import.meta.env.DEV) {
            console.error(
              "Edge does not exist in edge list",
              edgeName,
              edgeMap,
              emptyEdges,
            );
          }
          showSnackbar("Edge " + edgeName + " does not exist!", "error", true);
          return false;
        } else {
          if (!entry) {
            edgeMap.set(edgeName, true);
          }
        }
      }
    }
    // check if there are edges that should not be there
    const unnecessaryEdge = [...edgeMap].find(([, value]) => !value);
    if (unnecessaryEdge !== undefined) {
      // there are edges that should not be there
      if (import.meta.env.DEV) {
        console.error("There are edges that should not be there", edgeMap);
      }
      showSnackbar(unnecessaryEdge[0] + " is unnecessary!", "error", true);
      return false;
    }

    showSnackbar("Correct, well done!", "success", true);

    return true;
  };

  /**
   * Function to solve the graph.
   * 
   * @remarks
   * 
   * The function adds the nodes and edges to the graph to model
   * the dependency graph for the empty set computation.
   * The function then calls the layout function.
   */
  const solve = () => {
    const newNodes: Node<NodeData>[] = [];
    const newEdges: Edge<EdgeData>[] = [];

    // only add epsilon if we actually need it
    if (epsilon.references > 0) {
      newNodes.push({
        id: getEmptyNodeId(),
        type: "empty",
        data: {
          name: epsilon.name,
          empty: epsilon.empty,
          color: epsilon.empty ? NodeColor.thisTurn : NodeColor.none,
        },
        position: { x: 0, y: 0 },
      });
    }
    // add all nonterminals
    for (const nonTerminal of nonTerminals) {
      newNodes.push({
        id: getEmptyNodeId(),
        type: "empty",
        data: {
          name: nonTerminal.name,
          empty: nonTerminal.empty,
          color: nonTerminal.empty ? NodeColor.thisTurn : NodeColor.none,
        },
        position: { x: 0, y: 0 },
      });
    }
    // add all terminals
    for (const terminal of terminals) {
      newNodes.push({
        id: getEmptyNodeId(),
        type: "empty",
        data: {
          name: terminal.name,
          empty: terminal.empty,
          color: terminal.empty ? NodeColor.thisTurn : NodeColor.none,
        },
        position: { x: 0, y: 0 },
      });
    }

    // add all edges
    // We want an edge from A to B if there is a production
    // of form B -> ... A ...
    // This is because if A (and the rest of the right side) is empty,
    // then this makes B empty as well.
    for (const production of productions) {
      for (const symbol of production.rightSide) {
        const edgeName = symbol.name + "->" + production.leftSide.name;
        // We only want to add one edge between two nodes, so we check if it
        // already exists
        if (!newEdges.some((e) => e.data?.name === edgeName)) {
          const source = newNodes.find((n) => n.data.name === symbol.name);
          const target = newNodes.find(
            (n) => n.data.name === production.leftSide.name,
          );
          if (!source || !target) {
            if (import.meta.env.DEV) {
              console.error("Error Code 8f9a40: Please contact the developer!");
            }
            showSnackbar(
              "Error Code 8f9a40: Please contact the developer!",
              "error",
              true,
            );
            return false;
          }
          newEdges.push({
            id: getEmptyEdgeId(),
            type: "floating",
            source: source.id,
            target: target.id,
            sourceNode: source,
            targetNode: target,
            data: {
              pathType: EdgePathType.Straight,
              isGroupEdge: false,
              name: edgeName,
            },
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              orient: "auto",
              color: symbol.empty ? NodeColor.thisTurn : NodeColor.none,
            },
            style: {
              strokeWidth: 2,
              stroke: symbol.empty ? NodeColor.thisTurn : NodeColor.none,
            },
          });
        }
      }
    }

    layoutElements(
      "provided",
      undefined,
      newNodes,
      newEdges,
      setEmptyNodes,
      setEmptyEdges,
    );
  };

  return (
    <>
      {/* left side, grammar information */}
      <div className="mr-1 h-full w-1/2 overflow-auto rounded-lg border-2 border-solid p-2 text-left sm:w-1/3">
        <div className="flex h-full flex-col items-center justify-between">
          <div className="flex flex-col items-center">
            <p>The Nonterminals of the grammar are:</p>
            <ul className="commaList m-0 list-none p-0 before:mr-1 before:content-['𝑁_=_{'] after:ml-1 after:content-['}']">
              {nonTerminals.map((nonterminal, index) => (
                <li key={index} className="inline">
                  {nonterminal.representation}
                </li>
              ))}
            </ul>
            <p>The Terminals of the grammar are:</p>
            <ul className="commaList m-0 list-none p-0 before:mr-1 before:content-['𝑇_=_{'] after:ml-1 after:content-['}']">
              {terminals.map((terminal, index) => (
                <li key={index} className="inline">
                  {terminal.representation}
                </li>
              ))}
            </ul>
            <p>The Productions of the grammar are:</p>
            <ul className="commaList listSpace m-0 mb-2 list-none p-0 text-left before:mr-1 before:content-['𝑃_=_{'] after:ml-1 after:content-['}']">
              {productions.map((production, index) => (
                <li key={index} className="ml-4">
                  {production.numberedRepresentation()}
                </li>
              ))}
            </ul>
          </div>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={{ xs: 1, md: 2 }}
            className="pb-1"
          >
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                // resetting the graph means that we simply
                // remove all nodes and edges
                setEmptyNodes([]);
                setEmptyEdges([]);
              }}
              disabled={emptySetupComplete}
            >
              Reset Graph
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={() => {
                solve();
              }}
              disabled={emptySetupComplete}
            >
              Show Solution
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                if (check()) {
                  // now that the graph is correct, we don't want the user
                  // to modify it anymore
                  toggleEmptyDeletableAndConnectable(false, false);
                  // we need to set this to true so the user can
                  // navigate to the next page
                  setEmptySetupComplete(true);
                }
              }}
              disabled={emptySetupComplete}
            >
              Check Graph
            </Button>
          </Stack>
        </div>
      </div>
      {/* right side, reactflow canvas */}
      <div className="h-full w-1/2 rounded-lg border-2 border-solid p-2 sm:w-2/3">
        {graphCanvas}
      </div>
    </>
  );
}

export default PrepareEmptyAlgorithmPage;
