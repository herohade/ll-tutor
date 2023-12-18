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
  PrepareEmptyAlgorithmPage,
  PrepareFirstAlgorithmPage,
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
  NavigationSlice,
  NodeData,
} from "./types";

// basic css required for react-flow to work
import "reactflow/dist/base.css";

export default function App() {
  const selector = (
    state: NavigationSlice & EmptyNodeSlice & FirstNodeSlice,
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
  } = useBoundStore(selector, shallow);

  const { enqueueSnackbar } = useSnackbar();

  const showSnackbar = (
    message: string,
    variant: VariantType,
    preventDuplicate: boolean,
  ) => {
    // variant could be success, error, warning, info, or default
    enqueueSnackbar(message, {
      variant,
      preventDuplicate,
    });
  };

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
      if (intersections.length) {
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
              // add new name
              if (import.meta.env.DEV) {
                console.log(
                  "old groupnode name",
                  groupNode.data.name.split(", "),
                );
              }
              const newName = groupNode.data.name
                .split(", ")
                .filter((name) => name.length > 0)
                .concat([node.data.name])
                .sort((a, b) => {
                  if (a === "scc") {
                    return -1; // "scc" comes first
                  } else if (b === "scc") {
                    return 1; // "scc" comes before other strings
                  } else {
                    return a.localeCompare(b); // lexicographical sorting for other strings
                  }
                })
                .join(", ");
              if (import.meta.env.DEV) {
                console.log("new groupnode name", newName);
              }
              return {
                ...n,
                data: {
                  ...groupNode.data,
                  name: newName,
                },
              } as Node<NodeData>;
            }
          }

          return n;
        });
        const newEdges: Edge<EdgeData>[] = firstEdges.map((edge) => {
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
    [setFirstNodes, firstNodes, setFirstEdges, firstEdges],
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

  const [open, setOpen] = useState(false);
  const tutorialComponent = <TutorialComponent page={page} open={open} setOpen={setOpen} />;
  const headerComponent = <HeaderComponent setTutorialOpen={setOpen} />;
  const progressDrawerComponent = <ProgressDrawerComponent />;

  let content;
  switch (page) {
    case 0:
      content = <StartPage setTutorialOpen={setOpen} />;
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
    default:
      content = (
        <>
          <div className="mr-1 h-full w-1/3 overflow-scroll rounded-lg border-2 border-solid bg-red-600 bg-gradient-to-b from-green-600 p-2 text-left hover:from-green-400 hover:to-green-600">
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
        className="hs-screen flex flex-col"
        sx={{
          flexGrow: 1,
          overflow: "auto",
        }}
      >
        <Toolbar />
        <Box className="m-2 flex flex-grow overflow-scroll xs:m-4">
          {tutorialComponent}
          {content}
        </Box>
      </Box>
    </Box>
  );
}
