import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import {
  Edge,
  Handle,
  Node,
  NodeProps,
  NodeToolbar,
  Position,
  useStore,
} from "reactflow";

import useBoundStore from "../store/store";
import { shallow } from "zustand/shallow";

import { EdgeData, FollowNodeSlice, NodeData } from "../types";

type Props = NodeProps<NodeData>;

function FollowNode({ id, xPos, yPos, data, isConnectable }: Props) {
  const connectionNodeId = useStore((state) => state.connectionNodeId);

  const selector = (state: FollowNodeSlice) => ({
    followSetupComplete: state.followSetupComplete,
    followNodes: state.followNodes,
    followEdges: state.followEdges,
    setFollowNodes: state.setFollowNodes,
    setFollowEdges: state.setFollowEdges,
  });
  const {
    followSetupComplete,
    followNodes,
    followEdges,
    setFollowNodes,
    setFollowEdges,
  } = useBoundStore(selector, shallow);

  const parentId = followNodes.find((node) => node.id === id)?.parentNode;

  const onDetach = () => {
    const oldParentId = parentId;
    const newNodes: Node<NodeData>[] = followNodes.map((node) => {
      if (node.id === id) {
        return {
          ...node,
          position: {
            x: xPos,
            y: yPos,
          },
          parentNode: undefined,
          extent: undefined,
        };
      } else {
        if (node.id === oldParentId) {
          if (import.meta.env.DEV) {
            console.log("old parentnode name", node.data.name.split(", "));
          }
          const newName = node.data.name
            .split(", ")
            .filter((n) => n !== data.name)
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
            console.log("new parentnode name", newName);
          }
          return {
            ...node,
            data: {
              ...node.data,
              name: newName,
            },
          };
        }
        return node;
      }
    });
    const newEdges: Edge<EdgeData>[] = followEdges.map((edge) => {
      if (edge.source === oldParentId || edge.target === oldParentId) {
        const newSource =
          edge.source === oldParentId ? oldParentId : edge.source;
        const newSourceNode: Node<NodeData> | undefined =
          edge.source === oldParentId
            ? newNodes.find((node) => node.id === oldParentId)
            : edge.sourceNode;
        const newTarget =
          edge.target === oldParentId ? oldParentId : edge.target;
        const newTargetNode: Node<NodeData> | undefined =
          edge.target === oldParentId
            ? newNodes.find((node) => node.id === oldParentId)
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
  };

  const isConnecting = !!connectionNodeId;

  const content = <Typography className="min-w-6">{data.name}</Typography>;

  return (
    <>
      {!followSetupComplete && (
        <NodeToolbar className="nodrag">
          {parentId !== undefined && (
            <Button variant="outlined" color="error" onClick={onDetach}>
              Detach
            </Button>
          )}
        </NodeToolbar>
      )}
      <Box
        className="rounded-lg"
        sx={{
          bgcolor: isConnectable && isConnecting ? "success.main" : data.color,
        }}
      >
        <Box
          className="relative flex items-center justify-center rounded-lg border-2 border-solid"
          sx={{
            ":before": {
              content: "''",
              position: "absolute",
              top: "-8%",
              left: "50%",
              height: "20%",
              width: "40%",
              transform: "translate(-50%, 0)",
              bgcolor: "background.paper",
              zIndex: 1000,
              lineHeight: 1,
              borderRadius: 4,
              color: "text.primary",
              fontSize: 9,
              border: 2,
            },
          }}
          style={{
            borderStyle: isConnectable && isConnecting ? "dashed" : "solid",
          }}
        >
          <Box
            className="z-[10000] mx-6 my-5 rounded-md border-2 border-solid"
            sx={{
              ":hover": {
                borderRadius: "6px",
                bgcolor:
                  isConnectable && isConnecting
                    ? (theme) =>
                        theme.palette.mode === "dark"
                          ? "success.dark"
                          : "success.light"
                    : "",
              },
            }}
          >
            {content}
          </Box>
          {/* If handles are conditionally rendered and not present initially, you need to update the node internals https://reactflow.dev/docs/api/hooks/use-update-node-internals/ */}
          {/* In this case we don't need to use useUpdateNodeInternals, since !isConnecting is true at the beginning and all handles are rendered initially. */}
          {!isConnecting && (
            <Handle
              className="absolute left-0 top-0 size-full transform-none cursor-cell rounded-none border-0 opacity-0"
              type="source"
              position={Position.Bottom}
              isConnectable={isConnectable}
              isConnectableEnd={false}
              style={isConnectable ? {} : { opacity: 0 }}
            />
          )}
          <Handle
            className="absolute left-0 top-0 size-full transform-none cursor-cell rounded-none border-0 opacity-0"
            type="target"
            position={Position.Top}
            isConnectable={isConnectable}
            isConnectableStart={false}
            style={isConnectable ? {} : { opacity: 0 }}
          />
        </Box>
      </Box>
    </>
  );
}

export default FollowNode;
