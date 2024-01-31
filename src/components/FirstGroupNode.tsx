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

const StyledSpan = styled("span")({});

function FirstGroupNode({ id, xPos, yPos, data, isConnectable }: Props) {
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
    setFirstLabelSize: state.setFirstLabelSize,
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
    setFirstLabelSize,
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
    const width = ref.current?.clientWidth || 0;
    const height = ref.current?.clientHeight || 0;
    setMinHeight(height + 26);
    setMinWidth(width + 26);
    setFirstLabelSize(id, {
      width: width,
      height: height,
    });
    if (import.meta.env.DEV) {
      console.log(
        "GroupNode label size:",
        width,
        height,
      );
    }
  }, [id, ref, setFirstLabelSize]);

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
  const someIncoming = useMemo(() => {
    if (!disabledBecauseOfIncoming || !thisFirstNodeMap) {
      return false;
    } else {
      for (const incomingFirstSet of thisFirstNodeMap.incomingFirst.values()) {
        if (incomingFirstSet !== undefined) {
          return true;
        }
      }
    }
  }, [disabledBecauseOfIncoming, thisFirstNodeMap]);

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
    // Do I also need to update this ones edges (the names)?
    // Technically, the user is only allowed to the next step if the graph
    // is correct. This can never be the case if the last action was ungrouping.
    // As there would be more pressing errors, the user will be notified of
    // them instead of any edge errors. This means we can probably be lazy
    // here and not update the edges (their names).
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
                name: "SCC()",
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
        // - update their first sets by re-computing them with the new
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
          // re-compute the outgoing node's first set
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
        // - update their first sets by re-compute them with the new
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
          // re-compute the outgoing node's first set
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

  const sqrtTerminals = useMemo(() => {
    return Math.ceil(Math.sqrt(terminals.length) * 1.5);
  }, [terminals.length]);

  const content =
    page === 5 ? (
      <p className="m-0 whitespace-pre px-3">
        <b>
          F<sub>ε</sub>:
        </b>
        <br />
        {terminals.map((terminal, index) => {
          const isInFirstSet = thisFirstNodeMap
            ? thisFirstNodeMap.first.has(terminal.name)
            : childNodes.some(
                (node) => node.data.name === "{" + terminal.name + "}",
              );
          return (
            <StyledSpan
              key={terminal.name}
              className={
                isInFirstSet ? "isColoredChild font-semibold" : "opacity-50"
              }
              sx={{
                // TODO: currently green on blue if active, might be hard to read?
                color: isInFirstSet ? "success.dark" : "inherit",
              }}
            >
              {terminal.name + " "}
              {index % sqrtTerminals === sqrtTerminals - 1 && <br />}
            </StyledSpan>
          );
        })}
      </p>
    ) : (
      <Button
        variant="contained"
        sx={{
          bgcolor: thisFirstNodeMap?.active
            ? (theme) =>
                theme.palette.mode === "light"
                  ? "primary.light"
                  : "primary.dark"
            : "secondary.dark",
          color: thisFirstNodeMap?.active
            ? "primary.contrastText"
            : "secondary.contrastText",
          "& .isInFirstSet": {
            // TODO: currently green on blue if active, might be hard to read?
            color: thisFirstNodeMap?.active ? "success.dark" : "success.light",
          },
          ":disabled": {
            bgcolor: thisFirstNodeMap?.active
              ? "first.selected"
              : someIncoming
                ? "first.charging"
                : "background.paper",
            color: thisFirstNodeMap?.active
              ? "first.disabledText"
              : someIncoming
                ? "first.disabledText"
                : "",
            "& .isInFirstSet": {
              // TODO: currently green on blue if active, might be hard to read?
              color: thisFirstNodeMap?.active ? "success.dark" : "success.dark",
            },
          },
          ":hover": {
            bgcolor: "first.hover",
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
        <p className="m-0 whitespace-pre">
          <b>
            F<sub>ε</sub>:
          </b>
          <br />
          {terminals.map((terminal, index) => {
            const isInFirstSet = thisFirstNodeMap
              ? thisFirstNodeMap.first.has(terminal.name)
              : childNodes.some(
                  (node) => node.data.name === "{" + terminal.name + "}",
                );
            return (
              <span
                key={terminal.name}
                className={
                  isInFirstSet ? "isInFirstSet font-semibold" : "opacity-50"
                }
              >
                {terminal.name + " "}
                {index % sqrtTerminals === sqrtTerminals - 1 && <br />}
              </span>
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

export default FirstGroupNode;
