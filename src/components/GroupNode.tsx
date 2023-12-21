import { styled } from "@mui/material";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";

import { VariantType, useSnackbar } from "notistack";

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
  FirstAlgorithmSlice,
  FirstNodeSlice,
  GrammarSlice,
  NavigationSlice,
  NodeData,
} from "../types";

type Props = NodeProps<NodeData>;

function GroupNode({ id, xPos, yPos, data, isConnectable }: Props) {
  const selector = (
    state: GrammarSlice &
      FirstNodeSlice &
      FirstAlgorithmSlice &
      NavigationSlice,
  ) => ({
    // GrammarSlice
    terminals: state.terminals,
    // FirstNodeSlice
    firstSetupComplete: state.firstSetupComplete,
    firstNodes: state.firstNodes,
    firstEdges: state.firstEdges,
    setFirstNodes: state.setFirstNodes,
    setFirstEdges: state.setFirstEdges,
    setLabelSize: state.setLabelSize,
    // FirstAlgorithmSlice
    finishedFirst: state.finishedFirst,
    // NavigationSlice
    page: state.page,
  });
  const {
    // GrammarSlice
    terminals,
    // FirstNodeSlice
    firstSetupComplete,
    firstNodes,
    firstEdges,
    setFirstNodes,
    setFirstEdges,
    setLabelSize,
    // FirstAlgorithmSlice
    finishedFirst,
    // NavigationSlice
    page,
  } = useBoundStore(selector, shallow);

  const connectionNodeId = useStore((state) => state.connectionNodeId);

  const isConnecting = !!connectionNodeId;

  const childNodes = firstNodes.filter((node) => node.parentNode === id);

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
    setFirstNodes(
      firstNodes
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
    setFirstEdges(
      firstEdges.filter((edge) => edge.source !== id && edge.target !== id),
    );
  };

  const onUngroup = () => {
    setFirstNodes(
      firstNodes.map((node) => {
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
    page === 5 ? (
      <p className="m-0 whitespace-nowrap">
        <b>
          F<sub>ε</sub>:
        </b>
        <br />
        {terminals.map((terminal) => {
          const isChild = childNodes.some(
            (node) => node.data.name === "{" + terminal.name + "}",
          );
          return (
            // TODO: add mapping from scc (this) to terminals (instead of using childNodes)
            // and color the terminals if they belong to the first set of this scc
            <StyledSpan
              key={terminal.name}
              className={
                isChild ? "isColoredChild font-semibold" : "opacity-50"
              }
              sx={{
                color: isChild ? "success.dark" : "inherit",
              }}
            >
              {terminal.name + " "}
            </StyledSpan>
          );
        })}
      </p>
    ) : (
      <Button
        variant="contained"
        sx={{
          bgcolor: "background.paper",
          color: "text.primary",
          ":disabled": {
            bgcolor: "background.paper",
          },
          ":hover": {
            // TODO: change to first colorset
            bgcolor: "empty.new",
          },
        }}
        className="nodrag size-full normal-case"
        onClick={() => {
          // TODO: add or remove terminals from all outgoing sccs
          showSnackbar("This feature is not yet implemented!", "error", true);
        }}
        disabled={
          finishedFirst
          // TODO: add disable if any incoming is not yet finished
          // or any outgoing is finished
        }
      >
        <p className="m-0 whitespace-nowrap">
          <b>
            F<sub>ε</sub>:
          </b>
          <br />
          {terminals.map((terminal) => {
            const isChild = childNodes.some(
              (node) => node.data.name === "{" + terminal.name + "}",
            );
            return (
              // TODO: add mapping from scc (this) to terminals (instead of using childNodes)
              // and color the terminals if they belong to the first set of this scc
              <StyledSpan
                key={terminal.name}
                className={isChild ? "font-semibold" : "opacity-50"}
                sx={{
                  color: isChild ? "success.dark" : "inherit",
                }}
              >
                {terminal.name + " "}
              </StyledSpan>
            );
          })}
        </p>
      </Button>
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
      {!firstSetupComplete && (
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

export default GroupNode;
