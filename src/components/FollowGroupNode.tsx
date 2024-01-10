import { styled } from "@mui/material";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";

import {
  Handle,
  NodeProps,
  NodeResizer,
  NodeToolbar,
  Position,
  useStore,
} from "reactflow";

import useBoundStore from "../store/store";
import { shallow } from "zustand/shallow";

import { useEffect, useRef, useState } from "react";

import {
  FollowNodeSlice,
  GrammarSlice,
  NavigationSlice,
  NodeData,
} from "../types";

type Props = NodeProps<NodeData>;

function FollowGroupNode({ id, xPos, yPos, data, isConnectable }: Props) {
  const selector = (
    state: GrammarSlice &
      FollowNodeSlice &
      NavigationSlice,
  ) => ({
    // GrammarSlice
    terminals: state.terminals,
    // FollowNodeSlice
    followSetupComplete: state.followSetupComplete,
    followNodes: state.followNodes,
    followEdges: state.followEdges,
    setFollowNodes: state.setFollowNodes,
    setFollowEdges: state.setFollowEdges,
    setLabelSize: state.setLabelSize,
    // NavigationSlice
    page: state.page,
  });
  const {
    // GrammarSlice
    terminals,
    // FollowNodeSlice
    followSetupComplete,
    followNodes,
    followEdges,
    setFollowNodes,
    setFollowEdges,
    setLabelSize,
    // NavigationSlice
    page,
  } = useBoundStore(selector, shallow);

  const connectionNodeId = useStore((state) => state.connectionNodeId);

  const isConnecting = !!connectionNodeId;

  const childNodes = followNodes.filter((node) => node.parentNode === id);

  const ref = useRef<HTMLDivElement | null>(null);

  const [minHeight, setMinHeight] = useState(0);
  const [minWidth, setMinWidth] = useState(0);

  useEffect(() => {
    setMinHeight((ref.current?.clientHeight || 0) + 26);
    setMinWidth((ref.current?.clientWidth || 0) + 26);
    setLabelSize(id, {
      width: ref.current?.clientWidth || 0,
      height: ref.current?.clientHeight || 0,
    });
    if (import.meta.env.DEV) {
      console.log(
        "GroupNode label size:",
        ref.current?.clientWidth,
        ref.current?.clientHeight,
      );
    }
  }, [id, ref, setLabelSize]);

  // We don't want group nodes to be smaller than the content. But (constantly)
  // calculating the minimum size is expensive. So we set the minimum size to
  // the label size. This means that child nodes might be outside the group node
  /*
  // copied and modified from https://reactflow.dev/examples/nodes/dynamic-grouping
  type IsEqualCompareObj = {
    minWidth: number;
    minHeight: number;
    hasChildNodes: boolean;
  };

  function isEqual(prev: IsEqualCompareObj, next: IsEqualCompareObj): boolean {
    return (
      prev.minWidth === next.minWidth &&
      prev.minHeight === next.minHeight &&
      prev.hasChildNodes === next.hasChildNodes
    );
  }

  const { minWidth, minHeight, hasChildNodes } = useStore((store) => {
    const childNodes = Array.from(store.nodeInternals.values()).filter((n) => n.parentNode === id);

    const labelNode: Node = {
      id: id + "-label",
      data: {},
      position: {
        x: 0,
        y: 0,
      },
      positionAbsolute: {
        x: xPos,
        y: yPos,
      },
      width: data.labelSize?.width || 0,
      height: data.labelSize?.height || 0,
    }

    console.log([labelNode, ...childNodes]);

    const rect = getRectOfNodes([labelNode, ...childNodes]);

    console.log(rect)

    return {
      minWidth: rect.width + 6 * 2,
      minHeight: rect.height + 6 * 2,
      hasChildNodes: childNodes.length > 0,
    };
  }, isEqual);
  */

  const onDelete = () => {
    setFollowNodes(
      followNodes
        .map((node) => {
          if (node.parentNode === id) {
            return {
              ...node,
              position: {
                x: node.position.x + xPos,
                y: node.position.y + yPos,
              },
              parentNode: undefined,
              extent: undefined,
            };
          } else {
            return node;
          }
        })
        .filter((node) => node.id !== id),
    );
    setFollowEdges(
      followEdges.filter((edge) => edge.source !== id && edge.target !== id),
    );
  };

  const onUngroup = () => {
    setFollowNodes(
      followNodes.map((node) => {
        if (node.parentNode === id) {
          return {
            ...node,
            position: {
              x: node.position.x + xPos,
              y: node.position.y + yPos,
            },
            parentNode: undefined,
            extent: undefined,
          };
        } else {
          if (node.id === id) {
            return {
              ...node,
              data: {
                ...node.data,
                name: "scc",
              },
            };
          }
          return node;
        }
      }),
    );
  };

  const StyledSpan = styled("span")({});

  const content =
    page === 7 ? (
      <p className="m-0 whitespace-nowrap">
        <b>
          {/* TODO: differentiate between new ones (follow) and the firstSet ones (F-epsilon) */}
          {/* F<sub>ε</sub>: */}
          Follow<sub>1</sub>:
        </b>
        <br />
        {terminals.map((terminal) => {
          // const isInFollowSet = thisFollowNodeMap
          //   ? thisFollowNodeMap.follow.has(terminal.name)
          //   : childNodes.some(
          //       (node) => node.data.name === "{" + terminal.name + "}",
          //     );
          const isInFollowSet = false;
          return (
            // TODO: add mapping from scc (this) to terminals (instead of using childNodes)
            // and color the terminals if they belong to the follow set of this scc
            <StyledSpan
              key={terminal.name}
              className={
                isInFollowSet ? "isColoredChild font-semibold" : "opacity-50"
              }
              sx={{
                color: isInFollowSet ? "success.dark" : "inherit",
              }}
            >
              {terminal.name + " "}
            </StyledSpan>
          );
        })}
      </p>
    ) : (
      <>
        TODO
      </>
    );

  return (
    <>
      <NodeResizer
        minWidth={minWidth}
        minHeight={minHeight}
        lineStyle={{
          borderWidth: 1,
        }}
      />
      {!followSetupComplete && (
        <NodeToolbar className="nodrag">
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={{ xs: 1, sm: 2 }}
          >
            <Button variant="outlined" color="error" onClick={onDelete}>
              Delete
            </Button>
            {childNodes.length > 0 && (
              <Button variant="outlined" color="error" onClick={onUngroup}>
                Ungroup
              </Button>
            )}
          </Stack>
        </NodeToolbar>
      )}
      <div className="m-2 flex">
        <Box
          className="relative flex items-center justify-center rounded-lg border-2 border-solid"
          ref={ref}
          sx={{
            bgcolor:
              isConnectable && isConnecting ? "success.main" : data.color,
          }}
          style={{
            borderStyle: isConnectable && isConnecting ? "dashed" : "solid",
          }}
        >
          <Box
            className="z-[10000] mx-6 my-5 aspect-square min-w-16 rounded-md border-2 border-solid"
            sx={{
              ":hover": {
                bgcolor:
                  isConnectable && isConnecting
                    ? (theme) =>
                        theme.palette.mode === "dark"
                          ? "success.dark"
                          : "success.light"
                    : "",
              },
              ":hover .isColoredChild": {
                color: (theme) =>
                  theme.palette.mode === "dark" && isConnectable && isConnecting
                    ? "success.light"
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
      </div>
    </>
  );
}

export default FollowGroupNode;
