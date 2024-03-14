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

/**
 * The props for the {@link FollowGroupNode | FollowGroupNode component}
 *
 * @param id - The id of the node
 * @param xPos - The x position of the node, required for computing the new position if detaching the children
 * @param yPos - The y position of the node, required for computing the new position if detaching the children
 * @param data - The {@link NodeData | data} of the node
 * @param isConnectable - Whether the node is connectable, disabled once the graph is set up
 */
export type Props = NodeProps<NodeData>;

// this creates a span component that has the sx prop (for styling)
const StyledSpan = styled("span")({});

/**
 * The node for grouping follow-nodes into strongly connected components
 *
 * @remarks
 * It displays the F_e/follow sets as text in the setup step and
 * turns into a button during the computation step
 *
 * @param id - The id of the node
 * @param xPos - The x position of the node, required for computing the new position if detaching the children
 * @param yPos - The y position of the node, required for computing the new position if detaching the children
 * @param data - The {@link NodeData | data} of the node
 * @param isConnectable - Whether the node is connectable, disabled once the graph is set up
 */
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
    setFollowLabelSize: state.setFollowLabelSize,
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
    setFollowLabelSize,
    // FollowAlgorithmSlice
    finishedFollow,
    followNodeMap,
    setFollowNodeMap,
    // NavigationSlice
    page,
  } = useBoundStore(selector, shallow);

  // In theory we could use the id to do some more advanced checks
  // such as same node type etc. but for now we only want to now
  // if the user is connecting nodes
  const connectionNodeId = useStore((state) => state.connectionNodeId);
  // This tells us when the user is connecting (any) nodes
  const isConnecting = !!connectionNodeId;

  // get the child nodes. We need them because we only want to show
  // the ungroup option if there are actual children to ungroup
  const childNodes = followNodes.filter((node) => node.parentNode === id);

  // This next part is VERY hacky but it kinda works. most of the time.
  // For the layout algorithm, we need a node's size. You would think that
  // ReactFlow would put the node's size in its size variable, but you would
  // be wrong. So we must get the numbers ourself somehow.
  // We do this by using a ref and its clientWidth and height.
  // This does not exactly translate to reactflow's sizes, but it works
  // well enough. But on rendering, the ref's size is not correct (yet) and
  // as it is not a state variable, we don't know when it changes it's value.
  // So we use useEffect and hope that something else triggers a re-render
  // and that at that point the size is correct.
  // This is not a good solution but it seems to work.
  // Also, when the user changes the group nodes size, this does (luckily)
  // trigger a re-render which means that the size is updated.
  const ref = useRef<HTMLDivElement | null>(null);
  const [minHeight, setMinHeight] = useState(0);
  const [minWidth, setMinWidth] = useState(0);
  useEffect(() => {
    // Because reactflow's size is not the client size (due to zoom etc.)
    // we just eyeball it and add something to it.
    const width = ref.current?.clientWidth || 0;
    const height = ref.current?.clientHeight || 0;
    setMinHeight(height + 26);
    setMinWidth(width + 26);
    setFollowLabelSize(id, {
      width: width,
      height: height,
    });
    if (import.meta.env.DEV) {
      console.log(
        "GroupNode label size:",
        ref.current?.clientWidth,
        ref.current?.clientHeight,
      );
    }
  }, [id, ref, setFollowLabelSize]);

  // There are the copied F_e group nodes and the new Follow group nodes.
  // By looking at the name we can tell them apart.
  // We need this because only the new follow nodes may be modified by
  // the user (= ungroup and delete)
  const isFollow = data.name.startsWith("Follow");

  // the follow set can contain terminals and the end of input symbol $
  const followSymbols: Terminal[] = useMemo(() => {
    return [endOfInput, ...terminals];
  }, [endOfInput, terminals]);

  const { enqueueSnackbar } = useSnackbar();
  /**
   * Function to display a notification to the user.
   *
   * @param message - The message to be displayed.
   * @param variant - The variant of the notification. Could be success, error, warning, info, or default.
   * @param preventDuplicate - If true, the notification will not be displayed if it is already displayed.
   */
  const showSnackbar = useCallback(
    (message: string, variant: VariantType, preventDuplicate: boolean) => {
      enqueueSnackbar(message, {
        variant,
        preventDuplicate,
      });
    },
    [enqueueSnackbar],
  );

  // the followAlgorithmMaps of all outgoing nodes
  // These are the sets this node has to update when propagating its set
  const outgoingNodeMaps: Map<string, FollowAlgorithmNodeMap> | undefined =
    useMemo(() => {
      const outgoingNodeMaps: Map<string, FollowAlgorithmNodeMap> = new Map();
      followEdges.forEach((edge) => {
        // Page 7 is the setup
        // At this point the graph is still incomplete, so we skip the edges
        // to newly user created nodes as these may still change.
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
  // this nodes followAlgorithmMaps
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
  // A node (button) is disabled if it has not recieved all its sets
  // (= a thisFollowNodeMap.incomingFollow set is undefined).
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
  // we want to know if we have recieved some but not all sets
  // for changing the button color
  const someIncoming = useMemo(() => {
    // if this is true, it has either recieved all or no sets
    // (because the thisFollowNodeMap was not even created yet)
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

  /**
   * On deleting this node, all children have to remove this node as its parent.
   * Also this node and its edges get removed.
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

  /**
   * On ungrouping this node, all children have to remove this node as
   * its parent.
   * This node's name also gets updated. Technically that means this node's
   * edges need their name updated, too, but I think we can be lazy here
   * because they will get updated when a node is added as a child,
   * which must happen at some point (the user can't progress with
   * an empty SCC in the graph)
   */
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

  /**
   * This function propagates this SCCs f_e/follow set to the outgoing nodes, or
   * if already propagated, removes its set from them.
   * Afterwards it re-computes the outgoing nodes follow sets.
   */
  const handleClickGroupNode = () => {
    if (thisFollowNodeMap) {
      // if active, deactivate
      if (thisFollowNodeMap.active) {
        const newFollowNodeMap = new Map(followNodeMap);
        // toggle active off
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
        // if not active, activate
        const newFollowNodeMap = new Map(followNodeMap);
        // toggle active on
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

  // Because we don't know how many terminals there are in the grammar
  // we don't know how large the label should be. So we have to
  // compute it dynamically. We take ~ the sqrt of the number of terminals
  // to know how many terminals we can fit to make it roughly look like a
  // square. (= After how many terminals must come a line break)
  const sqrtTerminals = useMemo(() => {
    return Math.ceil(Math.sqrt(terminals.length) * 1.5);
  }, [terminals.length]);

  const content =
    // on page 7 (setup) we display the sets as text
    // on page 8 we make it a button
    page === 7 ? (
      <p className="m-0 h-fit whitespace-pre px-3">
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
        {followSymbols.map((terminal, index) => {
          const isInFollowSet = thisFollowNodeMap?.follow.has(terminal.name);
          return (
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
              {index % sqrtTerminals === sqrtTerminals - 1 && <br />}
            </StyledSpan>
          );
        })}
      </p>
    ) : (
      <Button
        variant="contained"
        sx={{
          // We color the button based on the active state of the node.
          // If it is active it has gotten all its sets and propagated them.
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
            // symbols in this nodes set are green. Since the color of the node
            // changes depending on wheter or not it has propagated its sets
            // and we need a contrast, we use dark green to contrast
            // the light blue (active) and light green to contrast the
            // purple (inactive)
            color: thisFollowNodeMap?.active ? "success.dark" : "success.light",
          },
          // If the node is disabled, it has either propagated all sets
          // or not gotten all of them
          ":disabled": {
            bgcolor: thisFollowNodeMap?.active
              ? "follow.selected"
              : someIncoming
                ? // if some were recieved, we want a different color then if none
                  // were recieved
                  "follow.charging"
                : "background.paper",
            color: thisFollowNodeMap?.active
              ? "follow.disabledText"
              : someIncoming
                ? "follow.disabledText"
                : "",
            "& .isInFollowSet": {
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
          // The button is disabled if none or some but not all sets
          // were recieved or if at least one of its successors is active
          finishedFollow ||
          disabledBecauseOfOutgoing ||
          disabledBecauseOfIncoming
        }
      >
        <p className="m-0 whitespace-pre">
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
          {followSymbols.map((terminal, index) => {
            const isInFollowSet = thisFollowNodeMap?.follow.has(terminal.name);
            return (
              <span
                key={terminal.name}
                className={
                  isInFollowSet ? "isInFollowSet font-semibold" : "opacity-50"
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
      {!followSetupComplete && isFollow && (
        // We only allow deleting and ungrouping in the setup step
        // and only for the user added (=follow) nodes
        <NodeToolbar className="nodrag">
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={{ xs: 1, sm: 2 }}
          >
            <Button variant="outlined" color="error" onClick={onDelete}>
              Delete
            </Button>
            {/* children can only be ungrouped if they exist */}
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
            // We color the node green to indicate that it is a valid
            // target for the user to connect to
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
                    // padding: "0.5rem",
                    padding: isFollow ? "1px" : "3px",
                    display: "flex",
                    alignItems: "center",
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
      </div>
    </>
  );
}

export default FollowGroupNode;
