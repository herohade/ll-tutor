import { Edge, MarkerType, Node } from "reactflow";
import { EdgeData, EdgePathType, NodeColor, NodeData } from "../types";

// algorithm tarjan is
//     input: graph G = (V, E)
//     output: set of strongly connected components (sets of vertices)

//     index := 0
//     S := empty stack
//     for each v in V do
//         if v.index is undefined then
//             strongconnect(v)

//     function strongconnect(v)
//         // Set the depth index for v to the smallest unused index
//         v.index := index
//         v.lowlink := index
//         index := index + 1
//         S.push(v)
//         v.onStack := true

//         // Consider successors of v
//         for each (v, w) in E do
//             if w.index is undefined then
//                 // Successor w has not yet been visited; recurse on it
//                 strongconnect(w)
//                 v.lowlink := min(v.lowlink, w.lowlink)
//             else if w.onStack then
//                 // Successor w is in stack S and hence in the current SCC
//                 // If w is not on stack, then (v, w) is an edge pointing to an SCC already found and must be ignored
//                 // The next line may look odd - but is correct.
//                 // It says w.index not w.lowlink; that is deliberate and from the original paper
//                 v.lowlink := min(v.lowlink, w.index)

//         // If v is a root node, pop the stack and generate an SCC
//         if v.lowlink = v.index then
//             start a new strongly connected component
//             repeat
//                 w := S.pop()
//                 w.onStack := false
//                 add w to current strongly connected component
//             while w ≠ v
//             output the current strongly connected component

type TarjanNode = {
  id: string;
  name: string;
  index: number | undefined;
  lowlink: number | undefined;
  onStack: boolean;
};
type TarjanEdge = {
  id: string;
  name: string;
  source: TarjanNode;
  target: TarjanNode;
};

// sorts group nodes before child nodes
// this is required by reactflow
function sortChildAndGroupNodes(a: Node<NodeData>, b: Node<NodeData>): number {
  if (a.type === b.type) {
    return 0;
  }
  return a.type === "group" && b.type !== "group" ? -1 : 1;
}

// Returns a List of strongly connected components (sets of nodes and edges)
function groupNodesBySCC(
  nodeType: "first" | "follow",
  nodes: Node<NodeData>[],
  edges: Edge<EdgeData>[],
  getNodeId: () => string,
  getEdgeId: () => string,
): {
  nodes: Node<NodeData>[];
  edges: Edge<EdgeData>[];
} {
  if (import.meta.env.DEV) {
    if (nodes.some((node) => node.type != nodeType)) {
      console.error(
        "groupNodesBySCC: nodes must be " + nodeType + " set nodes",
        nodes,
      );
    }
    if (
      edges.some((edge) => {
        const sourceNode = nodes.find((node) => node.id === edge.source);
        const targetNode = nodes.find((node) => node.id === edge.target);
        return (
          sourceNode === undefined ||
          targetNode === undefined ||
          sourceNode.type !== nodeType ||
          targetNode.type !== nodeType
        );
      })
    ) {
      console.error(
        "groupNodesBySCC: edges must be between " + nodeType + " set nodes",
        edges,
      );
    }
  }
  const firstOrFollowAttributeNodes: Node<NodeData>[] = nodes.filter(
    (node) => node.type === nodeType,
  );
  const firstOrFollowAttributeEdges: Edge<EdgeData>[] = edges.filter((edge) => {
    const sourceNode = firstOrFollowAttributeNodes.find(
      (node) => node.id === edge.source,
    );
    const targetNode = firstOrFollowAttributeNodes.find(
      (node) => node.id === edge.target,
    );
    return sourceNode !== undefined && targetNode !== undefined;
  });

  const tarjanNodes: TarjanNode[] = firstOrFollowAttributeNodes.map((node) => ({
    id: node.id,
    name: node.data.name,
    index: undefined,
    lowlink: undefined,
    onStack: false,
  }));
  const tarjanEdges: TarjanEdge[] = firstOrFollowAttributeEdges.map((edge) => ({
    id: edge.id,
    name: edge.data!.name,
    source: tarjanNodes.find((node) => node.id === edge.source)!,
    target: tarjanNodes.find((node) => node.id === edge.target)!,
  }));

  if (import.meta.env.DEV) {
    console.log("calling trajan with", tarjanNodes, tarjanEdges);
  }
  const sccs: TarjanNode[][] = trajan(tarjanNodes, tarjanEdges);
  if (import.meta.env.DEV) {
    console.log("sccs", sccs);
  }

  const groupedNodes: Node<NodeData>[][] = [];
  const groupedEdges: Edge<EdgeData>[][] = [];
  const ungroupedEdges: Edge<EdgeData>[] = [];
  for (const scc of sccs) {
    const nodeGroup: Node<NodeData>[] = [];
    const edgeGroup: Edge<EdgeData>[] = [];
    for (const node of scc) {
      nodeGroup.push(
        firstOrFollowAttributeNodes.find((n) => n.id === node.id)!,
      );
    }
    for (const edge of firstOrFollowAttributeEdges) {
      if (nodeGroup.some((node) => node.id === edge.source)) {
        if (nodeGroup.some((node) => node.id === edge.target)) {
          edgeGroup.push(edge);
        } else {
          ungroupedEdges.push(edge);
        }
      }
    }
    groupedNodes.push(nodeGroup);
    groupedEdges.push(edgeGroup);
  }

  if (import.meta.env.DEV) {
    console.log("groupedNodes", groupedNodes);
    console.log("groupedEdges", groupedEdges);
    console.log("ungroupedEdges", ungroupedEdges);
  }

  const newNodes: Node<NodeData>[] = [];
  const newEdges: Edge<EdgeData>[] = [...firstOrFollowAttributeEdges];

  for (const nodeGroup of groupedNodes) {
    const superNodeId = getNodeId();
    const leftuppermostNode = nodeGroup.reduce((prev, curr) =>
      prev.position.x < curr.position.x ||
      (prev.position.x === curr.position.x && prev.position.y < curr.position.y)
        ? prev
        : curr,
    );
    // For Follow nodes, the names would be Follow(A), instead of A
    // so we have to extract the name from the node data
    const arrToName = nodeGroup
      .map((node) => node.data.name.match(/\((.+)\)/)?.[1] ?? node.data.name)
      .sort()
      .join(", ");
    // FirstNodes will be SCC(A, B, C)
    // FollowNodes will be Follow(SCC(A, B, C)) or Fε(SCC(A, B, C))
    // but the Fε ones should already exists, with this algorithm
    // we only create the Follow(SCC(A, B, C)) groupNodes
    const name =
      nodeType === "follow"
        ? "Follow(SCC(" + arrToName + "))"
        : "SCC(" + arrToName + ")";
    const superNode: Node<NodeData> = {
      id: superNodeId,
      type: "group",
      position: leftuppermostNode.position,
      deletable: false,
      data: {
        name,
        empty: false,
        color: NodeColor.none,
      },
    };
    newNodes.push(superNode);
    for (const node of nodeGroup) {
      newNodes.push({
        ...node,
        position: {
          x: node.position.x - superNode.position.x,
          y: node.position.y - superNode.position.y,
        },
        parentNode: superNodeId,
        extent: "parent",
      });
    }
  }

  const missingEdgeSet: Set<string> = new Set();
  // Here we only add edges between two different
  // strongly connected components
  // If we also wanted self-edges, we would have to
  // change ungroupedEdges to first/follow-AttributeEdges
  for (const edge of ungroupedEdges) {
    const sourceSccId = newNodes.find(
      (node) => node.id === edge.source,
    )!.parentNode;
    const targetSccId = newNodes.find(
      (node) => node.id === edge.target,
    )!.parentNode;
    missingEdgeSet.add(sourceSccId + "->" + targetSccId);
  }
  for (const missingEdge of missingEdgeSet) {
    const [sourceSccId, targetSccId] = missingEdge.split("->");
    const sourceScc = newNodes.find((node) => node.id === sourceSccId)!;
    const targetScc = newNodes.find((node) => node.id === targetSccId)!;
    const isGroupEdge =
      sourceScc.type === "group" && targetScc.type === "group";
    newEdges.push({
      id: getEdgeId(),
      type: "floating",
      source: sourceSccId,
      target: targetSccId,
      sourceNode: sourceScc,
      targetNode: targetScc,
      data: {
        pathType: EdgePathType.Straight,
        isGroupEdge: isGroupEdge,
        name: sourceScc.data.name + "->" + targetScc.data.name,
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
    });
  }

  return {
    nodes: newNodes.sort(sortChildAndGroupNodes),
    edges: newEdges,
  };
}

// pseudocode from https://en.wikipedia.org/wiki/Tarjan%27s_strongly_connected_components_algorithm
function trajan(
  tarjanNodes: TarjanNode[],
  tarjanEdges: TarjanEdge[],
): TarjanNode[][] {
  let index = 0;
  const s: TarjanNode[] = [];
  const sccs: TarjanNode[][] = [];

  for (const node of tarjanNodes) {
    if (node.index === undefined) {
      strongconnect(node);
    }
  }

  function strongconnect(v: TarjanNode) {
    // Set the depth index for v to the smallest unused index
    v.index = index;
    v.lowlink = index;
    index++;
    s.push(v);
    v.onStack = true;

    // Consider successors of v
    const outgoingEdges = tarjanEdges.filter((edge) => edge.source === v);
    for (const edge of outgoingEdges) {
      const w = edge.target;
      if (w.index === undefined) {
        // Successor w has not yet been visited; recurse on it
        if (import.meta.env.DEV) {
          console.log("recursing on", w.name, "from", v.name);
        }
        strongconnect(w);
        v.lowlink = Math.min(v.lowlink, w.lowlink!);
      } else if (w.onStack) {
        // Successor w is in stack S and hence in the current SCC
        // If w is not on stack, then (v, w) is an edge pointing to an SCC already found and must be ignored
        // The next line may look odd - but is correct.
        // It says w.index not w.lowlink; that is deliberate and from the original paper
        v.lowlink = Math.min(v.lowlink, w.index);
      }
    }
    if (import.meta.env.DEV) {
      console.log(
        "done recursing on",
        v.name,
        "lowlink",
        v.lowlink,
        "index",
        v.index,
      );
    }

    // If v is a root node, pop the stack and generate an SCC
    if (v.lowlink === v.index) {
      const scc: TarjanNode[] = [];
      let w: TarjanNode;
      do {
        w = s.pop()!;
        w.onStack = false;
        scc.push(w);
      } while (w !== v);
      sccs.push(scc);
    }
  }

  return sccs;
}

export { groupNodesBySCC };
