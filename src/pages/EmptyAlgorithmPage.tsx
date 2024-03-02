import { styled } from "@mui/material";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

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

// this import is only required for a tsdoc @link tag:
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { HeaderComponent } from "../components";

type Props = {
  graphCanvas: JSX.Element;
};

// this creates a span component that has the sx prop (for styling)
const StyledSpan = styled("span")({});

/**
 * This is the fifth page of the webtutor.
 * It lets the user propagate the empty attribute of the nonterminals.
 * 
 * @param graphCanvas - The reactflow canvas to display the grammar.
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
  /**
   * Function to display a notification to the user.
   * 
   * @param message - The message to be displayed.
   * @param variant - The variant of the notification. Could be success, error, warning, info, or default.
   * @param preventDuplicate - If true, the notification will not be displayed if it is already displayed.
   */
  const showSnackbar = (
    message: string,
    variant: VariantType,
    preventDuplicate: boolean,
  ) => {
    enqueueSnackbar(message, {
      variant,
      preventDuplicate,
    });
  };

  /**
   * Function to reset the current step.
   * 
   * @remarks
   * 
   * This function resets all nodes and edges to their color
   * at the beginning of the current step. It also resets the
   * fixpoint switch.
   */
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

  /**
   * Function to solve the current step.
   * 
   * @remarks
   * 
   * This function sets all nodes and edges to their correct
   * color. It also sets the fixpoint switch to the correct
   * value.
   */
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

  /**
   * Function to check the current step.
   * 
   * @remarks
   * 
   * This function checks if all nodes have their empty attribute
   * set correctly and if the fixpoint switch is set correctly.
   * If the step is incorrect, an error notification is displayed.
   * If the algorithm is finished, a success notification is displayed.
   * 
   * @returns - True if the step is correct, false otherwise.
   */
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

  /**
   * Function to prepare the next step.
   * 
   * @remarks
   * 
   * This function updates the nodes to reflect the beginning
   * of the next step. It also computes the next steps solution.
   * 
   * @privateRemarks
   * 
   * WARNING: When changing this function, make sure to adjust the
   * {@link HeaderComponent}'s prepareEmptyAlgorithm function as well.
   * It is responsible for preparing the first step.
   */
  const prepareNextStep = () => {
    // update nodes to reflect beginning of next step
    updateAllEmptyNodeAndEdgeColors();
    // color nonterminals, terminals and productions next to the canvas
    setEmptyNonterminalMap(nonTerminals.map((n) => [n.name, n.empty]));
    setEmptyProductionMap(productions.map((p) => [p.name, p.empty]));

    // Compute next steps solution
    /*
    // Full Algorithm:
    // 1. set terminal ε to empty = true
    // (already happens when creating)

    // 2. while fixpoint is not reached, check all productions
    let workList: Array<Production> = [...productions];
    // with non-empty left side
    let fixpoint = false;
    let counter = 0;
    while (!fixpoint && counter < 10000) {
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
      showSnackbar(
        "Congratulations! You have computed the empty attributes!",
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

  return (
    <>
      {/* left side, grammar information */}
      <div className="mr-1 h-full w-1/2 overflow-auto rounded-lg border-2 border-solid p-2 text-left sm:w-1/3">
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
