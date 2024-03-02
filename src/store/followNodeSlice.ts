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

import { FollowNode, FloatingEdge, FollowGroupNode } from "../components";

import {
  FollowNodeSlice,
  NodeData,
  NodeColor,
  EdgeData,
  EdgePathType,
} from "../types";

/**
 * Function that returns the order of two nodes.
 * Sorts group nodes before follow nodes (as required by ReactFlow)
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
const sortFollowAndGroupNodes = (
  a: Node<NodeData>,
  b: Node<NodeData>,
): number => {
  if (a.type === b.type) {
    return 0;
  }
  return a.type === "group" && b.type !== "group" ? -1 : 1;
};

/**
 * Creates a new {@link FollowNodeSlice} with the given initial state.
 */
export const createFollowNodeSlice: StateCreator<FollowNodeSlice> = (
  set,
  get,
) => ({
  followIdCounter: 0,
  followNodeTypes: {
    follow: FollowNode,
    group: FollowGroupNode,
  },
  followEdgeTypes: {
    floating: FloatingEdge,
  },
  followSetupComplete: false,
  followNodes: [],
  followEdges: [],
  getFollowNodeId: () => {
    const counter = get().followIdCounter;
    set({ followIdCounter: counter + 1 });
    return "FollowNode" + counter;
  },
  getFollowEdgeId: () => {
    const counter = get().followIdCounter;
    set({ followIdCounter: counter + 1 });
    return "FollowEdge" + counter;
  },
  setFollowSetupComplete: (complete: boolean) => {
    set({ followSetupComplete: complete });
  },
  setFollowNodes: (nodes: Node<NodeData>[], fitView?: () => void) => {
    set({ followNodes: nodes.sort(sortFollowAndGroupNodes) });
    if (fitView) {
      setTimeout(() => fitView(), 0);
    }
  },
  setFollowEdges: (edges: Edge<EdgeData>[], fitView?: () => void) => {
    set({ followEdges: edges });
    if (fitView) {
      setTimeout(() => fitView(), 0);
    }
  },
  setFollowLabelSize(nodeId, size) {
    set({
      followNodes: get().followNodes.map((node) => {
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
  onFollowNodesChange: (changes: NodeChange[]) => {
    const followNodes = get().followNodes;
    set({
      followNodes: applyNodeChanges(changes, followNodes),
    });
    return;
  },
  onFollowEdgesChange: (changes: EdgeChange[]) => {
    const followEdges = get().followEdges;
    set({
      followEdges: applyEdgeChanges(changes, followEdges),
    });
  },
  onFollowConnect:
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
      const nodes = get().followNodes;
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
      const edges = get().followEdges;
      const id = get().getFollowEdgeId();

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
        followEdges: addEdge(params, edges),
      });
    },
  toggleFollowDeletableAndConnectable: (
    deletable: boolean,
    connectable: boolean,
  ) => {
    set({
      followNodes: get().followNodes.map((node) => {
        return {
          ...node,
          connectable: connectable,
          data:
            // group nodes should always be deletable, so
            // we only change the deletable property of follow nodes
            node.type === "group"
              ? node.data
              : { ...node.data, deletable: deletable },
        };
      }),
      followEdges: get().followEdges.map((edge) => {
        edge.deletable = deletable;
        return edge;
      }),
    });
  },
  setFollowNodeEdgesHidden: (hidden: boolean) => {
    set({
      followEdges: get().followEdges.map((edge) => {
        if (!edge.data?.isGroupEdge) {
          return {
            ...edge,
            hidden: hidden,
          };
        }
        return edge;
      }),
    });
  },
  setExpandFollowParent: (expand: boolean) => {
    set({
      followNodes: get().followNodes.map((node) => {
        if (node.type !== "group") { // only edges between child nodes
          return {
            ...node,
            expandParent: expand,
          };
        }
        return node;
      }),
    });
  },
});
