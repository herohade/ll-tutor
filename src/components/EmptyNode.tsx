import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

import { Handle, NodeProps, Position, useStore } from "reactflow";

import useBoundStore from "../store/store";
import { shallow } from "zustand/shallow";

import {
  EmptyAlgorithmSlice,
  EmptyNodeSlice,
  GrammarSlice,
  NavigationSlice,
  NodeColor,
  NodeData,
} from "../types";

type Props = NodeProps<NodeData>;

/**
 * The node type used for computing the empty sets
 * 
 * @remarks
 * 
 * Acts as a select input on page 3 and a button on page 4
 * 
 * @param id - The id of the node
 * @param data - The {@link NodeData | data} of the node
 * @param isConnectable - Whether the node is connectable, disabled once the graph is set up
 */
function EmptyNode({ id, data, isConnectable }: Props) {
  const selector = (
    state: GrammarSlice &
      EmptyNodeSlice &
      EmptyAlgorithmSlice &
      NavigationSlice,
  ) => ({
    // GrammarSlice
    epsilon: state.epsilon,
    nonTerminals: state.nonTerminals,
    terminals: state.terminals,
    // EmptyNodeSlice
    emptySetupComplete: state.emptySetupComplete,
    updateEmptyNodeAndEdgeEmpty: state.updateEmptyNodeAndEdgeEmpty,
    updateEmptyNodeAndEdges: state.updateEmptyNodeAndEdges,
    // EmptyAlgorithmSlice
    finishedEmpty: state.finishedEmpty,
    // NavigationSlice
    page: state.page,
  });
  const {
    // GrammarSlice
    epsilon,
    nonTerminals,
    terminals,
    // EmptyNodeSlice
    emptySetupComplete,
    updateEmptyNodeAndEdgeEmpty,
    updateEmptyNodeAndEdges,
    // EmptyAlgorithmSlice
    finishedEmpty,
    // NavigationSlice
    page,
  } = useBoundStore(selector, shallow);

  // In theory we could use the id to do some more advanced checks
  // such as same node type etc. but for now we only want to now
  // if the user is connecting nodes
  const connectionNodeId = useStore((state) => state.connectionNodeId);
  // This tells us when the user is connecting (any) nodes
  const isConnecting = !!connectionNodeId;

  // The node behaves differently depending on the page
  // On page 3 (empty setup), the user selects the symbol
  // represented by this node
  // On page 4 (empty algorithm), the user can click the node
  // to toggle the empty attribute
  const content =
    page === 3 ? (
      <FormControl fullWidth>
        <Select
          native
          size="small"
          sx={{
            bgcolor: "background.paper",
          }}
          className="nodrag min-w-max"
          id={id + "-nativeSelect"}
          value={data.name}
          onChange={(e) => {
            // get the selected symbol
            const printableName = e.target.value;
            const printable =
              nonTerminals.find((n) => n.name === printableName) ||
              terminals.find((t) => t.name === printableName) ||
              epsilon;
            if (import.meta.env.DEV) {
              if (printable.references <= 0) {
                console.error(
                  "Could not find",
                  printableName,
                  "in",
                  nonTerminals,
                  terminals,
                  epsilon,
                );
              }
            }
            // update the node and its edges
            // (mainly the color, which is blue if its epsilon)
            updateEmptyNodeAndEdges(id, printable.name, printable.empty);
          }}
          disabled={emptySetupComplete}
        >
          <optgroup label="Non-Terminals">
            {nonTerminals.map((nonTerminal) => (
              <option value={nonTerminal.name} key={nonTerminal.name}>
                {nonTerminal.representation}
              </option>
            ))}
          </optgroup>
          <optgroup label="Terminals">
            {terminals.map((terminal) => (
              <option value={terminal.name} key={terminal.name}>
                {terminal.representation}
              </option>
            ))}
          </optgroup>
          {/* We only display epsilon as a choice if there is an empty production */}
          {epsilon.references > 0 && (
            <optgroup label="Epsilon">
              <option value={epsilon.name} key={epsilon.name}>
                {epsilon.representation}
              </option>
            </optgroup>
          )}
        </Select>
      </FormControl>
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
            bgcolor: "empty.new",
          },
        }}
        className="nodrag min-w-10 p-1 normal-case"
        onClick={() => {
          updateEmptyNodeAndEdgeEmpty(id, !data.empty);
        }}
        disabled={
          page !== 4 ||
          finishedEmpty ||
          (data.color !== NodeColor.none && data.color !== NodeColor.thisTurn)
        }
      >
        {data.name}
      </Button>
    );

  return (
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
        <div className="z-[10000] m-5">{content}</div>
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
            className="size-full absolute left-0 top-0 transform-none cursor-cell rounded-none border-0 opacity-0"
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
          className="size-full absolute left-0 top-0 transform-none cursor-cell rounded-none border-0 opacity-0"
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
          isConnectableStart={false}
          style={isConnectable ? {} : { opacity: 0 }}
        />
      </Box>
    </Box>
  );
}

export default EmptyNode;
