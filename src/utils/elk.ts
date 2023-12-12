import { Edge, Node, useReactFlow } from "reactflow";

import { useCallback } from "react";

import { EdgeData, ElkDirectionType, NodeData } from "../types";

import ELK, { ElkLabel, ElkNode, LayoutOptions } from "elkjs/lib/elk-api";
const elk = new ELK({
  workerUrl: new URL(
    "../../node_modules/elkjs/lib/elk-worker.min.js",
    import.meta.url,
  ).href,
});

const useLayoutedElements = (
  emptyNodes: Node<NodeData>[],
  emptyEdges: Edge<EdgeData>[],
  setEmptyNodes: (nodes: Node<NodeData>[]) => void,
  setEmpyEdges: (edges: Edge<EdgeData>[]) => void,
) => {
  const { fitView } = useReactFlow();

  const layoutElements = useCallback(
    (options?: LayoutOptions) => {
      const relevantNodes = emptyNodes;
      const relevantEdges = emptyEdges;
      const relevantSetNodes = setEmptyNodes;
      const relevantSetEdges = setEmpyEdges;

      const direction = (
        options ? options["elk.direction"] : "DOWN"
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
        "elk.direction": "DOWN",
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

      // this only works if there are no grandchildren
      // i.e. if there are no nodes with children that have children
      const children: ElkNode[] = [];
      for (const node of relevantNodes) {
        if (node.parentNode === undefined) {
          const label: ElkLabel[] | undefined =
            node.type === "group"
              ? [
                  {
                    text: "",
                    x: 0,
                    y: 0,
                    width: node.data.labelSize?.width ?? 0,
                    height: node.data.labelSize?.height ?? 0,
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
            width: node.width ?? undefined,
            height: node.height ?? undefined,
          });
        }
      }
      for (const node of relevantNodes) {
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
            width: node.width ?? undefined,
            height: node.height ?? undefined,
          });
        }
      }

      if (import.meta.env.DEV) {
        console.log("children", children);
      }

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
          // The following options crash the layouting with a NullPointerException LMAO
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
          const newNodes: Node<NodeData>[] = elkNodes.flatMap((node) => {
            const initialNode = relevantNodes.find((n) => n.id === node.id);
            if (!initialNode) {
              throw new Error("Node not found");
            }
            const children = node.children?.map((child) => {
              const initialChild = relevantNodes.find((n) => n.id === child.id);
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
            });
            return [
              {
                ...initialNode,
                position: {
                  x: node.x,
                  y: node.y,
                },
                sourcePosition,
                targetPosition,
                width: children ? node.width : initialNode.width,
                height: children ? node.height : initialNode.height,
                style: children
                  ? {
                      ...initialNode.style,
                      width: node.width,
                      height: node.height,
                    }
                  : initialNode.style,
              } as Node<NodeData>,
              ...(children ?? []),
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
          relevantSetEdges(newEdges);
          window.requestAnimationFrame(() => {
            fitView();
          });
        });
    },
    [
      emptyNodes,
      emptyEdges,
      setEmptyNodes,
      setEmpyEdges,
      fitView,
    ],
  );

  return { layoutElements };
};

export { useLayoutedElements };
