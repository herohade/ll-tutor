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
  FollowAlgorithmNodeMap,
  FollowAlgorithmSlice,
  FollowNodeSlice,
  GrammarSlice,
  NavigationSlice,
  NodeData,
  Terminal,
} from "../types";

type Props = NodeProps<NodeData>;

function FollowGroupNode({ id, xPos, yPos, data, isConnectable }: Props) {
  const selector = (
    state: GrammarSlice &
      FollowNodeSlice &
      FollowAlgorithmSlice &
      NavigationSlice,
  ) => ({
    // GrammarSlice
    endOfInput: state.endOfInput,
    terminals: state.terminals,
    // FollowNodeSlice
    followSetupComplete: state.followSetupComplete,
    followNodes: state.followNodes,
    followEdges: state.followEdges,
    setFollowNodes: state.setFollowNodes,
    setFollowEdges: state.setFollowEdges,
    setLabelSize: state.setLabelSize,
    // FollowAlgorithmSlice
    finishedFollow: state.finishedFollow,
    followNodeMap: state.followNodeMap,
    setFollowNodeMap: state.setFollowNodeMap,
    // NavigationSlice
    page: state.page,
  });
  const {
    // GrammarSlice
    endOfInput,
    terminals,
    // FollowNodeSlice
    followSetupComplete,
    followNodes,
    followEdges,
    setFollowNodes,
    setFollowEdges,
    setLabelSize,
    // FollowAlgorithmSlice
    finishedFollow,
    followNodeMap,
    setFollowNodeMap,
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

  const isFollow = data.name.startsWith("Follow");

  const followSymbols: Terminal[] = useMemo(() => {
    return [endOfInput, ...terminals];
  }, [endOfInput, terminals]);

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

  const outgoingNodeMaps: Map<string, FollowAlgorithmNodeMap> | undefined =
    useMemo(() => {
      const outgoingNodeMaps: Map<string, FollowAlgorithmNodeMap> = new Map();
      followEdges.forEach((edge) => {
        // At this point the graph is still incomplete, so we skip the edges
        // to newly user created nodes.
        if (page === 7) {
          if (edge.data?.name.match(/Follow\(/) !== null) {
            return;
          }
        }

        // Now that we have the complete graph, we can look at the
        // outgoing edges. But we do not need to propagate to
        // Fe(SCC()) nodes, since we already computed the Fe sets.
        // So we skip edges that have no Follow(SCC()) in them
        if (edge.data?.name.match(/Follow\(SCC\(/) === null) {
          return;
        }

        if (edge.source === id && edge.target !== id) {
          const outgoingNodeMap = followNodeMap.get(edge.target);
          if (!outgoingNodeMap) {
            if (import.meta.env.DEV) {
              console.log(
                "Error Code 92fbcf: outgoingNodeMap not found",
                edge.target,
              );
            }
            showSnackbar(
              "Error Code 92fbcf: Please contact the developer!",
              "error",
              true,
            );
            return;
          }
          outgoingNodeMaps.set(edge.target, outgoingNodeMap);
        }
      });
      return outgoingNodeMaps;
    }, [followEdges, followNodeMap, id, page, showSnackbar]);
  const thisFollowNodeMap: FollowAlgorithmNodeMap | undefined = useMemo(() => {
    return followNodeMap.get(id);
  }, [followNodeMap, id]);
  // A node (button) is disabled if any outgoing node is active.
  const disabledBecauseOfOutgoing = useMemo(() => {
    if (page === 7) {
      return false;
    }
    if (!outgoingNodeMaps) {
      return false;
    }
    let disabled = !isFollow;
    for (const outgoingNodeMap of outgoingNodeMaps.values()) {
      if (outgoingNodeMap.active) {
        return true;
      } else {
        disabled = false;
      }
    }
    return disabled;
  }, [isFollow, outgoingNodeMaps, page]);
  const disabledBecauseOfIncoming = useMemo(() => {
    if (page === 7) {
      return false;
    }
    if (!thisFollowNodeMap) {
      return false;
    }
    for (const incomingFollowSet of thisFollowNodeMap.incomingFollow.values()) {
      if (incomingFollowSet === undefined) {
        return true;
      }
    }
    return false;
  }, [page, thisFollowNodeMap]);
  const someIncoming = useMemo(() => {
    if (!disabledBecauseOfIncoming || !thisFollowNodeMap) {
      return false;
    } else {
      for (const incomingFollowSet of thisFollowNodeMap.incomingFollow.values()) {
        if (incomingFollowSet !== undefined) {
          return true;
        }
      }
    }
  }, [disabledBecauseOfIncoming, thisFollowNodeMap]);

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
    // Do I also need to update this ones edges (the names)?
    // Technically, the user is only allowed to the next step if the graph
    // is correct. This can never be the case if the last action was ungrouping.
    // As there would be more pressing errors, the user will be notified of
    // them instead of any edge errors. This means we can probably be lazy
    // here and not update the edges (their names).
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
                name: isFollow ? "Follow(SCC())" : "Fε(SCC())",
              },
            };
          }
          return node;
        }
      }),
    );
  };

  const handleClickGroupNode = () => {
    if (thisFollowNodeMap) {
      if (thisFollowNodeMap.active) {
        const newFollowNodeMap = new Map(followNodeMap);
        // toggle active
        newFollowNodeMap.set(id, {
          ...thisFollowNodeMap,
          active: false,
        });
        // update outgoung node's follow algorithm sets:
        // - update their incoming node's follow sets (in particular this one's)
        // - update their follow sets by re-computing them with the new
        // incoming node follow sets
        for (const [
          incomingNodeId,
          incomingFollowAlgorithmNodeMap,
        ] of outgoingNodeMaps!) {
          // copy the outgoing node's incoming node's follow sets
          const newIncomingFollowMap = new Map(
            incomingFollowAlgorithmNodeMap.incomingFollow,
          );
          // remove this node's follow set from the outgoing node's set
          // by setting it to undefined
          newIncomingFollowMap.set(id, undefined);
          // re-compute the outgoing node's follow set
          const relevantIncomingFollowSets: string[][] = [
            ...newIncomingFollowMap.values(),
          ].filter((followArr) => followArr !== undefined) as string[][];
          const newFollowSet = new Set(relevantIncomingFollowSets.flat());
          const newIncomingFollowAlgorithmNodeMap = {
            active: incomingFollowAlgorithmNodeMap.active,
            incomingFollow: newIncomingFollowMap,
            follow: newFollowSet,
          };
          // save the outgoing node's new follow algorithm set
          newFollowNodeMap.set(
            incomingNodeId,
            newIncomingFollowAlgorithmNodeMap,
          );
        }
        if (import.meta.env.DEV) {
          console.log(
            "newFollowNodeMap after clicking " + id + ":",
            newFollowNodeMap,
          );
        }
        setFollowNodeMap(newFollowNodeMap);
      } else {
        const newFollowNodeMap = new Map(followNodeMap);
        // toggle active
        newFollowNodeMap.set(id, {
          ...thisFollowNodeMap,
          active: true,
        });
        // update outgoung node's follow algorithm sets:
        // - update their incoming node's follow sets (in particular this one's)
        // - update their follow sets by re-computing them with the new
        // incoming node follow sets
        const myFollowSet: Set<string> = thisFollowNodeMap.follow;
        for (const [
          incomingNodeId,
          incomingFollowAlgorithmNodeMap,
        ] of outgoingNodeMaps!) {
          // copy the outgoing node's incoming node's follow sets
          const newIncomingFollowMap = new Map(
            incomingFollowAlgorithmNodeMap.incomingFollow,
          );
          // update this node's follow set in the outgoing node's set
          newIncomingFollowMap.set(id, [...myFollowSet]);
          // re-compute the outgoing node's follow set
          const newFollowSet = new Set([
            ...incomingFollowAlgorithmNodeMap.follow,
            ...myFollowSet,
          ]);
          const newIncomingFollowAlgorithmNodeMap = {
            active: incomingFollowAlgorithmNodeMap.active,
            incomingFollow: newIncomingFollowMap,
            follow: newFollowSet,
          };
          // save the outgoing node's new follow algorithm set
          newFollowNodeMap.set(
            incomingNodeId,
            newIncomingFollowAlgorithmNodeMap,
          );
        }
        if (import.meta.env.DEV) {
          console.log(
            "newFollowNodeMap after clicking " + id + ":",
            newFollowNodeMap,
          );
        }
        setFollowNodeMap(newFollowNodeMap);
      }
    } else {
      if (import.meta.env.DEV) {
        console.log(
          "Error Code 955767: thisFollowNodeMap not found",
          thisFollowNodeMap,
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
    page === 7 ? (
      <p className="m-0 whitespace-nowrap">
        {isFollow ? (
          <b>
            Follow<sub>1</sub>:
          </b>
        ) : (
          <b>
            F<sub>ε</sub>:
          </b>
        )}
        <br />
        {followSymbols.map((terminal) => {
          const isInFollowSet = thisFollowNodeMap?.follow.has(terminal.name);
          return (
            <StyledSpan
              key={terminal.name}
              className={
                isInFollowSet ? "isColoredChild font-semibold" : "opacity-50"
              }
              sx={{
                // TODO: currently green on blue, might be hard to read?
                color: isInFollowSet ? "success.dark" : "inherit",
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
          bgcolor: thisFollowNodeMap?.active
            ? (theme) =>
                theme.palette.mode === "light"
                  ? "primary.light"
                  : "primary.dark"
            : "secondary.dark",
          color: thisFollowNodeMap?.active
            ? "primary.contrastText"
            : "secondary.contrastText",
          "& .isInFollowSet": {
            // TODO: currently green on blue if active, might be hard to read?
            color: thisFollowNodeMap?.active ? "success.dark" : "success.light",
          },
          ":disabled": {
            bgcolor: thisFollowNodeMap?.active
              ? "follow.selected"
              : someIncoming
                ? "follow.charging"
                : "background.paper",
            color: thisFollowNodeMap?.active
              ? "follow.disabledText"
              : someIncoming
                ? "follow.disabledText"
                : "",
            "& .isInFollowSet": {
              // TODO: currently green on blue if active, might be hard to read?
              color: thisFollowNodeMap?.active
                ? "success.dark"
                : "success.dark",
            },
          },
          ":hover": {
            bgcolor: "follow.hover",
          },
        }}
        className="nodrag size-full normal-case"
        onClick={handleClickGroupNode}
        disabled={
          finishedFollow ||
          disabledBecauseOfOutgoing ||
          disabledBecauseOfIncoming
        }
      >
        <p className="m-0 whitespace-nowrap">
          {isFollow ? (
            <b>
              Follow<sub>1</sub>:
            </b>
          ) : (
            <b>
              F<sub>ε</sub>:
            </b>
          )}
          <br />
          {followSymbols.map((terminal) => {
            const isInFollowSet = thisFollowNodeMap?.follow.has(terminal.name);
            return (
              <span
                key={terminal.name}
                className={
                  isInFollowSet ? "isInFollowSet font-semibold" : "opacity-50"
                }
              >
                {terminal.name + " "}
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
      {!followSetupComplete && isFollow && (
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
            sx={
              page === 7
                ? {
                    padding: "0.5rem",
                    bgcolor: isFollow ? "" : "background.paper",
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
                        theme.palette.mode === "dark" &&
                        isConnectable &&
                        isConnecting
                          ? "success.light"
                          : "",
                    },
                  }
                : {}
            }
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
