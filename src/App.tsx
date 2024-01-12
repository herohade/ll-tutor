import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";

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
  EmptyAlgorithmPage,
  FirstAlgorithmPage,
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

// basic css required for react-flow to work
import "reactflow/dist/base.css";

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

  // Function to add a group node as a first nodes parent
  // if the dragged first node does not already have one
  // and is dragged on top of a group node
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
      // it seems that later elements are rendered on top of earlier ones and
      // it is more natural to have the node bind to the group node that is
      // the most visible one / the one on top (if there are multiple)
      const groupNode = intersections[intersections.length - 1];
      if (import.meta.env.DEV) {
        console.log(intersections);
      }

      // when there is an intersection on drag stop, we want to attach the node to its new parent
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
              // we need to set dragging = false, because the internal change of the dragging state
              // is not applied yet, so the node would be rendered as dragging
              dragging: false,
            } as Node<NodeData>;
          } else {
            if (n.id === groupNode.id) {
              // We get something like F...(SCC(A, B, C)) or SCC(A, B, C)
              // with F... either Follow or Fepsilon
              //
              // This matches name from F...(SCC(name)) in result[2]
              // and name from SCC(name) in result[3]. F... if it exists
              // is matched in result[1], else it's undefined:
              // .match(/(^F[^(]+)\(SCC\((.*)\)\)$|^SCC\((.*)\)$/)
              //
              // With name.split(", ") we get an array of names.
              // This also works if a name is ",".
              // ("A, ,,B" ===> "A" and "," and "B")
              //
              // With array.join(", ") we get the original string.
              //
              // With result[1] + (SCC(string)) or SCC(string), we get the
              // original group node name.

              const oldGroupNodeName = groupNode.data.name;
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

              const newName =
                matchedName.length > 0
                  ? matchedName
                      .split(", ")
                      .concat([node.data.name])
                      .sort()
                      .join(", ")
                  : node.data.name;

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
        const newEdges: Edge<EdgeData>[] = firstEdges.map((edge) => {
          // get the new names/nodes if they exist, else use the old ones
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

        setFirstNodes(newNodes);
        setFirstEdges(newEdges);
      }
    },
    [firstNodes, firstEdges, setFirstNodes, setFirstEdges, showSnackbar],
  );

  // Function to add a group node as a follow nodes parent
  // if the dragged follow node does not already have one
  // and is dragged on top of a group node
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
      // it seems that later elements are rendered on top of earlier ones and
      // it is more natural to have the node bind to the group node that is
      // the most visible one / the one on top (if there are multiple)
      const groupNode = intersections[intersections.length - 1];
      if (import.meta.env.DEV) {
        console.log(intersections);
      }

      // when there is an intersection on drag stop, we want to attach the node to its new parent
      if (groupNode !== undefined) {
        // We don't want to add a Follow child node to a F-epsilon group node
        // or vice versa (though the latter should not happen anyway)
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
              // we need to set dragging = false, because the internal change of the dragging state
              // is not applied yet, so the node would be rendered as dragging
              dragging: false,
            } as Node<NodeData>;
          } else {
            if (n.id === groupNode.id) {
              // We get something like F...(SCC(A, B, C)) or SCC(A, B, C)
              // with F... either Follow or Fepsilon
              //
              // This matches name from F...(SCC(name)) in result[2]
              // and name from SCC(name) in result[3]. F... if it exists
              // is matched in result[1], else it's undefined:
              // .match(/(^F[^(]+)\(SCC\((.*)\)\)$|^SCC\((.*)\)$/)
              //
              // With name.split(", ") we get an array of names.
              // This also works if a name is ",".
              // ("A, ,,B" ===> "A" and "," and "B")
              //
              // With array.join(", ") we get the original string.
              //
              // With result[1] + (SCC(string)) or SCC(string), we get the
              // original group node name.

              const oldGroupNodeName = groupNode.data.name;
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

              const newName =
                matchedName.length > 0
                  ? matchedName
                      .split(", ")
                      .concat([
                        // returns name even if the data.name is Follow(name)
                        // and not name. Also works on Follow(() -> name = ")"
                        node.data.name.match(/\((.+)\)/)?.[1] ?? node.data.name,
                      ])
                      .sort()
                      .join(", ")
                  : node.data.name.match(/\((.+)\)/)?.[1] ?? node.data.name;

              const newGroupNodeName = nameIfPrefix !== undefined
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
        const newEdges: Edge<EdgeData>[] = followEdges.map((edge) => {
          // get the new names/nodes if they exist, else use the old ones
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

  // ReactFlow canvas, stays the same between pages
  const customControls = <CustomControls />;
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
  // use two separate graphs, as it's probably cheaper then saving/restoring
  // when navigating between pages (but it's possible according to the docs)
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
  // refer to https://react.dev/reference/react/useState#avoiding-recreating-the-initial-state
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
    default:
      content = (
        <>
          <div className="mr-1 h-full w-1/3 overflow-auto rounded-lg border-2 border-solid bg-red-600 bg-gradient-to-b from-green-600 p-2 text-left hover:from-green-400 hover:to-green-600">
            <Typography variant="h4" component="h1" gutterBottom>
              Error:
            </Typography>
          </div>
          <div className="h-full w-2/3 rounded-lg border-2 border-solid bg-green-600 bg-gradient-to-b from-red-600 p-2 hover:from-red-400 hover:to-red-600">
            <Typography variant="h4" component="h1" gutterBottom>
              Page {page} not found
            </Typography>
          </div>
        </>
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
