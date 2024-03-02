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
  FirstAlgorithmSlice,
  FirstNodeSlice,
  FollowAlgorithmNodeMap,
  FollowAlgorithmSlice,
  FollowNodeSlice,
  GrammarSlice,
  NodeColor,
  NodeData,
  Nonterminal,
  Terminal,
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
 * This is the eighth page of the webtutor.
 * It shows the user the grammar and the Fε-sets,
 * color coded regarding the empty attributes. The user has to group the
 * FollowNodes into Strongly Connected Components (group nodes).
 * These are used to compute the follow sets in the next step.
*/
function PrepareFollowAlgorithmPage({ graphCanvas }: Props) {
  const selector = (
    state: GrammarSlice &
      EmptyNodeSlice &
      EmptyAlgorithmSlice &
      FirstNodeSlice &
      FirstAlgorithmSlice &
      FollowNodeSlice &
      FollowAlgorithmSlice,
  ) => ({
    // GrammarSlice
    startSymbol: state.startSymbol,
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
    // FirstAlgorithmSlice
    firstNodeMap: state.firstNodeMap,
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
    setExpandFollowParent: state.setExpandFollowParent,
    // FollowAlgorithmSlice
    setFollowNodeMap: state.setFollowNodeMap,
  });
  const {
    // GrammarSlice
    startSymbol,
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
    // FirstAlgorithmSlice
    firstNodeMap,
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
    setExpandFollowParent,
    // FollowAlgorithmSlice
    setFollowNodeMap,
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
   * In the beginning the graph should contain a FollowNode for each
   * (Non)terminal and the Nodes from the previous step (Fε-computation).
   * 
   * Since the user can't add nodes themselves, these should not be
   * deletable.
   * 
   * @privateRemarks
   * 
   * This is copied from prepareFollowAlgorithm() in {@link HeaderComponent}.
   * A possible slight modification is that we could apply
   * a layout to the result here. Currently we do not because
   * this way it looks exactly like it does initially.
   */
  const reset = () => {
    const newFollowNodes: Node<NodeData>[] = [];
    const newFollowEdges: Edge<EdgeData>[] = [];

    // since we can't use the elk layouting algorithm here,
    // we will just eyeball the positions of the nodes
    // (Actually here, unlike in HeaderComponent, we could,
    // but I think it's better if it looks the same as when
    // you actually first get to this step so we keep it)
    const maxXY: { x: number; y: number } = { x: 0, y: 0 };

    // Add all FirstNodes as FollowNodes (we need Fε again)
    for (const node of firstNodes) {
      // group nodes stay group nodes, first nodes become follow nodes
      const type = node.type === "group" ? "group" : "follow";
      const parentNodeName: string | undefined = node.parentNode
        ? firstNodes.find((n) => n.id === node.parentNode)?.data.name
        : undefined;
      const parentNode: string | undefined = parentNodeName
        ? newFollowNodes.find(
            (n) => n.data.name === "Fε(" + parentNodeName + ")",
          )?.id
        : undefined;

      // update the furthest position of a node
      if (node.position.x < maxXY.x) {
        maxXY.x = node.position.x;
      }
      if (node.position.y < maxXY.y) {
        maxXY.y = node.position.y;
      }

      const newNode: Node<NodeData> = {
        id: getFollowNodeId(),
        type,
        position: node.position,
        width: node.width,
        height: node.height,
        parentNode,
        extent: node.extent,
        expandParent: type !== "group" ? true : undefined,
        deletable: false,
        data: {
          ...node.data,
          name: "Fε(" + node.data.name + ")",
        },
      };
      newFollowNodes.push(newNode);
    }

    // move the position of the first node to the top left
    maxXY.x -= 300;
    // afterwards alternate between moving left and up
    let leftOrUp = false;

    // Add FollowNode {$} (Part of Follow set for S')
    // Also add it's group node, since that one should display
    // Fε. If all nodes added by the user were Follow
    // group nodes, that would be nicer.
    const dollarGroupNodeId = getFollowNodeId();

    const dollarGroupNode: Node<NodeData> = {
      id: dollarGroupNodeId,
      type: "group",
      position: {
        x: maxXY.x,
        y: maxXY.y,
      },
      deletable: false,
      data: {
        name: "Fε(SCC({$}))",
        empty: false,
        color: NodeColor.none,
      },
    };

    const dollarNode: Node<NodeData> = {
      id: getFollowNodeId(),
      type: "follow",
      position: {
        x: 140,
        y: 130,
      },
      parentNode: dollarGroupNodeId,
      extent: "parent",
      expandParent: true,
      deletable: false,
      data: {
        name: "Fε({$})",
        empty: false,
        color: NodeColor.none,
      },
    };

    newFollowNodes.push(dollarGroupNode);
    newFollowNodes.push(dollarNode);

    // Add new FollowNode for all Nonterminals (these will not be for F_epsilon
    // but for Follow_1. These are the nodes the user has to connect and group)
    for (const nonterminal of nonTerminals) {
      // move the position of the next node
      maxXY.x -= leftOrUp ? 150 : 0;
      maxXY.y -= leftOrUp ? 0 : 150;
      leftOrUp = !leftOrUp;
      const position = {
        x: maxXY.x,
        y: maxXY.y,
      };

      const newNode: Node<NodeData> = {
        id: getFollowNodeId(),
        type: "follow",
        position,
        deletable: false,
        data: {
          name: "Follow(" + nonterminal.name + ")",
          empty: nonterminal.empty,
          color: nonterminal.empty ? NodeColor.older : NodeColor.none,
        },
      };
      newFollowNodes.push(newNode);
    }

    // Add Edge {$} -> S' (Part of Follow set for S')
    const sourceNode: Node<NodeData> = dollarNode;
    const targetNode: Node<NodeData> | undefined = newFollowNodes.find(
      (n) => n.data.name === "Follow(" + startSymbol.name + ")",
    );
    if (!targetNode) {
      if (import.meta.env.DEV) {
        console.error(
          "Error Code 5d1a2e: Start symbol not found among newFollowNodes!",
          newFollowNodes,
        );
      }
      showSnackbar(
        "Error Code 5d1a2e: Please contact the developer!",
        "error",
        true,
      );
      return;
    }
    const newEdge: Edge<EdgeData> = {
      id: getFollowEdgeId(),
      type: "floating",
      source: sourceNode.id,
      target: targetNode.id,
      sourceNode,
      targetNode,
      deletable: false,
      data: {
        pathType: EdgePathType.Straight,
        isGroupEdge: false,
        name: sourceNode.data.name + "->" + targetNode.data.name,
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
    newFollowEdges.push(newEdge);

    // Add all FirstNode edges as FollowNode edges (we need F_epsilon again)
    for (const firstEdge of firstEdges) {
      // we only care about the edges between the group nodes
      // but we need them for the SCC algorithm so we hide them
      const hidden = firstEdge.data?.isGroupEdge !== true;

      const sourceNode: Node<NodeData> | undefined = newFollowNodes.find(
        (n) => n.data.name === "Fε(" + firstEdge.sourceNode?.data.name + ")",
      );
      const targetNode: Node<NodeData> | undefined = newFollowNodes.find(
        (n) => n.data.name === "Fε(" + firstEdge.targetNode?.data.name + ")",
      );
      if (!sourceNode || !targetNode) {
        if (import.meta.env.DEV) {
          console.error(
            "Error Code 75123b: FirstNode not found among newFollowNodes!",
            firstEdge,
            newFollowNodes,
          );
        }
        showSnackbar(
          "Error Code 75123b: Please contact the developer!",
          "error",
          true,
        );
        return;
      }

      const newEdge: Edge<EdgeData> = {
        id: getFollowEdgeId(),
        type: "floating",
        source: sourceNode.id,
        target: targetNode.id,
        sourceNode,
        targetNode,
        deletable: false,
        hidden,
        data: {
          pathType: EdgePathType.Straight,
          isGroupEdge: true,
          name: sourceNode.data.name + "->" + targetNode.data.name,
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

      newFollowEdges.push(newEdge);
    }

    if (import.meta.env.DEV) {
      console.log("firstNodes", firstNodes);
      console.log("firstEdges", firstEdges);
      console.log("newFollowNodes", newFollowNodes);
      console.log("newFollowEdges", newFollowEdges);
    }

    prepareFollowMap(newFollowNodes);

    // This is a slight modification from the copied code.
    // Here we can actually apply a layout to the result
    // instead of just saving the nodes:
    // Here we could modify the copied code and apply a layout
    // But we currently do not.

    // remove this if we apply a layout (it already saves the nodes)
    setFollowNodes(newFollowNodes);
    setFollowEdges(newFollowEdges, fitView);

    // // remove this if we do not want a layout applied
    // layoutElements(
    //   "provided",
    //   undefined,
    //   newFollowNodes,
    //   newFollowEdges,
    //   setFollowNodes,
    //   setFollowEdges,
    // );

    // above we set expandParent to true, so that groupnodes automatically
    // expant to fit their children
    // This is not something we usually want, so we set it back to false after
    // the page (hopefully) has loaded
    // setExpandFollowParent(false);
    setTimeout(() => {
      setExpandFollowParent(false);
    }, 1000);
  };

  /**
   * Function to prepare the {@link FollowAlgorithmNodeMap}.
   * 
   * @remarks
   * 
   * This function copies the map from the first set computation
   * and updates the ids to the equivalent ids of the new follow nodes.
   */
  const prepareFollowMap = (newFollowNodes: Node<NodeData>[]) => {
    if (import.meta.env.DEV) {
      console.log("Preparing follow set map...");
    }

    // A mapping from the id of a FirstNode to the equivalent FollowNode
    const firstToFollowGroupNodeMap = new Map<string, string>(
      firstNodes
        .filter((n) => n.type === "group")
        .map((n) => {
          const firstName = "Fε(" + n.data.name + ")";
          const followNode = newFollowNodes.find(
            (n) => n.data.name === firstName,
          );
          if (!followNode) {
            if (import.meta.env.DEV) {
              console.error(
                "Error Code 4fc921: FirstNode not found among followNodes!",
                firstName,
                newFollowNodes,
              );
            }
            showSnackbar(
              "Error Code 4fc921: Please contact the developer!",
              "error",
              true,
            );
            return ["", ""];
          }
          return [n.id, followNode.id];
        }),
    );

    // Prepare the follow set map by copying the first set map with the
    // FollowNodes equivalent ids

    // 1. create a FollowAlgorithmNodeMap for each groupnode
    const newFollowNodeMap = new Map<string, FollowAlgorithmNodeMap>(
      newFollowNodes
        .filter((n) => n.type === "group")
        .map((n) => [
          n.id,
          {
            active: false,
            incomingFollow: new Map<string, string[] | undefined>(),
            // The only new GroupNode we have at this point is the one for the
            // {$} SCC. Since we copy the sets from the FirstNode map, we need
            // to add $ to the follow set of the {$} SCC manually.
            follow: new Set<string>(
              [...firstToFollowGroupNodeMap.values()].some((v) => v === n.id)
                ? []
                : ["$"],
            ),
          },
        ]),
    );

    // 2. copy the map from the FirstNodeMap
    for (const [id, nodeMap] of firstNodeMap.entries()) {
      const newId = firstToFollowGroupNodeMap.get(id);
      if (!newId) {
        if (import.meta.env.DEV) {
          console.error(
            "Error Code e208e8: FirstNode not found among followNodes!",
            id,
            firstToFollowGroupNodeMap,
          );
        }
        showSnackbar(
          "Error Code e208e8: Please contact the developer!",
          "error",
          true,
        );
        return false;
      }

      // We need to update the incomingFirst map to use the equivalent ids
      const newIncomingFollow = new Map<string, string[] | undefined>();
      for (const [id, follow] of nodeMap.incomingFirst.entries()) {
        const newId = firstToFollowGroupNodeMap.get(id);
        if (!newId) {
          if (import.meta.env.DEV) {
            console.error(
              "Error Code 534755: FirstNode not found among followNodes!",
              id,
              firstToFollowGroupNodeMap,
            );
          }
          showSnackbar(
            "Error Code 534755: Please contact the developer!",
            "error",
            true,
          );
          return false;
        }
        newIncomingFollow.set(newId, follow);
      }

      const newNodeMap: FollowAlgorithmNodeMap = {
        active: nodeMap.active,
        incomingFollow: newIncomingFollow,
        follow: nodeMap.first,
      };

      newFollowNodeMap.set(newId, newNodeMap);
    }

    if (import.meta.env.DEV) {
      console.log("newFollowNodeMap", newFollowNodeMap);
    }

    setFollowNodeMap(newFollowNodeMap);
  };

  /**
   * Function to find the missing edges of the initial graph.
   * This is the first step of solving the graph. The second step being
   * the grouping into Strongly Connected Components.
   * 
   * @remarks
   * 
   * It computes the initial state by filtering out all nodes and edges
   * that were added by the user. Then it computes the missing edges.
   * 
   * @returns An object containing the initial state (auto generated nodes and edges) and the missing edges.
   * 
   */
  const addMissing = () => {
    // first we figure out the original state by filtering out all nodes
    // and edges that were added by the user
    const setUpNodes = followNodes
      .filter((node) => {
        // this filters out all Follow-GroupNodes, which are exactly the
        // nodes added by the user
        if (node.type === "follow") {
          return true;
        } else {
          if (node.data.name.startsWith("Fε(")) {
            return true;
          }
          return false;
        }
      })
      .map((node) => {
        // if a node has a parent that is user added, we need to remove
        // it from the parent (as they will not be in the new array)
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
          // exactly the user added nodes are Follow-GroupNodes
          if (parentNode.data.name.startsWith("Follow(")) {
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
        }
        return node;
      });
    const setUpEdges = followEdges.filter(
      (edge) =>
        edge.deletable === false &&
        setUpNodes.some((node) => node.id === edge.source) &&
        setUpNodes.some((node) => node.id === edge.target),
    );

    // now we add the missing edges by going through all productions
    // and adding edges a->A for right sides ..Aa..., as well as
    // edges A->B for productions B->...A𝛼, where 𝛼 can be empty
    // missingFirstEdgesSet contains edges Fε(a)->Follow(A) and
    // missingFollowEdgesSet contains edges Follow(A)->Follow(B)
    const missingFirstEdgesSet = new Set<string>();
    const missingFollowEdgesSet = new Set<string>();
    for (const production of productions) {
      let i = 0;
      while (i < production.rightSide.length) {
        const symbol = production.rightSide[i];
        // if the production is just A-> we can skip it
        if (symbol.name === "ε") {
          break;
        }
        // We don't need to compute follow sets for terminals
        // so we skip them if they are on the right side
        if (symbol instanceof Terminal) {
          i++;
          continue;
        }
        // Here we add all symbols after the current one until one is
        // not empty
        let empty = true;
        let j = i + 1;
        while (empty && j < production.rightSide.length) {
          const nextSymbol = production.rightSide[j];
          // we need their Fε sets, so we add them to missingFirstEdgesSet
          missingFirstEdgesSet.add(
            "Fε(" + nextSymbol.name + ")->Follow(" + symbol.name + ")",
          );
          empty = nextSymbol.empty;
          j++;
        }
        // If all of them were empty, we also need to add an edge
        // from the left side of the profuction to the current symbol
        if (empty) {
          // we need their Follow sets, so we add them to missingFollowEdgesSet
          missingFollowEdgesSet.add(
            "Follow(" +
              production.leftSide.name +
              ")->Follow(" +
              symbol.name +
              ")",
          );
        }

        i++;
      }
    }
    if (import.meta.env.DEV) {
      console.log("missingFirstEdgesSet", missingFirstEdgesSet);
      console.log("missingFollowEdgesSet", missingFollowEdgesSet);
    }
    // First we add all edges Fε(a)->Follow(A)
    const missingEdges: Edge<EdgeData>[] = Array.from(missingFirstEdgesSet).map(
      (edgeName) => {
        const id = getFollowEdgeId();
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
          showSnackbar(
            "Error Code 6456d4: Please contact the developer!",
            "error",
            true,
          );
          throw new Error("Error Code 6456d4: Please contact the developer!");
        }
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
        } as Edge<EdgeData>;
      },
    );
    // Then we add all edges Follow(A)->Follow(B)
    for (const edgeName of missingFollowEdgesSet) {
      const id = getFollowEdgeId();
      const sourceNode = setUpNodes.find(
        (node) => node.data.name === edgeName.split("->")[0],
      );
      const targetNode = setUpNodes.find(
        (node) => node.data.name === edgeName.split("->")[1],
      );
      if (sourceNode === undefined || targetNode === undefined) {
        if (import.meta.env.DEV) {
          console.error(
            "Error Code 5709da: Node not found",
            edgeName,
            sourceNode,
            targetNode,
            setUpNodes,
          );
        }
        showSnackbar(
          "Error Code 5709da: Please contact the developer!",
          "error",
          true,
        );
        throw new Error("Error Code 5709da: Please contact the developer!");
      }
      const newEdge: Edge<EdgeData> = {
        id: id,
        type: "floating",
        source: sourceNode.id,
        target: targetNode.id,
        sourceNode: sourceNode,
        targetNode: targetNode,
        deletable: true,
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
      missingEdges.push(newEdge);
    }

    if (import.meta.env.DEV) {
      console.log("setUpNodes", setUpNodes);
      console.log("setUpEdges", setUpEdges);
      console.log("missingEdges", missingEdges);
    }

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
    // There are two ways to check the graph:
    // 1. Check if these conditions are met:
    // no edges between Fe and Fe, that are user generated
    // no edges between Follow and Fe
    // only correct edges between Fe and Follow
    // only correct edges between Follow and Follow
    // 2. Copy/paste the check algorithm from the first algorithm page.
    // That might be more expensive, because it generates the solution
    // and compares it to the user graph, but it saves me time, so...

    // Option 2 it is:
    // This is pretty much a copy/paste of the check function in the
    // PrepareFirstAlgorithmPage, with some minor changes
    
    // First we generate the solution
    const { setUpNodes, setUpEdges, missingEdges } = addMissing();
    // The nodes given to groupNodesBySCC contain GroupNodes
    // which the function will simply ignore (filter out).
    // This is not a problem, since new ones will be added
    // by the function. But the function will print a warning
    // to the console. We can ignore that.
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
    // Now we compare the solution to the users graph.
    // Which solution nodes does the user not have?
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
    // Which solution edges does the user not have?
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
    // If the user is not missing anything and has the same
    // number of edges and nodes, the graph should be correct.
    if (
      missingSolutionNodes.length === 0 &&
      missingSolutionEdges.length === 0 &&
      nodes.length === followNodes.length &&
      edges.length === followEdges.length
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
    // notify the user of a missing edge
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
    // If there is a mistake but all nodes and edges are accounted for
    // there must be too many.
    // Find the unnecessary nodes.
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
    // Find the unnecessary edges.
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
    // If we still did not find a mistake, we panic because this should
    // not be possible
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
    // notify the user of an unnecessary node
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
    // notify the user of an unnecessary edge
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
                followSetupComplete ||
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
                // The nodes given to groupNodesBySCC contain GroupNodes
                // which the function will simply ignore (filter out).
                // This is not a problem, since new ones will be added
                // by the function. But the function will print a warning
                // to the console. We can ignore that.
                const { nodes, edges } = groupNodesBySCC(
                  "follow",
                  setUpNodes,
                  [...setUpEdges, ...missingEdges],
                  getFollowNodeId,
                  getFollowEdgeId,
                );

                // And finally we apply a layout to the result and,
                // once the layout is finished, remove the loading indicator
                layoutElements(
                  "provided",
                  undefined,
                  nodes,
                  edges,
                  setFollowNodes,
                  setFollowEdges,
                  () => setLoading(undefined), // callback to remove indicator
                );
              }}
              disabled={
                followSetupComplete ||
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
                  toggleFollowDeletableAndConnectable(false, false);
                  // we need to set this to true so the user can
                  // navigate to the next page
                  setFollowSetupComplete(true);
                }

                // once we are finished we remove the loading indicator
                // (or wait if the minimum time is not over)
                setLoading(undefined);
              }}
              disabled={
                followSetupComplete ||
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

export default PrepareFollowAlgorithmPage;
