import { styled } from "@mui/material";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";

import useBoundStore from "../store/store";
import { shallow } from "zustand/shallow";

import { VariantType, useSnackbar } from "notistack";

import {
  Nonterminal,
  EmptyNodeSlice,
  EmptyAlgorithmSlice,
  GrammarSlice,
  NodeColor,
} from "../types";

type Props = {
  graphCanvas: JSX.Element;
};

/*
This is the fifth page of the webtutor.
It lets the user apply the algorithm to propagate the empty
attribute of the (non)terminals.
*/
function EmptyAlgorithmPage({ graphCanvas }: Props) {
  const selector = (
    state: GrammarSlice & EmptyAlgorithmSlice & EmptyNodeSlice,
  ) => ({
    // GrammarSlice
    epsilon: state.epsilon,
    productions: state.productions,
    nonTerminals: state.nonTerminals,
    terminals: state.terminals,
    // EmptyAlgorithmSlice
    emptyNonterminalMap: state.emptyNonterminalMap,
    emptyProductionMap: state.emptyProductionMap,
    emptyUserFixpoint: state.emptyUserFixpoint,
    emptyFixpoint: state.emptyFixpoint,
    emptyWorkList: state.emptyWorkList,
    finishedEmpty: state.finishedEmpty,
    setEmptyNonterminalMap: state.setEmptyNonterminalMap,
    setEmptyProductionMap: state.setEmptyProductionMap,
    setEmptyUserFixpoint: state.setEmptyUserFixpoint,
    setEmptyFixpoint: state.setEmptyFixpoint,
    setEmptyWorkList: state.setEmptyWorkList,
    setFinishedEmpty: state.setFinishedEmpty,
    // EmptyNodeSlice
    emptyNodes: state.emptyNodes,
    updateEmptyNodeAndEdgeEmpty: state.updateEmptyNodeAndEdgeEmpty,
    updateAllEmptyNodeAndEdgeColors: state.updateAllEmptyNodeAndEdgeColors,
  });
  const {
    // GrammarSlice
    epsilon,
    productions,
    nonTerminals,
    terminals,
    // EmptyAlgorithmSlice
    emptyNonterminalMap,
    emptyProductionMap,
    emptyUserFixpoint,
    emptyFixpoint,
    emptyWorkList,
    finishedEmpty,
    setEmptyNonterminalMap,
    setEmptyProductionMap,
    setEmptyUserFixpoint,
    setEmptyFixpoint,
    setEmptyWorkList,
    setFinishedEmpty,
    // EmptyNodeSlice
    emptyNodes,
    updateEmptyNodeAndEdgeEmpty,
    updateAllEmptyNodeAndEdgeColors,
  } = useBoundStore(selector, shallow);

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

  const resetStep = () => {
    // Reset all nodes and edges
    for (const node of emptyNodes) {
      if (node.data.color === NodeColor.thisTurn) {
        updateEmptyNodeAndEdgeEmpty(node.id, false);
      }
    }
    // Reset fixpoint switch
    setEmptyUserFixpoint(false);
  };

  const solveStep = () => {
    // Set all nodes correctly
    for (const node of emptyNodes) {
      // get the corresponding nonterminal or terminal
      const printable =
        nonTerminals.find((n) => n.name === node.data.name) ||
        terminals.find((t) => t.name === node.data.name) ||
        (epsilon.name === node.data.name ? epsilon : undefined);
      // this should not happen
      if (printable === undefined) {
        if (import.meta.env.DEV) {
          console.error("Error Code 3d6a9d: printable is undefined", node.data);
        }
        showSnackbar(
          "Error Code 3d6a9d: Please contact the developer!",
          "error",
          true,
        );
        return;
      }
      if (node.data.empty !== printable.empty) {
        if (import.meta.env.DEV) {
          console.log("node", node.data.name, node.data.empty);
          console.log("printable", printable.representation, printable.empty);
        }
        updateEmptyNodeAndEdgeEmpty(node.id, printable.empty);
      }
    }
    // Set fixpoint switch correctly
    if (emptyFixpoint !== emptyUserFixpoint) {
      setEmptyUserFixpoint(emptyFixpoint);
    }
  };

  const checkStep = () => {
    // Check if all nodes have their empty attribute set correctly
    for (const node of emptyNodes) {
      // get the corresponding nonterminal or terminal
      const printable =
        nonTerminals.find((n) => n.name === node.data.name) ||
        terminals.find((t) => t.name === node.data.name) ||
        (epsilon.name === node.data.name ? epsilon : undefined);
      // this should not happen
      if (printable === undefined) {
        if (import.meta.env.DEV) {
          console.error("Error Code 16b323: printable is undefined", node.data);
        }
        showSnackbar(
          "Error Code 16b323: Please contact the developer!",
          "error",
          true,
        );
        return false;
      }
      if (node.data.empty !== printable.empty) {
        if (import.meta.env.DEV) {
          console.log("node", node.data.name, node.data.empty);
          console.log("printable", printable.representation, printable.empty);
        }
        showSnackbar(
          "There is something wrong with your step! Reconsider your assignment of " +
            printable.representation +
            "!",
          "error",
          true,
        );
        return false;
      }
    }
    // Check if the fixpoint switch is set correctly
    if (emptyFixpoint !== emptyUserFixpoint) {
      if (emptyUserFixpoint) {
        showSnackbar(
          "The fixpoint has not been reached yet! The fixpoint switch should not be toggled!",
          "error",
          true,
        );
      } else {
        showSnackbar(
          "There should be no new changes in this step. Make sure you toggle the fixpoint switch!",
          "error",
          true,
        );
      }
      return false;
    }
    if (!emptyFixpoint) {
      showSnackbar("Correct, well done!", "success", true);
    }
    return true;
  };

  // WARNING: When changing the algorithm, make sure to change the first step
  // in the Apps prepareEmptyAlgorithm function as well
  const prepareNextStep = () => {
    // update nodes to reflece beginning of next step
    updateAllEmptyNodeAndEdgeColors();
    // color nonterminals, terminals and productions next to the canvas
    setEmptyNonterminalMap(nonTerminals.map((n) => [n.name, n.empty]));
    setEmptyProductionMap(productions.map((p) => [p.name, p.empty]));

    // calculate next steps solution
    /*
    // Full Algorithm:
    // 1. set terminal ε to empty = true
    // (already happens when creating)

    // 2. while fixpoint is not reached, check all productions
    let workList: Array<Production> = [...productions];
    // with non-empty left side
    let fixpoint = false;
    // TODO: perhaps remove this counter
    let counter = 0;
    while (!fixpoint && counter < 10000) {
        // TODO: remove this counter
        counter++;
        fixpoint = true;

        // 3. remove all new empty productions
        workList = workList.filter((p) => !p.empty);
        for (const production of workList) {
            // 5. if right side is empty, set left side and production to empty
            // also set fixpoint to false since there are new empty nonterminals
            if (!production.rightSide.some((s) => !s.empty)) {
                production.leftSide.empty = true;
                production.empty = true;
                fixpoint = false;
                continue;
            }
        }
    }
  */
    let newEmptyWorkList = [...emptyWorkList];
    let newEmptyFixpoint = emptyFixpoint;
    if (!emptyFixpoint) {
      newEmptyFixpoint = true;
      newEmptyWorkList = newEmptyWorkList.filter((p) => !p.empty);
      const newEmptyProductions = [];
      for (const production of newEmptyWorkList) {
        if (!production.rightSide.some((s) => !s.empty)) {
          newEmptyProductions.push(production);
        }
      }
      for (const production of newEmptyProductions) {
        production.empty = true;
        if (!production.leftSide.empty) {
          production.leftSide.empty = true;
          newEmptyFixpoint = false;
        }
      }
    } else {
      // TODO: maybe make canvas green or something
      showSnackbar(
        "Congratulations! You have calculated the empty attributes!",
        "success",
        true,
      );
      setFinishedEmpty(true);
      return;
    }

    if (import.meta.env.DEV) {
      console.log("newEmptyWorkList", newEmptyWorkList);
      console.log("newEmptyFixpoint", newEmptyFixpoint);
    }

    setEmptyWorkList(newEmptyWorkList);
    setEmptyFixpoint(newEmptyFixpoint);
  };

  const StyledSpan = styled("span")({});

  return (
    <>
      {/* left side, task description and information */}
      <div className="mr-1 h-full w-1/2 overflow-scroll rounded-lg border-2 border-solid p-2 text-left sm:w-1/3">
        <div className="flex h-full flex-col items-center justify-between">
          <div className="flex flex-col items-center">
            <p>The Nonterminals of the grammar are:</p>
            <ul className="commaList m-0 list-none p-0 before:mr-1 before:content-['𝑁_=_{'] after:ml-1 after:content-['}']">
              {nonTerminals.map((nonterminal, index) => (
                <li key={index} className="inline">
                  <StyledSpan
                    sx={{
                      color: emptyNonterminalMap.find(
                        ([n]) => n === nonterminal.name,
                      )?.[1]
                        ? "empty.text"
                        : "inherit",
                    }}
                  >
                    {nonterminal.representation}
                  </StyledSpan>
                </li>
              ))}
            </ul>
            <p>The Terminals of the grammar are:</p>
            <ul className="commaList m-0 list-none p-0 before:mr-1 before:content-['𝑇_=_{'] after:ml-1 after:content-['}']">
              {terminals.map((terminal, index) => (
                <li key={index} className="inline">
                  {terminal.representation}
                </li>
              ))}
            </ul>
            <p>The Productions of the grammar are:</p>
            <ul className="commaList listSpace m-0 mb-2 list-none p-0 text-left before:mr-1 before:content-['𝑃_=_{'] after:ml-1 after:content-['}']">
              {productions.map((production, index) => (
                <li key={index} className="ml-4">
                  <StyledSpan
                    sx={{
                      color: emptyProductionMap.find(
                        ([p]) => p === production.name,
                      )?.[1]
                        ? "empty.text"
                        : "inherit",
                    }}
                  >
                    {production.leftSide.representation + " => "}
                    {production.rightSide.map((v, i) => (
                      <StyledSpan
                        key={v.name + i}
                        sx={{
                          color:
                            v instanceof Nonterminal
                              ? emptyNonterminalMap.find(
                                  ([n]) => n === v.name,
                                )?.[1]
                                ? "empty.text"
                                : "inherit"
                              : v.name === epsilon.name
                                ? "empty.text"
                                : "inherit",
                        }}
                      >
                        {v.representation + " "}
                      </StyledSpan>
                    ))}
                    {production.uppercaseNumber}
                  </StyledSpan>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="flex flex-col items-center">
              <FormControlLabel
                htmlFor="userFixpoint"
                value="Fixpoint reached"
                label="Fixpoint reached"
                labelPlacement="top"
                className="rounded-lg border-2 border-solid p-1"
                control={
                  <Switch
                    id="userFixpoint"
                    name="userFixpoint"
                    checked={emptyUserFixpoint}
                    onChange={(e) => {
                      setEmptyUserFixpoint(e.target.checked);
                    }}
                    disabled={finishedEmpty}
                  />
                }
              />
            </div>

            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={{ xs: 1, md: 2 }}
              className="mt-2 pb-1"
            >
              <Button
                variant="contained"
                color="error"
                onClick={() => {
                  resetStep();
                }}
                disabled={finishedEmpty}
              >
                Reset Step
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={() => {
                  solveStep();
                }}
                disabled={finishedEmpty}
              >
                Show Solution
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  if (checkStep()) {
                    prepareNextStep();
                  }
                }}
                disabled={finishedEmpty}
              >
                Check Step
              </Button>
            </Stack>
          </div>
        </div>
      </div>
      {/* right side, reactflow canvas */}
      <div className="h-full w-1/2 rounded-lg border-2 border-solid p-2 sm:w-2/3">
        {graphCanvas}
      </div>
    </>
  );
}

export default EmptyAlgorithmPage;
