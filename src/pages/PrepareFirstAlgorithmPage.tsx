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
This is the sixth page of the webtutor.
It shows the user the grammer, color coded regarding the empty
attributes. The user has to group the FirstNodes into Strongly Connected
Components (group nodes). These are used to calculate the first sets
in the next step.
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

  const addMissing = () => {
    const setUpNodes = firstNodes
      .filter((node) => node.type === "first")
      .map((node) => {
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
    const setUpEdges = firstEdges.filter(
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

  const check = () => {
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
    if (
      missingSolutionNodes.length === 0 &&
      missingSolutionEdges.length === 0 &&
      nodes.length === firstNodes.length &&
      edges.length === firstEdges.length
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
                reset();
              }}
              disabled={firstSetupComplete}
            >
              Reset Graph
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={() => {
                const { setUpNodes, setUpEdges, missingEdges } = addMissing();
                const { nodes, edges } = groupNodesBySCC(
                  "first",
                  setUpNodes,
                  [...setUpEdges, ...missingEdges],
                  getFirstNodeId,
                  getFirstEdgeId,
                );

                layoutElements(
                  "provided",
                  undefined,
                  nodes,
                  edges,
                  setFirstNodes,
                  setFirstEdges,
                );
              }}
              disabled={firstSetupComplete}
            >
              Show Solution
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                if (check()) {
                  toggleFirstDeletableAndConnectable(false, false);
                  setFirstSetupComplete(true);
                }
              }}
              disabled={firstSetupComplete}
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

export default PrepareFirstAlgorithmPage;
