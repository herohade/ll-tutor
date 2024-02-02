import { Edge, MarkerType, Node } from "reactflow";
import { EdgeData, EdgePathType, NodeColor, NodeData } from "../types";

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

/**
 * Function to sort nodes by type
 * Group nodes are sorted before child nodes
 *
 * @remarks
 *
 * Reactflow requires that group nodes are sorted before child nodes
 * to display the graph correctly
 *
 * @param a - Node a
 * @param b - Node b
 *
 * @returns 0 if both nodes are of the same type,
 * -1 if a is a group node and b is not,
 * 1 if b is a group node and a is not
 */
function sortChildAndGroupNodes(a: Node<NodeData>, b: Node<NodeData>): number {
  if (a.type === b.type) {
    return 0;
  }
  return a.type === "group" && b.type !== "group" ? -1 : 1;
}

/**
 * Function to group first or follow nodes into strongly connected components
 *
 * @remarks
 *
 * This function uses Tarjan's algorithm to group nodes into
 * strongly connected components. It then creates a new node
 * for each component and adds the original nodes as children.
 * It also adds edges between the new nodes if there are edges
 * between their children (original nodes) from different
 * strongly connected components.
 *
 * @example
 *
 * ### Graph before grouping
 * ```ts
 * const nodes = [
 *  { id: "A", type: "first", ...rest },
 *  { id: "B", type: "first", ...rest },
 * ];
 * const edges = [
 *  { id: "A->B", source: "A", target: "B", ...rest },
 * ];
 * ```
 *
 * ### Graph after grouping
 * ```ts
 * const nodes = [
 *  { id: "SCC(A)", type: "group", ...rest },
 *  { id: "SCC(B)", type: "group", ...rest },
 *  { id: "A", type: "first", parentNode: "SCC(A)", ...rest },
 *  { id: "B", type: "first", parentNode: "SCC(B)", ...rest },
 * ];
 * const edges = [
 *  { id: "A->B", source: "A", target: "B", ...rest },
 *  { id: "SCC(A)->SCC(B)", source: "SCC(A)", target: "SCC(B)", ...rest },
 * ];
 * ```
 *
 * @param nodeType - The type of the nodes to group
 * @param nodes - The nodes to group
 * @param edges - The edges to group
 * @param getNodeId - Function to get a new node id
 * @param getEdgeId - Function to get a new edge id
 *
 * @returns An object containing the new nodes and edges
 */
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
  // Ideally we would only get first or follow nodes but we
  // might get group nodes as well. These will be ignored.
  // Here we warn the user if we get any of those.
  if (import.meta.env.DEV) {
    if (nodes.some((node) => node.type != nodeType)) {
      console.warn(
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
      console.warn(
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

  // Here we group the nodes (and edges) into arrays
  // representing the strongly connected components.
  // Edges that are not between nodes in the same
  // strongly connected component are stored separately.
  const groupedNodes: Node<NodeData>[][] = [];
  const groupedEdges: Edge<EdgeData>[][] = []; // only for debugging
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
  // Now we create new nodes for the strongly connected components
  // and add the original nodes as children.
  for (const nodeGroup of groupedNodes) {
    // For Follow nodes, the names would be Follow(A), instead of A
    // so we have to extract the name from the node data.
    // The result is a string like "A, B, C" for the nodes A, B, C.
    const arrToName = nodeGroup
      .map((node) => node.data.name.match(/\((.+)\)/)?.[1] ?? node.data.name)
      .sort()
      .join(", ");
    // FirstNodes will be SCC(A, B, C)
    // FollowNodes will be Follow(SCC(A, B, C)) or Fε(SCC(A, B, C))
    const name =
      nodeType === "follow"
        ? nodeGroup[0].data.name.startsWith("Follow(")
          ? "Follow(SCC(" + arrToName + "))"
          : "Fε(SCC(" + arrToName + "))"
        : "SCC(" + arrToName + ")";

    // get the original node if it exists
    const oldNode: Node<NodeData> | undefined =
      nodeType === "follow" && nodeGroup[0].data.name.startsWith("Fε(")
        ? nodes.find((node) => node.data.name === name)
        : undefined;

    let superNode;
    if (oldNode !== undefined) {
      superNode = oldNode;
    } else {
      const leftuppermostNode = nodeGroup.reduce((prev, curr) =>
        prev.position.x < curr.position.x ||
        (prev.position.x === curr.position.x &&
          prev.position.y < curr.position.y)
          ? prev
          : curr,
      );
      superNode = {
        id: getNodeId(),
        type: "group",
        position: leftuppermostNode.position,
        deletable: false,
        data: {
          name,
          empty: false,
          color: NodeColor.none,
        },
      };
    }

    newNodes.push(superNode);

    for (const node of nodeGroup) {
      newNodes.push({
        ...node,
        position: {
          x: node.position.x - superNode.position.x,
          y: node.position.y - superNode.position.y,
        },
        parentNode: superNode.id,
        // The parent should expand to fit the children
        // so we set the children to expand their parent.
        // This will be changed after the layouting is done.
        extent: "parent",
      });
    }
  }

  const missingEdgeSet: Set<string> = new Set();
  // We only add edges between two different
  // strongly connected components.
  // If we also wanted self-edges, we would have to
  // change ungroupedEdges to first/follow-AttributeEdges.
  // To filter duplicate edges, we use a set. This could
  // happen if multiple children of a strongly connected
  // component have an edge to children of another one.
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

    // When this function is called from the Follow setup page,
    // the nodes passed in actually already contain the Fε(SCC()) nodes.
    // We simply ignored them above and created new ones which was fine.
    // The edges between them however are a little different to the ones
    // added by the user. Instead of adding new edges, we simply update
    // the existing ones.
    if (
      sourceScc.data.name.startsWith("Fε(SCC(") &&
      targetScc.data.name.startsWith("Fε(SCC(")
    ) {
      const oldEdge = edges.find(
        (edge) =>
          edge.data?.name === sourceScc.data.name + "->" + targetScc.data.name,
      );
      if (oldEdge !== undefined) {
        newEdges.push({
          ...oldEdge,
          source: sourceSccId,
          target: targetSccId,
          sourceNode: newNodes.find((node) => node.id === sourceSccId)!,
          targetNode: newNodes.find((node) => node.id === targetSccId)!,
        });
        continue;
      }
    }

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

/**
 * Function to group nodes into strongly connected components
 * using Tarjan's algorithm
 * 
 * @privateRemarks
 * 
 * Inspired by pseudocode from
 * https://en.wikipedia.org/wiki/Tarjan%27s_strongly_connected_components_algorithm
 * 
 * @param tarjanNodes - The nodes to group
 * @param tarjanEdges - The edges between the nodes
 * 
 * @returns An array of strongly connected components (arrays of nodes)
 */
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
        // If w is not on stack, then (v, w) is an edge pointing to an SCC
        // already found and must be ignored
        // The next line may look odd - but is correct.
        // It says w.index not w.lowlink; that is deliberate and from the
        // original paper
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
