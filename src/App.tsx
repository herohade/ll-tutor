import Typography from "@mui/material/Typography";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";

import { VariantType, useSnackbar } from "notistack";

import ReactFlow, {
  Background,
  BackgroundVariant,
  Edge,
  Node,
  ReactFlowProvider,
} from "reactflow";

import { MouseEvent as ReactMouseEvent, useCallback, useState } from "react";

import useBoundStore from "./store/store";
import { shallow } from "zustand/shallow";

import {
  DisplayResultPage,
  EmptyAlgorithmPage,
  FirstAlgorithmPage,
  FollowAlgorithmPage,
  PrepareEmptyAlgorithmPage,
  PrepareFirstAlgorithmPage,
  PrepareFollowAlgorithmPage,
  ReadGrammarPage,
  SelectStartSymbolPage,
  StartPage,
} from "./pages";

import {
  ConnectionLine,
  CustomControls,
  HeaderComponent,
  ProgressDrawerComponent,
  TutorialComponent,
} from "./components";

import {
  EdgeData,
  EmptyNodeSlice,
  FirstNodeSlice,
  FollowNodeSlice,
  NavigationSlice,
  NodeData,
} from "./types";

/**
 * The main component of the application.
 * It contains the header, the progress drawer, and the page content.
 *
 * @returns The main component of the application containing the page layout.
 */
export default function App() {
  const selector = (
    state: NavigationSlice & EmptyNodeSlice & FirstNodeSlice & FollowNodeSlice,
  ) => ({
    // NavigationSlice
    page: state.page,
    // EmptyNodeSlice
    emptyNodeTypes: state.emptyNodeTypes,
    emptyEdgeTypes: state.emptyEdgeTypes,
    emptyNodes: state.emptyNodes,
    emptyEdges: state.emptyEdges,
    onEmptyNodesChange: state.onEmptyNodesChange,
    onEmptyEdgesChange: state.onEmptyEdgesChange,
    onEmptyConnect: state.onEmptyConnect,
    // FirstNodeSlice
    firstNodeTypes: state.firstNodeTypes,
    firstEdgeTypes: state.firstEdgeTypes,
    firstNodes: state.firstNodes,
    firstEdges: state.firstEdges,
    setFirstNodes: state.setFirstNodes,
    setFirstEdges: state.setFirstEdges,
    onFirstNodesChange: state.onFirstNodesChange,
    onFirstEdgesChange: state.onFirstEdgesChange,
    onFirstConnect: state.onFirstConnect,
    // FollowNodeSlice
    followNodeTypes: state.followNodeTypes,
    followEdgeTypes: state.followEdgeTypes,
    followNodes: state.followNodes,
    followEdges: state.followEdges,
    setFollowNodes: state.setFollowNodes,
    setFollowEdges: state.setFollowEdges,
    onFollowNodesChange: state.onFollowNodesChange,
    onFollowEdgesChange: state.onFollowEdgesChange,
    onFollowConnect: state.onFollowConnect,
  });
  const {
    // NavigationSlice
    page,
    // EmptyNodeSlice
    emptyNodeTypes,
    emptyEdgeTypes,
    emptyNodes,
    emptyEdges,
    onEmptyNodesChange,
    onEmptyEdgesChange,
    onEmptyConnect,
    // FirstNodeSlice
    firstNodeTypes,
    firstEdgeTypes,
    firstNodes,
    firstEdges,
    setFirstNodes,
    setFirstEdges,
    onFirstNodesChange,
    onFirstEdgesChange,
    onFirstConnect,
    // FollowNodeSlice
    followNodeTypes,
    followEdgeTypes,
    followNodes,
    followEdges,
    setFollowNodes,
    setFollowEdges,
    onFollowNodesChange,
    onFollowEdgesChange,
    onFollowConnect,
  } = useBoundStore(selector, shallow);

  const { enqueueSnackbar } = useSnackbar();

  const showSnackbar = useCallback(
    (message: string, variant: VariantType, preventDuplicate: boolean) => {
      // variant could be success, error, warning, info, or default
      enqueueSnackbar(message, {
        variant,
        preventDuplicate,
      });
    },
    [enqueueSnackbar],
  );

  /**
   * Function to get the group nodes that intersect with a given node.
   *
   * @remarks
   *
   * This function is used to get the group nodes that intersect with a
   * given node. If the given node is a group node, it will not be included
   * in the returned array.
   *
   * @param node - The node to check for intersections.
   * @param nodes - The nodes to check for intersections with the given node.
   *
   * @returns An array of nodes that intersect with the given node.
   */
  const getIntersectingGroupNodes = (
    node: Node<NodeData>,
    nodes: Node<NodeData>[],
  ): Node<NodeData>[] => {
    const intersections: Node<NodeData>[] = [];

    for (const n of nodes) {
      if (n.type === "group" && n.id !== node.id) {
        const nodeBoundingBox = {
          x: node.position.x,
          y: node.position.y,
          width: node.width || 0,
          height: node.height || 0,
        };
        const nBoundingBox = {
          x: n.position.x,
          y: n.position.y,
          width: n.width || 0,
          height: n.height || 0,
        };
        if (
          nodeBoundingBox.x < nBoundingBox.x + nBoundingBox.width &&
          nodeBoundingBox.x + nodeBoundingBox.width > nBoundingBox.x &&
          nodeBoundingBox.y < nBoundingBox.y + nBoundingBox.height &&
          nodeBoundingBox.y + nodeBoundingBox.height > nBoundingBox.y
        ) {
          intersections.push(n);
        }
      }
    }
    return intersections;
  };

  /**
   * Function to add an intersecting group node as a first nodes parent
   *
   * @remarks
   *
   * This function is used to add a group node as a first nodes parent
   * if the dragged first node does not already have one and is dragged
   * on top of a group node.
   *
   * @param _event - (unused) The mouse event that triggered the drag stop.
   * @param node - The node that was dragged.
   *
   * @returns void
   */
  const onFirstNodeDragStop = useCallback(
    (_event: ReactMouseEvent, node: Node<NodeData>) => {
      if (node.type !== "first" || node.parentNode) {
        return;
      }
      if (import.meta.env.DEV) {
        console.log("Drag stopped");
      }

      const intersections: Node<NodeData>[] = getIntersectingGroupNodes(
        node,
        firstNodes,
      );
      // It seems that later elements are rendered on top of earlier ones and
      // it is more natural to have the node bind to the group node that is
      // the most visible one / the one on top (if there are multiple).
      // This is why we use the last element of the intersections array
      // as this is the one that is rendered on top
      const groupNode = intersections[intersections.length - 1];
      if (import.meta.env.DEV) {
        console.log(intersections);
      }

      // Only if there is an intersection on drag stop, we want to attach the
      // node to its new parent
      if (groupNode !== undefined) {
        const newNodes: Node<NodeData>[] = firstNodes.map((n) => {
          if (n.id === node.id) {
            const position = {
              x: node.position.x - groupNode.position.x,
              y: node.position.y - groupNode.position.y,
            };

            return {
              ...n,
              position,
              parentNode: groupNode.id,
              extent: "parent",
              // we need to set dragging = false, because the internal change
              // of the dragging state is not applied yet, so the node would
              // be rendered as dragging
              dragging: false,
            } as Node<NodeData>;
          } else {
            if (n.id === groupNode.id) {
              // We get a GroupNode name like SCC(A, B, C). Since we want to add
              // a child node to the group node, we need to add its name:
              //
              // 1. The following matches string in SCC(string) in result[1]:
              // .match(/^SCC\((.*)\)$/)
              //
              // 2. With name.split(", ") we get an array of child names.
              // This also works if a name is ",".
              // ("A, ,,B" ===> "A" and "," and "B")
              //
              // 3. We add the new child name
              //
              // 4. With array.join(", ") we add the names together again.
              //
              // 5. With SCC(result[1]), we get the new group node name.

              const oldGroupNodeName = groupNode.data.name;
              // 1. We get the child names: "A, B, C,..."
              const [, matchedName] = oldGroupNodeName.match(
                /^SCC\((.*)\)$/,
              ) || [undefined, undefined];

              if (matchedName === undefined) {
                if (import.meta.env.DEV) {
                  console.log(
                    "Error Code b538b0: no name matched in group node name",
                    oldGroupNodeName,
                    matchedName,
                  );
                }
                showSnackbar(
                  "Error Code b538b0: Please contact the developer!",
                  "error",
                  true,
                );
                return n;
              }

              if (import.meta.env.DEV) {
                console.log(
                  "old groupnode name",
                  oldGroupNodeName,
                  "matched name",
                  matchedName,
                );
              }

              // 2. + 3. + 4. We split the name into the child names,
              // add the new child name, sort the array,
              // and join the names again.
              const newName =
                matchedName.length > 0
                  ? matchedName
                      .split(", ")
                      .concat([node.data.name])
                      .sort()
                      .join(", ")
                  : node.data.name;
              // 5. We create the new group node name with the new child name.
              const newGroupNodeName = "SCC(" + newName + ")";

              if (import.meta.env.DEV) {
                console.log("new groupnode name", newName, newGroupNodeName);
              }

              return {
                ...n,
                data: {
                  ...groupNode.data,
                  name: newGroupNodeName,
                },
              } as Node<NodeData>;
            }
          }

          return n;
        });
        // We also need to update the edge names (sourcename->targetname)
        // for the edges that are connected to the group node we just changed.
        const newEdges: Edge<EdgeData>[] = firstEdges.map((edge) => {
          if (edge.source === groupNode.id || edge.target === groupNode.id) {
            // Get the new names and nodes if they are new,
            // else use the old ones
            const newSource =
              edge.source === groupNode.id ? groupNode.id : edge.source;
            const newSourceNode: Node<NodeData> | undefined =
              edge.source === groupNode.id
                ? newNodes.find((node) => node.id === groupNode.id)
                : edge.sourceNode;
            const newTarget =
              edge.target === groupNode.id ? groupNode.id : edge.target;
            const newTargetNode: Node<NodeData> | undefined =
              edge.target === groupNode.id
                ? newNodes.find((node) => node.id === groupNode.id)
                : edge.targetNode;
            if (!newSourceNode || !newTargetNode || !edge.data) {
              throw new Error("new source or target node not found or no data");
            }
            return {
              ...edge,
              source: newSource,
              sourceNode: newSourceNode,
              target: newTarget,
              targetNode: newTargetNode,
              data: {
                ...edge.data,
                name: newSourceNode.data.name + "->" + newTargetNode.data.name,
              },
            };
          } else {
            return edge;
          }
        });

        setFirstNodes(newNodes);
        setFirstEdges(newEdges);
      }
    },
    [firstNodes, firstEdges, setFirstNodes, setFirstEdges, showSnackbar],
  );

  // Function to add a group node as a follow nodes parent
  // if the dragged follow node does not already have one
  // and is dragged on top of a group node
  /**
   * Function to add an intersecting group node as a follow nodes parent
   *
   * @remarks
   *
   * This function is used to add a group node as a follow nodes parent
   * if the dragged follow node does not already have one and is dragged
   * on top of a group node.
   *
   * @param _event - (unused) The mouse event that triggered the drag stop.
   * @param node - The node that was dragged.
   *
   * @returns void
   */
  const onFollowNodeDragStop = useCallback(
    (_event: ReactMouseEvent, node: Node<NodeData>) => {
      if (node.type !== "follow" || node.parentNode) {
        return;
      }
      if (import.meta.env.DEV) {
        console.log("Drag stopped");
      }

      const intersections: Node<NodeData>[] = getIntersectingGroupNodes(
        node,
        followNodes,
      );
      // It seems that later elements are rendered on top of earlier ones and
      // it is more natural to have the node bind to the group node that is
      // the most visible one / the one on top (if there are multiple).
      // This is why we use the last element of the intersections array
      // as this is the one that is rendered on top
      const groupNode = intersections[intersections.length - 1];
      if (import.meta.env.DEV) {
        console.log(intersections);
      }

      // Only if there is an intersection on drag stop, we want to attach the
      // node to its new parent
      if (groupNode !== undefined) {
        // We don't want to add a Follow child node to an F-epsilon group node
        // or vice versa (though the latter should not happen anyway).
        // So we check if the parent and child node have the same prefix.
        // Prefixes can be "Follow" or "Fε".
        const gName = groupNode.data.name;
        const cName = node.data.name;
        const gPrefix = gName.match(/(^[^(]+)\(.*\)$/)?.[1];
        const cPrefix = cName.match(/(^[^(]+)\(.*\)$/)?.[1];
        if (gPrefix !== cPrefix) {
          if (import.meta.env.DEV) {
            console.log("child:", cName, "group:", gName);
          }
          showSnackbar(
            "Error: You can not add a " +
              cPrefix +
              " node to a " +
              gPrefix +
              " group node!",
            "error",
            true,
          );
          return;
        }

        const newNodes: Node<NodeData>[] = followNodes.map((n) => {
          if (n.id === node.id) {
            const position = {
              x: node.position.x - groupNode.position.x,
              y: node.position.y - groupNode.position.y,
            };

            return {
              ...n,
              position,
              parentNode: groupNode.id,
              extent: "parent",
              // we need to set dragging = false, because the internal change
              // of the dragging state is not applied yet, so the node would
              // be rendered as dragging
              dragging: false,
            } as Node<NodeData>;
          } else {
            if (n.id === groupNode.id) {
              // We get a GroupNode name like F...(SCC(A, B, C)) or SCC(A, B, C)
              // with F... either Follow or Fε
              //
              // 1. The following matches string from F...(SCC(string)) in
              // result[2] and string from SCC(string) in result[3].
              // F... if it exists is matched in result[1], else it's undefined:
              // .match(/(^F[^(]+)\(SCC\((.*)\)\)$|^SCC\((.*)\)$/)
              //
              // 2. With name.split(", ") we get an array of names.
              // This also works if a name is ",".
              // ("A, ,,B" ===> "A" and "," and "B")
              //
              // 3. We add the new child name
              //
              // 4. With array.join(", ") we add the names together again.
              //
              // 5. With result[1] + (SCC(result[2])) or SCC(result[3]),
              // we get the new group node name.

              const oldGroupNodeName = groupNode.data.name;
              // 1. We get the child names: "A, B, C,..." and prefix
              const [, prefix, nameIfPrefix, nameIfNoPrefix] =
                oldGroupNodeName.match(
                  /(^F[^(]+)\(SCC\((.*)\)\)$|^SCC\((.*)\)$/,
                ) || [undefined, undefined, undefined, undefined];

              const matchedName = nameIfPrefix ?? nameIfNoPrefix;

              if (matchedName === undefined) {
                if (import.meta.env.DEV) {
                  console.log(
                    "Error Code 73deac: no name matched in group node name",
                    oldGroupNodeName,
                    matchedName,
                    nameIfPrefix,
                    nameIfNoPrefix,
                  );
                }
                showSnackbar(
                  "Error Code 73deac: Please contact the developer!",
                  "error",
                  true,
                );
                return n;
              }

              if (import.meta.env.DEV) {
                console.log(
                  "old groupnode name",
                  oldGroupNodeName,
                  "matched name",
                  matchedName,
                );
              }

              // 2. + 3. + 4. We split the name into the child names,
              // add the new child name, sort the array,
              // and join the names again.
              const newName =
                matchedName.length > 0
                  ? matchedName
                      .split(", ")
                      .concat([
                        // Returns name even if the data.name is Follow(name)
                        // and not name. Also works on Follow(() -> name = ")"
                        node.data.name.match(/\((.+)\)/)?.[1] ?? node.data.name,
                      ])
                      .sort()
                      .join(", ")
                  : node.data.name.match(/\((.+)\)/)?.[1] ?? node.data.name;
              // 5. We create the new group node name with the new child name.
              const newGroupNodeName =
                nameIfPrefix !== undefined
                  ? prefix + "(SCC(" + newName + "))"
                  : "SCC(" + newName + ")";

              if (import.meta.env.DEV) {
                console.log("new groupnode name", newName, newGroupNodeName);
              }

              return {
                ...n,
                data: {
                  ...groupNode.data,
                  name: newGroupNodeName,
                },
              } as Node<NodeData>;
            }
          }

          return n;
        });
        // We also need to update the edge names (sourcename->targetname)
        // for the edges that are connected to the group node we just changed.
        const newEdges: Edge<EdgeData>[] = followEdges.map((edge) => {
          // Get the new names and nodes if they are new,
          // else use the old ones
          if (edge.source === groupNode.id || edge.target === groupNode.id) {
            const newSource =
              edge.source === groupNode.id ? groupNode.id : edge.source;
            const newSourceNode: Node<NodeData> | undefined =
              edge.source === groupNode.id
                ? newNodes.find((node) => node.id === groupNode.id)
                : edge.sourceNode;
            const newTarget =
              edge.target === groupNode.id ? groupNode.id : edge.target;
            const newTargetNode: Node<NodeData> | undefined =
              edge.target === groupNode.id
                ? newNodes.find((node) => node.id === groupNode.id)
                : edge.targetNode;
            if (!newSourceNode || !newTargetNode || !edge.data) {
              throw new Error("new source or target node not found or no data");
            }
            return {
              ...edge,
              source: newSource,
              sourceNode: newSourceNode,
              target: newTarget,
              targetNode: newTargetNode,
              data: {
                ...edge.data,
                name: newSourceNode.data.name + "->" + newTargetNode.data.name,
              },
            };
          } else {
            return edge;
          }
        });

        setFollowNodes(newNodes);
        setFollowEdges(newEdges);
      }
    },
    [followNodes, followEdges, setFollowNodes, setFollowEdges, showSnackbar],
  );

  const customControls = <CustomControls />;
  // We create the ReactFlow Canvases here, since they are used in multiple
  // pages (within the same step) and we want to avoid re-creating them.
  // We use separate graphs for empty, first, and follow, as it's probably
  // cheaper then saving/restoring the graph state (nodes, edges, etc.)
  // when navigating between steps (but would be possible)
  const emptyGraphCanvas = (
    <ReactFlow
      nodes={emptyNodes}
      edges={emptyEdges}
      onNodesChange={onEmptyNodesChange}
      onEdgesChange={onEmptyEdgesChange}
      connectionLineComponent={ConnectionLine}
      onConnect={onEmptyConnect(showSnackbar)}
      onNodeDragStop={undefined}
      nodeTypes={emptyNodeTypes}
      edgeTypes={emptyEdgeTypes}
      fitView={true}
      zoomOnDoubleClick={false}
      selectNodesOnDrag={false}
    >
      {customControls}
      <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
    </ReactFlow>
  );
  const firstGraphCanvas = (
    <ReactFlow
      nodes={firstNodes}
      edges={firstEdges}
      onNodesChange={onFirstNodesChange}
      onEdgesChange={onFirstEdgesChange}
      connectionLineComponent={ConnectionLine}
      onConnect={onFirstConnect(showSnackbar)}
      onNodeDragStop={onFirstNodeDragStop}
      nodeTypes={firstNodeTypes}
      edgeTypes={firstEdgeTypes}
      fitView={true}
      zoomOnDoubleClick={false}
      selectNodesOnDrag={false}
    >
      {customControls}
      <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
    </ReactFlow>
  );
  const followGraphCanvas = (
    <ReactFlow
      nodes={followNodes}
      edges={followEdges}
      onNodesChange={onFollowNodesChange}
      onEdgesChange={onFollowEdgesChange}
      connectionLineComponent={ConnectionLine}
      onConnect={onFollowConnect(showSnackbar)}
      onNodeDragStop={onFollowNodeDragStop}
      nodeTypes={followNodeTypes}
      edgeTypes={followEdgeTypes}
      fitView={true}
      zoomOnDoubleClick={false}
      selectNodesOnDrag={false}
    >
      {customControls}
      <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
    </ReactFlow>
  );

  // If the user is new (no localstorage -> never changed settings or completed
  // tutorial before) we want to show the tutorial dialog for the start page.
  // Here we pass an initializer function ()=>value instead of just value
  // to avoid executing the localStorage.getItem("settings") call on every
  // render, when react only uses the initial value on the first render anyways.
  // Refer to https://react.dev/reference/react/useState#avoiding-recreating-the-initial-state
  const [open, setOpen] = useState(
    () => localStorage.getItem("settings") === null,
  );

  // Here begins the actual content of the page
  const tutorialComponent = (
    <TutorialComponent page={page} open={open} setOpen={setOpen} />
  );
  const headerComponent = <HeaderComponent setTutorialOpen={setOpen} />;
  const progressDrawerComponent = (
    <ProgressDrawerComponent setTutorialOpen={setOpen} />
  );

  // Navigation (page change) is handled by the HeaderComponent
  let content;
  switch (page) {
    case 0:
      content = <StartPage />;
      break;
    case 1:
      content = <ReadGrammarPage />;
      break;
    case 2:
      content = <SelectStartSymbolPage />;
      break;
    case 3:
      content = (
        <ReactFlowProvider>
          <PrepareEmptyAlgorithmPage graphCanvas={emptyGraphCanvas} />
        </ReactFlowProvider>
      );
      break;
    case 4:
      content = (
        <ReactFlowProvider>
          <EmptyAlgorithmPage graphCanvas={emptyGraphCanvas} />
        </ReactFlowProvider>
      );
      break;
    case 5:
      content = (
        <ReactFlowProvider>
          <PrepareFirstAlgorithmPage graphCanvas={firstGraphCanvas} />
        </ReactFlowProvider>
      );
      break;
    case 6:
      content = (
        <ReactFlowProvider>
          <FirstAlgorithmPage graphCanvas={firstGraphCanvas} />
        </ReactFlowProvider>
      );
      break;
    case 7:
      content = (
        <ReactFlowProvider>
          <PrepareFollowAlgorithmPage graphCanvas={followGraphCanvas} />
        </ReactFlowProvider>
      );
      break;
    case 8:
      content = (
        <ReactFlowProvider>
          <FollowAlgorithmPage graphCanvas={followGraphCanvas} />
        </ReactFlowProvider>
      );
      break;
    case 9:
      content = <DisplayResultPage />;
      break;
    default:
      content = (
        <Box
          color="error.main"
          className="flex size-full flex-col items-center justify-center overflow-auto"
        >
          <Typography variant="h4" component="h1" gutterBottom>
            Oops! It looks like this page ({page}) does not exist.
            <br />
            <br />
            Error Code b352b8: Please contact the developer!
          </Typography>
        </Box>
      );
      break;
  }

  return (
    <Box sx={{ display: "flex" }}>
      {headerComponent}
      {progressDrawerComponent}
      <Box
        component="main"
        className="flex h-dvh flex-col"
        sx={{
          flexGrow: 1,
          overflow: "auto",
        }}
      >
        <Toolbar />
        <Box className="m-2 flex flex-grow overflow-auto xs:m-4">
          {tutorialComponent}
          {content}
        </Box>
      </Box>
    </Box>
  );
}
