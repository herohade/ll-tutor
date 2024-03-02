import { styled } from "@mui/material";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";

import { Edge, MarkerType, Node, useReactFlow } from "reactflow";

import { VariantType, useSnackbar } from "notistack";

import { useState } from "react";

import { shallow } from "zustand/shallow";
import useBoundStore from "../store/store";

import { groupNodesBySCC, useLayoutedElements } from "../utils";

import {
  EdgeData,
  EdgePathType,
  EmptyAlgorithmSlice,
  EmptyNodeSlice,
  FirstNodeSlice,
  FollowNodeSlice,
  GrammarSlice,
  NodeColor,
  NodeData,
  Nonterminal,
} from "../types";

// this import is only required for a tsdoc @link tag:
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { HeaderComponent } from "../components";

type Props = {
  graphCanvas: JSX.Element;
};

// The minimum time a loading indicator should be shown in ms
// We need this since it would look weird if it just flashes for a few ms,
// if the operation is very fast.
const minTimeout = 500;

// this creates a span component that has the sx prop (for styling)
const StyledSpan = styled("span")({});

/**
 * This is the sixth page of the webtutor.
 * It shows the user the grammer, color coded regarding the empty
 * attributes. The user has to group the FirstNodes into Strongly Connected
 * Components (group nodes). These are used to compute the Fε-sets
 * in the next step.
 * 
 * @param graphCanvas - The reactflow canvas to display the grammar.
 */
function PrepareFirstAlgorithmPage({ graphCanvas }: Props) {
  const selector = (
    state: GrammarSlice &
      EmptyNodeSlice &
      EmptyAlgorithmSlice &
      FirstNodeSlice &
      FollowNodeSlice,
  ) => ({
    // GrammarSlice
    epsilon: state.epsilon,
    productions: state.productions,
    nonTerminals: state.nonTerminals,
    terminals: state.terminals,
    // EmptyNodeSlice
    emptyNodes: state.emptyNodes,
    emptyEdges: state.emptyEdges,
    setEmptyNodes: state.setEmptyNodes,
    setEmptyEdges: state.setEmptyEdges,
    // EmptyAlgorithmSlice
    emptyNonterminalMap: state.emptyNonterminalMap,
    // FirstNodeSlice
    firstSetupComplete: state.firstSetupComplete,
    firstNodes: state.firstNodes,
    firstEdges: state.firstEdges,
    getFirstNodeId: state.getFirstNodeId,
    getFirstEdgeId: state.getFirstEdgeId,
    setFirstSetupComplete: state.setFirstSetupComplete,
    setFirstNodes: state.setFirstNodes,
    setFirstEdges: state.setFirstEdges,
    toggleFirstDeletableAndConnectable:
      state.toggleFirstDeletableAndConnectable,
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
    emptyNodes,
    emptyEdges,
    setEmptyNodes,
    setEmptyEdges,
    // EmptyAlgorithmSlice
    emptyNonterminalMap,
    // FirstNodeSlice
    firstSetupComplete,
    firstNodes,
    firstEdges,
    getFirstNodeId,
    getFirstEdgeId,
    setFirstSetupComplete,
    setFirstNodes,
    setFirstEdges,
    toggleFirstDeletableAndConnectable,
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
    // variant could be success, error, warning, info, or default
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
   * Function to center the graph in the viewport.
   * We can pass this to setEdges/Nodes functions to center the graph
   * after adding new elements.
   */
  const { fitView } = useReactFlow();

  // resetting, solving and checking the graph takes some time,
  // so we need to show the user a loading indicator
  const [loading, setLoading] = useState<
    "reset" | "solve" | "check" | undefined
  >(undefined);
  // Since we don't want flashing loading indicators, we show them for at least
  // minTimeout ms. This variable stores whether the timeout has passed
  const [loadingTimeout, setLoadingTimeout] = useState<
    "reset" | "solve" | "check" | undefined
  >(undefined);

  /**
   * Function to reset the graph to its initial state.
   * 
   * @remarks
   * 
   * In the beginning the graph should contain a FirstNode for each
   * (Non)terminal and a FirstNode for each leaf ("\{terminal\}").
   * 
   * Since the user can't add nodes themselves, these should not be
   * deletable.
   * 
   * @privateRemarks
   * 
   * This is copied from prepareFirstAlgorithm() in {@link HeaderComponent}.
   */
  const reset = () => {
    const newFirstNodes: Node<NodeData>[] = [];
    const newFirstEdges: Edge<EdgeData>[] = [];

    // add a new FirstNode for each (Non)terminal
    for (const node of emptyNodes.filter((n) => n.data.name !== "ε")) {
      const newNode: Node<NodeData> = {
        id: getFirstNodeId(),
        type: "first",
        position: node.position,
        deletable: false,
        data: {
          ...node.data,
        },
      };
      newFirstNodes.push(newNode);
    }

    // add a FirstNode {t} for each terminal t
    for (const terminal of terminals) {
      const terminalNode: Node<NodeData> | undefined = newFirstNodes.find(
        (n) => n.data.name === terminal.name,
      );
      if (!terminalNode) {
        if (import.meta.env.DEV) {
          console.error(
            "Error Code 60c841: Terminal not found among newFirstNodes!",
            terminal,
          );
        }
        return;
      }
      const nodeId = getFirstNodeId();
      const nodeName = `{${terminal.name}}`;
      const newNode: Node<NodeData> = {
        id: nodeId,
        type: "first",
        position: { // this is eyeballed, we just hope this is a good position
          x: terminalNode.position.x,
          y: terminalNode.position.y - (terminalNode.height ?? 50) - 50,
        },
        deletable: false,
        data: {
          name: nodeName,
          empty: false,
          color: NodeColor.none,
        },
      };
      const edgeName = nodeName + "->" + terminalNode.data.name;
      const newEdge: Edge<EdgeData> = {
        id: getFirstEdgeId(),
        type: "floating",
        source: nodeId,
        target: terminalNode.id,
        sourceNode: newNode,
        targetNode: terminalNode,
        deletable: false,
        data: {
          pathType: EdgePathType.Straight,
          isGroupEdge: false,
          name: edgeName,
        },
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          orient: "auto",
          color: NodeColor.none,
        },
        style: {
          strokeWidth: 2,
          stroke: NodeColor.none,
        },
      };
      newFirstNodes.push(newNode);
      newFirstEdges.push(newEdge);
    }

    setFirstNodes(newFirstNodes);
    setFirstEdges(newFirstEdges, fitView);
  };

  /**
   * Function to find the missing edges of the graph.
   * It also filters wrong ones and removes all group nodes.
   * This is the first step of solving the graph. The second step being
   * the grouping into Strongly Connected Components.
   * 
   * @remarks
   * 
   * This function filters out any user generated edges and nodes
   * (the user can only add group nodes) and computes which edges are missing.
   * 
   * @returns An object containing the auto generated nodes and edges, and the missing edges.
   */
  const addMissing = () => {
    // filter out any user generated nodes (the user can only add group nodes)
    const setUpNodes = firstNodes
      .filter((node) => node.type === "first")
      .map((node) => {
        // If the node was group inside a groupNode, we need to undo
        // the sides-effects of grouping.
        if (node.parentNode !== undefined) {
          const parentNode = firstNodes.find(
            (parentNode) => parentNode.id === node.parentNode,
          );
          if (parentNode === undefined) {
            if (import.meta.env.DEV) {
              console.error(
                "Error Code 58571d: Node not found",
                node,
                firstNodes,
              );
            }
            return node;
          }
          return {
            ...node,
            position: {
              x: parentNode.position.x + node.position.x,
              y: parentNode.position.y + node.position.y,
            },
            parentNode: undefined,
            extent: undefined,
          };
        }
        return node;
      });
    // Filter out any user generated edges.
    // In theory it should be enough to filter for deleteable,
    // but the rest is a sanity check.
    const setUpEdges = firstEdges.filter(
      (edge) =>
        edge.deletable === false &&
        setUpNodes.some((node) => node.id === edge.source) &&
        setUpNodes.some((node) => node.id === edge.target),
    );
    // Compute the missing edges.
    const missingEdgesSet = new Set<string>();
    // We need an edge if the source symbol contributes
    // to the targets Fε-set.
    for (const production of productions) {
      let empty = true;
      let i = 0;
      // This adds all symbols from the right side of the production,
      // where all symbols left of it are empty. (without duplicates)
      while (empty && i < production.rightSide.length) {
        const symbol = production.rightSide[i];
        if (symbol.name === "ε") {
          break;
        }
        missingEdgesSet.add(symbol.name + "->" + production.leftSide.name);
        empty = symbol.empty;
        i++;
      }
    }
    const missingEdges: Edge<EdgeData>[] = Array.from(missingEdgesSet).map(
      (edgeName) => {
        const id = getFirstEdgeId();
        const sourceNode = setUpNodes.find(
          (node) => node.data.name === edgeName.split("->")[0],
        );
        const targetNode = setUpNodes.find(
          (node) => node.data.name === edgeName.split("->")[1],
        );
        if (sourceNode === undefined || targetNode === undefined) {
          if (import.meta.env.DEV) {
            console.error(
              "Error Code 83e442: Node not found",
              edgeName,
              sourceNode,
              targetNode,
              setUpNodes,
            );
          }
          showSnackbar(
            "Error Code 83e442: Please contact the developer!",
            "error",
            true,
          );
          throw new Error("Error Code 83e442: Please contact the developer!");
        }
        // This should always be false but it is a sanity check.
        const isGroupEdge =
          sourceNode.type === "group" || targetNode.type === "group";
        return {
          id: id,
          type: "floating",
          source: sourceNode.id,
          target: targetNode.id,
          sourceNode: sourceNode,
          targetNode: targetNode,
          deletable: true,
          data: {
            pathType: EdgePathType.Straight,
            isGroupEdge: isGroupEdge,
            name: edgeName,
          },
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            orient: "auto",
            color: NodeColor.none,
          },
          style: {
            strokeWidth: 2,
            stroke: NodeColor.none,
          },
        } as Edge<EdgeData>;
      },
    );
    return { setUpNodes, setUpEdges, missingEdges };
  };

  /**
   * Function to check if the graph is correct.
   * 
   * @remarks
   * 
   * This function first generates a correct graph and then compares it
   * to the user's graph.
   * It then shows a notification to the user if the graph is correct,
   * or, if not, displays the first mistake found.
   * 
   * @returns True if the graph is correct, false otherwise.
   */
  const check = () => {
    // First we generate the solution
    const { setUpNodes, setUpEdges, missingEdges } = addMissing();
    const { nodes, edges } = groupNodesBySCC(
      "first",
      setUpNodes,
      [...setUpEdges, ...missingEdges],
      getFirstNodeId,
      getFirstEdgeId,
    );
    if (import.meta.env.DEV) {
      console.log("new nodes and edges after scc:", nodes, edges);
    }
    // Now we compare the solution to the users graph.
    // Which solution nodes does the user not have?
    const missingSolutionNodes = nodes.filter(
      (node) =>
        !firstNodes.some((firstNode) => {
          if (
            firstNode.type === node.type &&
            firstNode.data.name === node.data.name
          ) {
            if (node.type === "first") {
              if (firstNode.parentNode && node.parentNode) {
                const firstParentNode = firstNodes.find(
                  (n) => n.id === firstNode.parentNode,
                );
                const parentNode = nodes.find((n) => n.id === node.parentNode);
                if (firstParentNode && parentNode) {
                  return firstParentNode.data.name === parentNode.data.name;
                }
              }
            } else {
              if (node.type === "group") {
                return true;
              }
            }
          }
          return false;
        }),
    );
    // Which solution edges does the user not have?
    const missingSolutionEdges = edges.filter(
      (edge) =>
        !firstEdges.some((firstEdge) => {
          return (
            firstEdge.data &&
            edge.data &&
            firstEdge.data.name === edge.data.name
          );
        }),
    );
    // If the user is not missing anything and has the same
    // number of edges and nodes, the graph should be correct.
    if (
      missingSolutionNodes.length === 0 &&
      missingSolutionEdges.length === 0 &&
      nodes.length === firstNodes.length &&
      edges.length === firstEdges.length
    ) {
      showSnackbar("Correct, well done!", "success", true);
      return true;
    }
    // notify the user of a missing node
    if (missingSolutionNodes.length > 0) {
      if (import.meta.env.DEV) {
        console.log(
          missingSolutionNodes,
          "solutionNodes",
          nodes,
          "userNodes",
          firstNodes,
        );
      }
      showSnackbar(
        "You are missing a node in your graph: " +
          missingSolutionNodes[0].data.name,
        "error",
        true,
      );
      return false;
    }
    // notify the user of a missing edge
    if (missingSolutionEdges.length > 0) {
      if (import.meta.env.DEV) {
        console.log(
          missingSolutionEdges,
          "solutionEdges",
          edges,
          "userEdges",
          firstEdges,
        );
      }
      showSnackbar(
        "You are missing an edge in your graph: " +
          missingSolutionEdges[0].data?.name,
        "error",
        true,
      );
      return false;
    }
    // If there is a mistake but all nodes and edges are accounted for
    // there must be too many.
    // Find the unnecessary nodes.
    const unnecessaryUserNodes = firstNodes.filter(
      (firstNode) =>
        !nodes.find((node) => {
          if (
            node.type === firstNode.type &&
            node.data.name === firstNode.data.name
          ) {
            if (firstNode.type === "first") {
              if (node.parentNode && firstNode.parentNode) {
                const parentNode = nodes.find((n) => n.id === node.parentNode);
                const firstParentNode = firstNodes.find(
                  (n) => n.id === firstNode.parentNode,
                );
                if (firstParentNode && parentNode) {
                  return firstParentNode.data.name === parentNode.data.name;
                }
              }
            } else {
              if (node.type === "group") {
                return true;
              }
            }
          }
          return false;
        }),
    );
    // Find the unnecessary edges.
    const unnecessaryUserEdges = firstEdges.filter(
      (firstEdge) =>
        !edges.find((edge) => {
          return (
            firstEdge.data &&
            edge.data &&
            firstEdge.data.name === edge.data.name
          );
        }),
    );
    // If we still did not find a mistake, we panic because this should
    // not be possible
    if (
      unnecessaryUserNodes.length === 0 &&
      unnecessaryUserEdges.length === 0
    ) {
      if (import.meta.env.DEV) {
        console.error(
          "Error Code 43db7d: Found no unnecessary nodes or edges when there should have been some:",
          unnecessaryUserNodes,
          unnecessaryUserEdges,
        );
      }
      return false;
    }
    // notify the user of an unnecessary node
    if (unnecessaryUserNodes.length > 0) {
      if (import.meta.env.DEV) {
        console.log(
          unnecessaryUserNodes,
          "userNodes",
          firstNodes,
          "solutionNodes",
          nodes,
        );
      }
      showSnackbar(
        "You have an unnecessary node in your graph: " +
          unnecessaryUserNodes[0].data.name,
        "error",
        true,
      );
      return false;
    }
    // notify the user of an unnecessary edge
    if (unnecessaryUserEdges.length > 0) {
      if (import.meta.env.DEV) {
        console.log(
          unnecessaryUserEdges,
          "userEdges",
          firstEdges,
          "solutionEdges",
          edges,
        );
      }
      showSnackbar(
        "You have an unnecessary edge in your graph: " +
          unnecessaryUserEdges[0].data?.name,
        "error",
        true,
      );
      return false;
    }
    // this should be unreachable
    return false;
  };

  return (
    <>
      {/* left side, grammar description and information */}
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
                  <span>
                    {production.leftSide.representation + " => "}
                    {production.rightSide.map((v, i) => (
                      <StyledSpan
                        key={v.name + i}
                        sx={{
                          color:
                            v instanceof Nonterminal
                              ? emptyNonterminalMap.find(
                                  ([n]) => n === v.name,
                                )?.[1]
                                ? "empty.text"
                                : ""
                              : v.name === epsilon.name
                                ? "empty.text"
                                : "",
                        }}
                      >
                        {v.representation + " "}
                      </StyledSpan>
                    ))}
                    {production.uppercaseNumber}
                  </span>
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
                // Since resetting the graph can take some time
                // we show the user a loading indicator
                setLoading("reset");
                setLoadingTimeout("reset");
                // this makes sure we show the loading indicator for
                // at least minTimeout ms
                setTimeout(() => {
                  setLoadingTimeout(undefined);
                }, minTimeout);

                // now we reset
                reset();

                // once we are finished we remove the loading indicator
                // (or wait if the minimum time is not over)
                setLoading(undefined);
              }}
              disabled={
                firstSetupComplete ||
                loading !== undefined ||
                loadingTimeout !== undefined
              }
            >
              {(loading === "reset" || loadingTimeout === "reset") && (
                <CircularProgress
                  size={24}
                  sx={{
                    color: "inherit",
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    marginTop: "-12px",
                    marginLeft: "-12px",
                  }}
                />
              )}
              Reset Graph
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={() => {
                // Since solving the graph can take some time
                // we show the user a loading indicator
                setLoading("solve");
                setLoadingTimeout("solve");
                // this makes sure we show the loading indicator for
                // at least minTimeout ms
                setTimeout(() => {
                  setLoadingTimeout(undefined);
                }, minTimeout);

                // Now we remove the user generated nodes and edges
                // and add the required edges
                const { setUpNodes, setUpEdges, missingEdges } = addMissing();
                // Then we group the graph into SCCs
                const { nodes, edges } = groupNodesBySCC(
                  "first",
                  setUpNodes,
                  [...setUpEdges, ...missingEdges],
                  getFirstNodeId,
                  getFirstEdgeId,
                );
                // And finally we apply a layout to the result and,
                // once the layout is finished, remove the loading indicator
                layoutElements(
                  "provided",
                  undefined,
                  nodes,
                  edges,
                  setFirstNodes,
                  setFirstEdges,
                  () => setLoading(undefined), // callback to remove indicator
                );
              }}
              disabled={
                firstSetupComplete ||
                loading !== undefined ||
                loadingTimeout !== undefined
              }
            >
              {(loading === "solve" || loadingTimeout === "solve") && (
                <CircularProgress
                  size={24}
                  sx={{
                    color: "inherit",
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    marginTop: "-12px",
                    marginLeft: "-12px",
                  }}
                />
              )}
              Show Solution
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                // Since checking the graph can take some time
                // we show the user a loading indicator
                setLoading("check");
                setLoadingTimeout("check");
                // this makes sure we show the loading indicator for
                // at least minTimeout ms
                setTimeout(() => {
                  setLoadingTimeout(undefined);
                }, minTimeout);

                // Now we check if the graph is correct
                if (check()) {
                  // If it is correct we don't want the user modifying
                  // it again
                  toggleFirstDeletableAndConnectable(false, false);
                  // we need to set this to true so the user can
                  // navigate to the next page
                  setFirstSetupComplete(true);
                }

                // once we are finished we remove the loading indicator
                // (or wait if the minimum time is not over)
                setLoading(undefined);
              }}
              disabled={
                firstSetupComplete ||
                loading !== undefined ||
                loadingTimeout !== undefined
              }
            >
              {(loading === "check" || loadingTimeout === "check") && (
                <CircularProgress
                  size={24}
                  sx={{
                    color: "inherit",
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    marginTop: "-12px",
                    marginLeft: "-12px",
                  }}
                />
              )}
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

export default PrepareFirstAlgorithmPage;
