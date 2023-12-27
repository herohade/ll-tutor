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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  FirstAlgorithmNodeMap,
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
    firstNodeMap: state.firstNodeMap,
    setFirstNodeMap: state.setFirstNodeMap,
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
    firstNodeMap,
    setFirstNodeMap,
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

  const outgoingNodeMaps: Map<string, FirstAlgorithmNodeMap> | undefined =
    useMemo(() => {
      if (page === 5) {
        return undefined;
      }
      const outgoingNodeMaps: Map<string, FirstAlgorithmNodeMap> = new Map();
      firstEdges.forEach((edge) => {
        if (edge.source === id && edge.target !== id) {
          const outgoingNodeMap = firstNodeMap.get(edge.target);
          if (!outgoingNodeMap) {
            if (import.meta.env.DEV) {
              console.log(
                "Error Code e95b84: outgoingNodeMap not found",
                edge.target,
              );
            }
            showSnackbar(
              "Error Code e95b84: Please contact the developer!",
              "error",
              true,
            );
            return;
          }
          outgoingNodeMaps.set(edge.target, outgoingNodeMap);
        }
      });
      return outgoingNodeMaps;
    }, [firstEdges, firstNodeMap, id, page, showSnackbar]);
  const thisFirstNodeMap: FirstAlgorithmNodeMap | undefined = useMemo(() => {
    return firstNodeMap.get(id);
  }, [firstNodeMap, id]);
  // A node (button) is disabled if any outgoing node is active.
  const disabledBecauseOfOutgoing = useMemo(() => {
    if (page === 5) {
      return false;
    }
    if (!outgoingNodeMaps) {
      return false;
    }
    for (const outgoingNodeMap of outgoingNodeMaps.values()) {
      if (outgoingNodeMap.active) {
        return true;
      }
    }
    return false;
  }, [outgoingNodeMaps, page]);
  const disabledBecauseOfIncoming = useMemo(() => {
    if (page === 5) {
      return false;
    }
    if (!thisFirstNodeMap) {
      return false;
    }
    for (const incomingFirstSet of thisFirstNodeMap.incomingFirst.values()) {
      if (incomingFirstSet === undefined) {
        return true;
      }
    }
    return false;
  }, [page, thisFirstNodeMap]);

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

  const handleClickGroupNode = () => {
    if (thisFirstNodeMap) {
      if (thisFirstNodeMap.active) {
        const newFirstNodeMap = new Map(firstNodeMap);
        // toggle active
        newFirstNodeMap.set(id, {
          ...thisFirstNodeMap,
          active: false,
        });
        // update outgoung node's first algorithm sets:
        // - update their incoming node's first sets (in particular this one's)
        // - update their first sets by re-calculating them with the new
        // incoming node first sets
        for (const [
          incomingNodeId,
          incomingFirstAlgorithmNodeMap,
        ] of outgoingNodeMaps!) {
          // copy the outgoing node's incoming node's first sets
          const newIncomingFirstMap = new Map(
            incomingFirstAlgorithmNodeMap.incomingFirst,
          );
          // remove this node's first set from the outgoing node's set
          // by setting it to undefined
          newIncomingFirstMap.set(id, undefined);
          // re-calculate the outgoing node's first set
          const relevantIncomingFirstSets: string[][] = [
            ...newIncomingFirstMap.values(),
          ].filter((firstArr) => firstArr !== undefined) as string[][];
          const newFirstSet = new Set(relevantIncomingFirstSets.flat());
          const newIncomingFirstAlgorithmNodeMap = {
            active: incomingFirstAlgorithmNodeMap.active,
            incomingFirst: newIncomingFirstMap,
            first: newFirstSet,
          };
          // save the outgoing node's new first algorithm set
          newFirstNodeMap.set(incomingNodeId, newIncomingFirstAlgorithmNodeMap);
        }
        if (import.meta.env.DEV) {
          console.log(
            "newFirstNodeMap after clicking " + id + ":",
            newFirstNodeMap,
          );
        }
        setFirstNodeMap(newFirstNodeMap);
      } else {
        const newFirstNodeMap = new Map(firstNodeMap);
        // toggle active
        newFirstNodeMap.set(id, {
          ...thisFirstNodeMap,
          active: true,
        });
        // update outgoung node's first algorithm sets:
        // - update their incoming node's first sets (in particular this one's)
        // - update their first sets by re-calculating them with the new
        // incoming node first sets
        const myFirstSet: Set<string> = thisFirstNodeMap.first;
        for (const [
          incomingNodeId,
          incomingFirstAlgorithmNodeMap,
        ] of outgoingNodeMaps!) {
          // copy the outgoing node's incoming node's first sets
          const newIncomingFirstMap = new Map(
            incomingFirstAlgorithmNodeMap.incomingFirst,
          );
          // update this node's first set in the outgoing node's set
          newIncomingFirstMap.set(id, [...myFirstSet]);
          // re-calculate the outgoing node's first set
          const newFirstSet = new Set([
            ...incomingFirstAlgorithmNodeMap.first,
            ...myFirstSet,
          ]);
          const newIncomingFirstAlgorithmNodeMap = {
            active: incomingFirstAlgorithmNodeMap.active,
            incomingFirst: newIncomingFirstMap,
            first: newFirstSet,
          };
          // save the outgoing node's new first algorithm set
          newFirstNodeMap.set(incomingNodeId, newIncomingFirstAlgorithmNodeMap);
        }
        if (import.meta.env.DEV) {
          console.log(
            "newFirstNodeMap after clicking " + id + ":",
            newFirstNodeMap,
          );
        }
        setFirstNodeMap(newFirstNodeMap);
      }
    } else {
      if (import.meta.env.DEV) {
        console.log(
          "Error Code 955767: thisFirstNodeMap not found",
          thisFirstNodeMap,
        );
      }
      showSnackbar(
        "Error Code 955767: Please contact the developer!",
        "error",
        true,
      );
    }
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
          const isInFirstSet = thisFirstNodeMap
            ? thisFirstNodeMap.first.has(terminal.name)
            : childNodes.some(
                (node) => node.data.name === "{" + terminal.name + "}",
              );
          return (
            // TODO: add mapping from scc (this) to terminals (instead of using childNodes)
            // and color the terminals if they belong to the first set of this scc
            <StyledSpan
              key={terminal.name}
              className={
                isInFirstSet ? "isColoredChild font-semibold" : "opacity-50"
              }
              sx={{
                color: isInFirstSet ? "success.dark" : "inherit",
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
        onClick={handleClickGroupNode}
        disabled={
          finishedFirst ||
          disabledBecauseOfOutgoing ||
          disabledBecauseOfIncoming
        }
      >
        <p className="m-0 whitespace-nowrap">
          <b>
            F<sub>ε</sub>:
          </b>
          <br />
          {terminals.map((terminal) => {
            const isInFirstSet = thisFirstNodeMap
              ? thisFirstNodeMap.first.has(terminal.name)
              : childNodes.some(
                  (node) => node.data.name === "{" + terminal.name + "}",
                );
            return (
              <StyledSpan
                key={terminal.name}
                className={isInFirstSet ? "font-semibold" : "opacity-50"}
                sx={{
                  color: isInFirstSet ? "success.dark" : "inherit",
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
