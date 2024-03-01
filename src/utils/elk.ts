import { Edge, Node, useReactFlow } from "reactflow";

import { useCallback } from "react";

import {
  EdgeData,
  ElkDirectionType,
  NodeData,
  layoutElementsInterface,
} from "../types";

import ELK, { ElkLabel, ElkNode, LayoutOptions } from "elkjs/lib/elk-api";
const elk = new ELK({
  workerUrl: new URL(
    "../../node_modules/elkjs/lib/elk-worker.min.js",
    import.meta.url,
  ).href,
});

/**
 * This hook provides a {@link layoutElements | function} to layout the nodes
 * and edges of a graph.
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
 * @param emptyNodes - The nodes of the empty-graph.
 * @param emptyEdges - The edges of the empty-graph.
 * @param setEmptyNodes - The function to set the nodes of the empty-graph.
 * @param setEmpyEdges - The function to set the edges of the empty-graph.
 *
 * @param firstNodes - The nodes of the first-graph.
 * @param firstEdges - The edges of the first-graph.
 * @param setFirstNodes - The function to set the nodes of the first-graph.
 * @param setFirstEdges - The function to set the edges of the first-graph.
 *
 * @param followNodes - The nodes of the follow-graph.
 * @param followEdges - The edges of the follow-graph.
 * @param setFollowNodes - The function to set the nodes of the follow-graph.
 * @param setFollowEdges - The function to set the edges of the follow-graph.
 *
 * @returns The {@link layoutElements} function.
 */
const useLayoutedElements = (
  emptyNodes: Node<NodeData>[],
  emptyEdges: Edge<EdgeData>[],
  setEmptyNodes: (nodes: Node<NodeData>[], fitView?: () => void) => void,
  setEmpyEdges: (edges: Edge<EdgeData>[], fitView?: () => void) => void,
  firstNodes: Node<NodeData>[],
  firstEdges: Edge<EdgeData>[],
  setFirstNodes: (nodes: Node<NodeData>[], fitView?: () => void) => void,
  setFirstEdges: (edges: Edge<EdgeData>[], fitView?: () => void) => void,
  followNodes: Node<NodeData>[],
  followEdges: Edge<EdgeData>[],
  setFollowNodes: (nodes: Node<NodeData>[], fitView?: () => void) => void,
  setFollowEdges: (edges: Edge<EdgeData>[], fitView?: () => void) => void,
) => {
  const { fitView } = useReactFlow();

  /**
   * {@link layoutElementsInterface}
   */
  const layoutElements: layoutElementsInterface = useCallback(
    (
      whichNodes: "empty" | "first" | "follow" | "provided",
      options?: LayoutOptions,
      nodes?: Node<NodeData>[],
      edges?: Edge<EdgeData>[],
      setNodes?: (nodes: Node<NodeData>[], fitView?: () => void) => void,
      setEdges?: (edges: Edge<EdgeData>[], fitView?: () => void) => void,
      // Since this step can take a while, we may want to do something
      // once the layouting is done. (e.g. set a 'loading' state to false)
      cb?: () => void,
    ) => {
      // Which nodes and edges to layout, depending on the whichNodes parameter
      const relevantNodes =
        nodes ||
        (whichNodes === "empty"
          ? emptyNodes
          : whichNodes === "first"
            ? firstNodes
            : followNodes);
      const relevantEdges =
        edges ||
        (whichNodes === "empty"
          ? emptyEdges
          : whichNodes === "first"
            ? firstEdges
            : followEdges);
      const relevantSetNodes =
        setNodes ||
        (whichNodes === "empty"
          ? setEmptyNodes
          : whichNodes === "first"
            ? setFirstNodes
            : setFollowNodes);
      const relevantSetEdges =
        setEdges ||
        (whichNodes === "empty"
          ? setEmpyEdges
          : whichNodes === "first"
            ? setFirstEdges
            : setFollowEdges);

      const direction = (
        options ? options["elk.direction"] : "RIGHT"
      ) as ElkDirectionType;
      const isRight = direction === "RIGHT";
      const isLeft = direction === "LEFT";
      const isUp = direction === "UP";
      const targetPosition = isRight
        ? "left"
        : isLeft
          ? "right"
          : isUp
            ? "bottom"
            : "top";
      const sourcePosition = isRight
        ? "right"
        : isLeft
          ? "left"
          : isUp
            ? "top"
            : "bottom";
      const layoutOptions: LayoutOptions = {
        "elk.algorithm": "layered",
        "elk.direction": "RIGHT",
        "elk.edgeRouting": "SPLINES",
        "elk.interactive": "true",
        "elk.spacing.nodeNode": "100",
        "elk.spacing.edgeNode": "100",
        "elk.layered.spacing.nodeNodeBetweenLayers": "100",
        "elk.hierarchyHandling": "INCLUDE_CHILDREN",
        "elk.nodeLabels.placement": "[INSIDE, H_LEFT, V_TOP]",
        ...options,
      };
      const childLayoutOptions: LayoutOptions = {
        ...layoutOptions,
        // without this, the layouting crashes
        "elk.algorithm": "",
      };

      // Here we convert the nodes and edges to ELK's format
      // This only works if there are no grandchildren
      // i.e. if there are no nodes with children that have children
      const children: ElkNode[] = [];
      for (const node of relevantNodes) {
        // First we add the nodes that have no parent
        if (node.parentNode === undefined) {
          const label: ElkLabel[] | undefined =
            node.type === "group"
              ? [
                  {
                    text: "",
                    x: 0,
                    y: 0,
                    width: node.data.labelSize?.width ?? 120,
                    height: node.data.labelSize?.height ?? 110,
                  },
                ]
              : undefined;
          if (import.meta.env.DEV) {
            console.log("label for", node.data.name, label?.[0]);
          }
          children.push({
            id: node.id,
            layoutOptions: childLayoutOptions,
            children: [],
            labels: label,
            width: node.width ?? (node.type === "group" ? 100 : 80),
            height: node.height ?? (node.type === "group" ? 100 : 80),
          });
        }
      }
      for (const node of relevantNodes) {
        // Second we add the nodes that have a parent
        if (node.parentNode !== undefined) {
          const parentIndex = children.findIndex(
            (child) => child.id === node.parentNode,
          );
          if (parentIndex === -1) {
            throw new Error("Parent not found");
          }
          children[parentIndex].children!.push({
            id: node.id,
            layoutOptions: childLayoutOptions,
            children: [],
            width: node.width ?? 67,
            height: node.height ?? 67,
          });
        }
      }

      if (import.meta.env.DEV) {
        console.log("children", children);
      }

      // ELK needs a root node to layout the graph
      // so we create a root node with the relevant children and edges
      const graph: ElkNode = {
        id: "root",
        layoutOptions: layoutOptions,
        children: children,
        edges: relevantEdges.map((edge) => ({
          id: edge.id,
          sources: [edge.source],
          targets: [edge.target],
        })),
      };

      elk
        .layout(graph, {
          // The following options crash the layouting with a NullPointerException lol
          // logging: import.meta.env.DEV,
          // measureExecutionTime: import.meta.env.DEV,
        })
        .then(({ children: elkNodes, edges: elkEdges, ...rest }) => {
          if (import.meta.env.DEV) {
            console.log("rest", rest);
          }
          if (!elkNodes || !elkEdges) {
            throw new Error("No children or edges returned from ELK");
          }
          if (import.meta.env.DEV) {
            console.log("elkNodes", elkNodes);
            console.log("elkEdges", elkEdges);
          }
          // Here we convert the layouted nodes and edges back to
          // react-flow's format
          const newNodes: Node<NodeData>[] = elkNodes.flatMap((node) => {
            const initialNode = relevantNodes.find((n) => n.id === node.id);
            if (!initialNode) {
              throw new Error("Node not found");
            }
            const children =
              node.children?.map((child) => {
                const initialChild = relevantNodes.find(
                  (n) => n.id === child.id,
                );
                if (!initialChild) {
                  throw new Error("Child not found");
                }
                return {
                  ...initialChild,
                  position: {
                    x: child.x,
                    y: child.y,
                  },
                  sourcePosition,
                  targetPosition,
                } as Node<NodeData>;
              }) ?? [];
            return [
              {
                ...initialNode,
                position: {
                  x: node.x,
                  y: node.y,
                },
                sourcePosition,
                targetPosition,
                width: children.length > 0 ? node.width : initialNode.width,
                height: children.length > 0 ? node.height : initialNode.height,
                style:
                  children.length > 0
                    ? {
                        ...initialNode.style,
                        width: node.width,
                        height: node.height,
                      }
                    : initialNode.style,
              } as Node<NodeData>,
              ...children,
            ];
          });
          const newEdges: Edge<EdgeData>[] = elkEdges.map((edge) => {
            const initialEdge = relevantEdges.find((e) => e.id === edge.id);
            if (!initialEdge) {
              throw new Error("Edge not found");
            }
            return {
              ...initialEdge,
              source: edge.sources[0],
              target: edge.targets[0],
            } as Edge<EdgeData>;
          });

          if (import.meta.env.DEV) {
            console.log("newNodes", newNodes);
            console.log("newEdges", newEdges);
          }

          relevantSetNodes(newNodes);
          relevantSetEdges(newEdges, fitView);

          if (cb) {
            cb();
          }
        });
    },
    [
      emptyNodes,
      emptyEdges,
      setEmptyNodes,
      setEmpyEdges,
      firstNodes,
      firstEdges,
      setFirstNodes,
      setFirstEdges,
      followNodes,
      followEdges,
      setFollowNodes,
      setFollowEdges,
      fitView,
    ],
  );

  return {
    /**
     * {@link layoutElementsInterface}
     * {@inheritDoc layoutElementsInterface}
     */
    layoutElements,
  };
};

export { useLayoutedElements };
