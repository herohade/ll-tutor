import { styled } from "@mui/material";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";

import { Edge, MarkerType, Node, useReactFlow } from "reactflow";

import { VariantType, useSnackbar } from "notistack";

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

type Props = {
  graphCanvas: JSX.Element;
};

const StyledSpan = styled("span")({});

/*
This is the eighth page of the webtutor.
It shows the user the grammar and the F-epsilon sets, color coded regarding the
empty attributes. The user has to group the FollowNodes into Strongly Connected
Components (group nodes). These are used to calculate the follow sets
in the next step.
*/
function PrepareFollowAlgorithmPage({ graphCanvas }: Props) {
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
    firstNodes: state.firstNodes,
    firstEdges: state.firstEdges,
    setFirstNodes: state.setFirstNodes,
    setFirstEdges: state.setFirstEdges,
    // FollowNodeSlice
    followSetupComplete: state.followSetupComplete,
    followNodes: state.followNodes,
    followEdges: state.followEdges,
    getFollowNodeId: state.getFollowNodeId,
    getFollowEdgeId: state.getFollowEdgeId,
    setFollowSetupComplete: state.setFollowSetupComplete,
    setFollowNodes: state.setFollowNodes,
    setFollowEdges: state.setFollowEdges,
    toggleFollowDeletableAndConnectable:
      state.toggleFollowDeletableAndConnectable,
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
    firstNodes,
    firstEdges,
    setFirstNodes,
    setFirstEdges,
    // FollowNodeSlice
    followSetupComplete,
    followNodes,
    followEdges,
    getFollowNodeId,
    getFollowEdgeId,
    setFollowSetupComplete,
    setFollowNodes,
    setFollowEdges,
    toggleFollowDeletableAndConnectable,
  } = useBoundStore(selector, shallow);

  const { enqueueSnackbar } = useSnackbar();

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

  const { fitView } = useReactFlow();

  const reset = () => {
    const newFollowNodes: Node<NodeData>[] = [];
    const newFollowEdges: Edge<EdgeData>[] = [];

    // add a new FollowNode for each (Non)terminal
    for (const node of emptyNodes.filter((n) => n.data.name !== "ε")) {
      const newNode: Node<NodeData> = {
        id: getFollowNodeId(),
        type: "follow",
        position: node.position,
        deletable: false,
        data: {
          ...node.data,
        },
      };
      newFollowNodes.push(newNode);
    }

    // add a FollowNode {t} for each terminal t
    for (const terminal of terminals) {
      const terminalNode: Node<NodeData> | undefined = newFollowNodes.find(
        (n) => n.data.name === terminal.name,
      );
      if (!terminalNode) {
        if (import.meta.env.DEV) {
          console.error(
            "Error Code 244100: Terminal not found among newFollowNodes!",
            terminal,
          );
        }
        return;
      }
      const nodeId = getFollowNodeId();
      const nodeName = `{${terminal.name}}`;
      const newNode: Node<NodeData> = {
        id: nodeId,
        type: "follow",
        position: {
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
        id: getFollowEdgeId(),
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
      newFollowNodes.push(newNode);
      newFollowEdges.push(newEdge);
    }

    setFollowNodes(newFollowNodes);
    setFollowEdges(newFollowEdges, fitView);
  };

  const addMissing = () => {
    const setUpNodes = followNodes
      .filter((node) => node.type === "follow")
      .map((node) => {
        if (node.parentNode !== undefined) {
          const parentNode = followNodes.find(
            (parentNode) => parentNode.id === node.parentNode,
          );
          if (parentNode === undefined) {
            if (import.meta.env.DEV) {
              console.error(
                "Error Code e8e5cc: Node not found",
                node,
                followNodes,
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
    const setUpEdges = followEdges.filter(
      (edge) =>
        edge.deletable === false &&
        setUpNodes.some((node) => node.id === edge.source) &&
        setUpNodes.some((node) => node.id === edge.target),
    );
    const missingEdgesSet = new Set<string>();
    for (const production of productions) {
      let empty = true;
      let i = 0;
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
        const id = getFollowNodeId();
        const sourceNode = setUpNodes.find(
          (node) => node.data.name === edgeName.split("->")[0],
        );
        const targetNode = setUpNodes.find(
          (node) => node.data.name === edgeName.split("->")[1],
        );
        if (sourceNode === undefined || targetNode === undefined) {
          if (import.meta.env.DEV) {
            console.error(
              "Error Code 6456d4: Node not found",
              edgeName,
              sourceNode,
              targetNode,
              setUpNodes,
            );
          }
          throw new Error("Error Code 6456d4: Please contact the developer!");
        }
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
            sections: [],
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

  const check = () => {
    const { setUpNodes, setUpEdges, missingEdges } = addMissing();
    const { nodes, edges } = groupNodesBySCC(
      "follow",
      setUpNodes,
      [...setUpEdges, ...missingEdges],
      getFollowNodeId,
      getFollowEdgeId,
    );
    if (import.meta.env.DEV) {
      console.log("new nodes and edges after scc:", nodes, edges);
    }
    const missingSolutionNodes = nodes.filter(
      (node) =>
        !followNodes.some((followNode) => {
          if (
            followNode.type === node.type &&
            followNode.data.name === node.data.name
          ) {
            if (node.type === "follow") {
              if (followNode.parentNode && node.parentNode) {
                const followParentNode = followNodes.find(
                  (n) => n.id === followNode.parentNode,
                );
                const parentNode = nodes.find((n) => n.id === node.parentNode);
                if (followParentNode && parentNode) {
                  return followParentNode.data.name === parentNode.data.name;
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
    const missingSolutionEdges = edges.filter(
      (edge) =>
        !followEdges.some((followEdge) => {
          return (
            followEdge.data &&
            edge.data &&
            followEdge.data.name === edge.data.name
          );
        }),
    );
    if (
      missingSolutionNodes.length === 0 &&
      missingSolutionEdges.length === 0 &&
      nodes.length === followNodes.length &&
      edges.length === followEdges.length
    ) {
      showSnackbar("Correct, well done!", "success", true);
      return true;
    }
    if (missingSolutionNodes.length > 0) {
      if (import.meta.env.DEV) {
        console.log(
          missingSolutionNodes,
          "solutionNodes",
          nodes,
          "userNodes",
          followNodes,
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
    if (missingSolutionEdges.length > 0) {
      if (import.meta.env.DEV) {
        console.log(
          missingSolutionEdges,
          "solutionEdges",
          edges,
          "userEdges",
          followEdges,
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
    const unnecessaryUserNodes = followNodes.filter(
      (followNode) =>
        !nodes.find((node) => {
          if (
            node.type === followNode.type &&
            node.data.name === followNode.data.name
          ) {
            if (followNode.type === "follow") {
              if (node.parentNode && followNode.parentNode) {
                const parentNode = nodes.find((n) => n.id === node.parentNode);
                const followParentNode = followNodes.find(
                  (n) => n.id === followNode.parentNode,
                );
                if (followParentNode && parentNode) {
                  return followParentNode.data.name === parentNode.data.name;
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
    const unnecessaryUserEdges = followEdges.filter(
      (followEdge) =>
        !edges.find((edge) => {
          return (
            followEdge.data &&
            edge.data &&
            followEdge.data.name === edge.data.name
          );
        }),
    );
    if (
      unnecessaryUserNodes.length === 0 &&
      unnecessaryUserEdges.length === 0
    ) {
      if (import.meta.env.DEV) {
        console.error(
          "Error Code 55b36a: Found no unnecessary nodes or edges when there should have been some:",
          unnecessaryUserNodes,
          unnecessaryUserEdges,
        );
      }
      return false;
    }
    if (unnecessaryUserNodes.length > 0) {
      if (import.meta.env.DEV) {
        console.log(
          unnecessaryUserNodes,
          "userNodes",
          followNodes,
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
    if (unnecessaryUserEdges.length > 0) {
      if (import.meta.env.DEV) {
        console.log(
          unnecessaryUserEdges,
          "userEdges",
          followEdges,
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
                showSnackbar("This is not yet implemented!", "error", true);
                reset();
              }}
              disabled={followSetupComplete}
            >
              Reset Graph
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={() => {
                showSnackbar("This is not yet implemented!", "error", true);
                const { setUpNodes, setUpEdges, missingEdges } = addMissing();
                const { nodes, edges } = groupNodesBySCC(
                  "follow",
                  setUpNodes,
                  [...setUpEdges, ...missingEdges],
                  getFollowNodeId,
                  getFollowEdgeId,
                );

                layoutElements(
                  "provided",
                  undefined,
                  nodes,
                  edges,
                  setFollowNodes,
                  setFollowEdges,
                );
              }}
              disabled={followSetupComplete}
            >
              Show Solution
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                showSnackbar("This is not yet implemented!", "error", true);
                if (check()) {
                  toggleFollowDeletableAndConnectable(false, false);
                  setFollowSetupComplete(true);
                }
              }}
              disabled={followSetupComplete}
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

export default PrepareFollowAlgorithmPage;
