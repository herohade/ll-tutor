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

import {
  EdgeData,
  EdgePathType,
  EmptyNodeSlice,
  NodeColor,
  NodeData,
} from "../types";

export const createEmptyNodeSlice: StateCreator<EmptyNodeSlice> = (
  set,
  get,
) => ({
  emptyIdCounter: 0,
  emptyNodeTypes: {},
  emptyEdgeTypes: {},
  emptySetupComplete: false,
  emptyNodes: [],
  emptyEdges: [],
  getEmptyNodeId: () => {
    const counter = get().emptyIdCounter;
    set({ emptyIdCounter: counter + 1 });
    return "EmptyNode" + counter;
  },
  getEmptyEdgeId: () => {
    const counter = get().emptyIdCounter;
    set({ emptyIdCounter: counter + 1 });
    return "EmptyEdge" + counter;
  },
  setEmptySetupComplete: (complete: boolean) => {
    set({ emptySetupComplete: complete });
  },
  setEmptyNodes: (nodes: Node<NodeData>[]) => {
    set({ emptyNodes: nodes });
  },
  setEmptyEdges: (edges: Edge<EdgeData>[]) => {
    set({ emptyEdges: edges });
  },
  onEmptyNodesChange: (changes: NodeChange[]) => {
    set({
      emptyNodes: applyNodeChanges(changes, get().emptyNodes),
    });
  },
  onEmptyEdgesChange: (changes: EdgeChange[]) => {
    set({
      emptyEdges: applyEdgeChanges(changes, get().emptyEdges),
    });
  },
  onEmptyConnect:
    (
      showSnackbar: (
        message: string,
        variant: VariantType,
        preventDuplicate: boolean,
      ) => void,
    ) =>
    (connection: Connection) => {
      if (connection.source === null || connection.target === null) {
        if (import.meta.env.DEV) {
          console.error(
            "Error Code 281966: Connection is not valid! Please contact the developer!",
          );
        }
        return;
      }
      const nodes = get().emptyNodes;
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
      const edges = get().emptyEdges;
      const id = get().getEmptyEdgeId();

      if (
        edges.some(
          (e) =>
            e.source === connection.source && e.target === connection.target,
        )
      ) {
        if (import.meta.env.DEV) {
          console.log("Edge already exists.", connection, edges);
        }
        showSnackbar("Edge " + edgeName + " already exists.", "error", true);
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
          isGroupEdge: false,
          name: edgeName,
        },
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          orient: "auto",
          // TODO: Check if this works
          color: sourceNode.data.empty ? NodeColor.thisTurn : NodeColor.none,
        },
        style: {
          strokeWidth: 2,
          stroke: sourceNode.data.empty ? NodeColor.thisTurn : NodeColor.none,
        },
      };
      set({
        emptyEdges: addEdge(params, edges),
      });
    },
  toggleEmptyDeletableAndConnectable: (
    deletable: boolean,
    connectable: boolean,
  ) => {
    set({
      emptyNodes: get().emptyNodes.map((node) => {
        node.deletable = deletable;
        node.connectable = connectable;
        return node;
      }),
      emptyEdges: get().emptyEdges.map((edge) => {
        edge.deletable = deletable;
        return edge;
      }),
    });
  },
});
