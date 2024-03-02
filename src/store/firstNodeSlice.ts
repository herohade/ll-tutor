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
  MarkerType,
} from "reactflow";

import { VariantType } from "notistack";

import { FirstNode, FirstGroupNode, FloatingEdge } from "../components";

import {
  FirstNodeSlice,
  NodeData,
  NodeColor,
  EdgeData,
  EdgePathType,
} from "../types";

/**
 * Function that returns the order of two nodes.
 * Sorts group nodes before first nodes (as required by ReactFlow)
 * 
 * @remarks
 * 
 * Returns 0 if both nodes are of the same type, otherwise returns -1
 * if the first node is a group node and 1 if not.
 * 
 * @param a - First node
 * @param b - Second node
 * @returns - a number indicating the sort order
 */
const sortFirstAndGroupNodes = (
  a: Node<NodeData>,
  b: Node<NodeData>,
): number => {
  if (a.type === b.type) {
    return 0;
  }
  return a.type === "group" && b.type !== "group" ? -1 : 1;
};

/**
 * Creates a new {@link FirstNodeSlice} with the given initial state.
 */
export const createFirstNodeSlice: StateCreator<FirstNodeSlice> = (
  set,
  get,
) => ({
  firstIdCounter: 0,
  firstNodeTypes: {
    first: FirstNode,
    group: FirstGroupNode,
  },
  firstEdgeTypes: {
    floating: FloatingEdge,
  },
  firstSetupComplete: false,
  firstNodes: [],
  firstEdges: [],
  getFirstNodeId: () => {
    const counter = get().firstIdCounter;
    set({ firstIdCounter: counter + 1 });
    return "FirstNode" + counter;
  },
  getFirstEdgeId: () => {
    const counter = get().firstIdCounter;
    set({ firstIdCounter: counter + 1 });
    return "FirstEdge" + counter;
  },
  setFirstSetupComplete: (complete: boolean) => {
    set({ firstSetupComplete: complete });
  },
  setFirstNodes: (nodes: Node<NodeData>[], fitView?: () => void) => {
    set({ firstNodes: nodes.sort(sortFirstAndGroupNodes) });
    if (fitView) {
      setTimeout(() => fitView(), 0);
    }
  },
  setFirstEdges: (edges: Edge<EdgeData>[], fitView?: () => void) => {
    set({ firstEdges: edges });
    if (fitView) {
      setTimeout(() => fitView(), 0);
    }
  },
  setFirstLabelSize(nodeId, size) {
    set({
      firstNodes: get().firstNodes.map((node) => {
        if (node.id === nodeId) {
          node.data = {
            ...node.data,
            labelSize: size,
          };
        }
        return node;
      }),
    });
  },
  onFirstNodesChange: (changes: NodeChange[]) => {
    const firstNodes = get().firstNodes;
    set({
      firstNodes: applyNodeChanges(changes, firstNodes),
    });
    return;
  },
  onFirstEdgesChange: (changes: EdgeChange[]) => {
    const firstEdges = get().firstEdges;
    set({
      firstEdges: applyEdgeChanges(changes, firstEdges),
    });
  },
  onFirstConnect:
    (
      showSnackbar: (
        message: string,
        variant: VariantType,
        preventDuplicate: boolean,
      ) => void,
    ) =>
    (connection: Connection) => {
      // We get a connection. If it is valid we want to create an edge.
      if (connection.source === null || connection.target === null) {
        if (import.meta.env.DEV) {
          console.error(
            "Error Code 281966: Connection is not valid! Please contact the developer!",
          );
        }
        return;
      }
      const nodes = get().firstNodes;
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);
      if (!sourceNode || !targetNode) {
        if (import.meta.env.DEV) {
          console.error(
            "Error Code b4c8da: Connection is not valid! Please contact the developer!",
          );
        }
        return;
      }
      const edgeName = sourceNode.data.name + "->" + targetNode.data.name;
      const isGroupEdge =
        sourceNode.type === "group" || targetNode.type === "group";
      const edges = get().firstEdges;
      const id = get().getFirstEdgeId();

      if (
        edges.some(
          (e) =>
            e.source === connection.source && e.target === connection.target,
        )
      ) {
        if (import.meta.env.DEV) {
          console.log("Edge already exists.", connection, edges);
        }
        showSnackbar("Edge " + edgeName + " already exists.", "warning", true);
        return;
      }

      const params: Edge<EdgeData> = {
        ...connection,
        id: id,
        type: "floating",
        source: connection.source,
        target: connection.target,
        sourceNode: sourceNode,
        targetNode: targetNode,
        data: {
          pathType: EdgePathType.Straight,
          isGroupEdge: isGroupEdge,
          name: edgeName,
        },
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          orient: "auto",
          color: sourceNode.data.empty ? NodeColor.thisTurn : NodeColor.none,
        },
        style: {
          strokeWidth: 2,
          stroke: sourceNode.data.empty ? NodeColor.thisTurn : NodeColor.none,
        },
      };
      set({
        firstEdges: addEdge(params, edges),
      });
    },
  toggleFirstDeletableAndConnectable: (
    deletable: boolean,
    connectable: boolean,
  ) => {
    set({
      firstNodes: get().firstNodes.map((node) => {
        return {
          ...node,
          connectable: connectable,
          data:
            // group nodes should always be deletable, so
            // we only change the deletable property of first nodes
            node.type === "group"
              ? node.data
              : { ...node.data, deletable: deletable },
        };
      }),
      firstEdges: get().firstEdges.map((edge) => {
        edge.deletable = deletable;
        return edge;
      }),
    });
  },
  setFirstNodeEdgesHidden: (hidden: boolean) => {
    set({
      firstEdges: get().firstEdges.map((edge) => {
        if (!edge.data?.isGroupEdge) { // only edges between child nodes
          return {
            ...edge,
            hidden: hidden,
          };
        }
        return edge;
      }),
    });
  },
});
