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

  const connectionNodeId = useStore((state) => state.connectionNodeId);

  const isConnecting = !!connectionNodeId;

  const content =
    page === 3 ? (
      <FormControl fullWidth>
        {/* <InputLabel htmlFor={id + "-nativeSelect"}>Symbol</InputLabel> */}
        <Select
          native
          size="small"
          sx={{
            bgcolor: "background.paper",
          }}
          className="nodrag min-w-max"
          id={id + "-nativeSelect"}
          // label="Symbol"
          value={data.name}
          onChange={(e) => {
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
          }
        }}
        className="nodrag p-1 min-w-[2.5rem] normal-case"
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
            // TODO: 1 or 4?
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
        {!isConnecting && (
          <Handle
            className="absolute left-0 top-0 h-full w-full transform-none cursor-cell rounded-none border-0 opacity-0"
            type="source"
            position={Position.Bottom}
            isConnectable={isConnectable}
            isConnectableEnd={false}
            style={isConnectable ? {} : { opacity: 0 }}
          />
        )}
        <Handle
          className="absolute left-0 top-0 h-full w-full transform-none cursor-cell rounded-none border-0 opacity-0"
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
