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

import { EdgeData, FirstNodeSlice, NodeData } from "../types";

/**
 * The props for the {@link FirstNode} component
 * 
 * @param id - The id of the node
 * @param xPos - The x position of the node, required for computing the new position if detached from its parent node
 * @param yPos - The y position of the node, required for computing the new position if detached from its parent node
 * @param data - The {@link NodeData | data} of the node
 * @param isConnectable - Whether the node is connectable, disabled once the graph is set up
 */
export type Props = NodeProps<NodeData>;

/**
 * The node type representing symbols used for computing the
 * first sets
 *
 * @remarks
 * This node only ever displayed it's symbols name,
 * it does not change between tutor steps (unlike its group node counterpart)
 *
 * @param id - The id of the node
 * @param xPos - The x position of the node, required for computing the new position if detached from its parent node
 * @param yPos - The y position of the node, required for computing the new position if detached from its parent node
 * @param data - The {@link NodeData | data} of the node
 * @param isConnectable - Whether the node is connectable, disabled once the graph is set up
 */
function FirstNode({ id, xPos, yPos, data, isConnectable }: Props) {
  const selector = (state: FirstNodeSlice) => ({
    firstSetupComplete: state.firstSetupComplete,
    firstNodes: state.firstNodes,
    firstEdges: state.firstEdges,
    setFirstNodes: state.setFirstNodes,
    setFirstEdges: state.setFirstEdges,
  });
  const {
    firstSetupComplete,
    firstNodes,
    firstEdges,
    setFirstNodes,
    setFirstEdges,
  } = useBoundStore(selector, shallow);

  // In theory we could use the id to do some more advanced checks
  // such as same node type etc. but for now we only want to now
  // if the user is connecting nodes
  const connectionNodeId = useStore((state) => state.connectionNodeId);
  // This tells us when the user is connecting (any) nodes
  const isConnecting = !!connectionNodeId;

  // Find the parent node id if it has one (= is grouped)
  const parentId = firstNodes.find((node) => node.id === id)?.parentNode;

  /**
   * Detaches the node from its parent node.
   * This means computing its absolute position and
   * removing the parent from the nodes parentNode variable.
   * The parent node also needs to update its name.
   * Then the parent's edges' names also need to be updated.
   */
  const onDetach = () => {
    const oldParentId = parentId;
    const newNodes: Node<NodeData>[] = firstNodes.map((node) => {
      // remove parent
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
        // update parent name
        if (node.id === oldParentId) {
          const oldGroupNodeName = node.data.name;
          // get the child names
          const [, matchedName] = oldGroupNodeName.match(/^SCC\((.*)\)$/) || [
            undefined,
            undefined,
          ];

          if (import.meta.env.DEV) {
            console.log("old parentnode name", oldGroupNodeName, matchedName);
          }

          if (matchedName === undefined) {
            throw new Error("no matched name");
          }

          // remove the ex-childs name
          const newName = matchedName!
            .split(", ")
            .filter((n) => n !== data.name)
            .join(", ");

          // create the new name
          const newGroupNodeName = "SCC(" + newName + ")";

          if (import.meta.env.DEV) {
            console.log("new groupnode name", newName, newGroupNodeName);
          }

          return {
            ...node,
            data: {
              ...node.data,
              name: newGroupNodeName,
            },
          };
        }
        return node;
      }
    });
    const newEdges: Edge<EdgeData>[] = firstEdges.map((edge) => {
      // update old parent's edges' names
      if (edge.source === oldParentId || edge.target === oldParentId) {
        // get new values if they changed, else keep the old ones
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
        // update the edge
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
  };

  const content = <Typography className="min-w-6">{data.name}</Typography>;

  return (
    <>
      {!firstSetupComplete && (
        // We only allow detaching in the setup step
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
          // We color the node green to indicate that it is a valid
          // target for the user to connect to
          bgcolor: isConnectable && isConnecting ? "success.main" : data.color,
        }}
      >
        <Box
          className="relative flex items-center justify-center rounded-lg border-2 border-solid"
          sx={{
            // This creates a little notch at the top of the node
            // for dragging the node
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
              // empty nodes are colored blue. On light mode the text is black.
              // black on dark blue is not good so we change it to #fff (white).
              // But when connecting nodes they are green, so we should change
              // the text color to text.primary like the rest for uniformnity.
              color: data.empty
                ? isConnectable && isConnecting
                  ? "text.primary"
                  : "#fff"
                : "",
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
          {/* When not connecting, the source handle is layered on top of the target node.
          Only once the user selects a source node, do the source handles vanish, allowing the user to access the target handles underneath. */}
          {/* Since the handles take up the entire node space and are layered on
          top of each other, they are indistinguishable to the user. This means
          that we could probably get away with having just one handle act as both
          source and target, but why fix what isn't broken.*/}
          {!isConnecting && (
            <Handle
              // The source and target handle cover the entire node (except the
              // notch for dragging and the content of the node)
              // This allows users to click almost anywhere to connect nodes
              className="absolute left-0 top-0 size-full transform-none cursor-cell rounded-none border-0 opacity-0"
              type="source"
              position={Position.Bottom}
              isConnectable={isConnectable}
              isConnectableEnd={false}
              style={isConnectable ? {} : { opacity: 0 }}
            />
          )}
          <Handle
            // The source and target handle cover the entire node (except the
            // notch for dragging and the content of the node)
            // This allows users to click almost anywhere to connect nodes
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

export default FirstNode;
