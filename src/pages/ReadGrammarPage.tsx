import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import ListItem from "@mui/material/ListItem";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import ListItemText from "@mui/material/ListItemText";
import CircularProgress from "@mui/material/CircularProgress";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import DialogContentText from "@mui/material/DialogContentText";

import { Fragment as ReactFragment, useState } from "react";

import { VariantType, useSnackbar } from "notistack";

import useBoundStore from "../store/store";
import { shallow } from "zustand/shallow";

import { ScrollableDialogComponent } from "../components";

import {
  Production,
  Nonterminal,
  Terminal,
  printable,
  GrammarSetupSlice,
  GrammarSlice,
} from "../types";

// Allowed (non)terminal characters
// ascii characters from 33 to 126 except:
// " "(space), "$" and "|" as they might be confusing
const allowedSymbols: string =
  "!\"#%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{}~";

/**
 * Function to add a printable to an array if it is not already contained,
 * unless allowDuplicates is true.
 * It also increments the reference counter of the element if it is added.
 * 
 * @remarks
 * 
 * allowDuplicates is usually true when adding terminals and nonterminals,
 * as they can be used in multiple productions or even multiple times
 * in the same production.
 * 
 * allowDuplicates is usually false when adding productions, as we don't
 * need a production twice, even if the user enters it twice.
 * 
 * @param array - The array to add the element to
 * @param element - The element to add
 * @param allowDuplicates - If true, the reference counter is increased if the element is already contained in the array. Otherwise the element is ignored.
 * @returns The element that was added to the array, or the element that was already contained in the array
 */
const addIfNewAndReturn = function <T extends printable>(
  array: T[],
  element: T,
  allowDuplicates: boolean = true,
): T {
  const e = array.find((e) => e.name === element.name);
  if (e) {
    if (allowDuplicates) {
      // If this is a duplicate and we allow it,
      // we need to increse its reference counter.
      // (We don't actually want two of the same production
      // even if it is called "allow duplicates", instead
      // we only increase the reference counter on the unique element)
      e.references++;
    } else {
      // If this is a duplicate and we disallow duplicates,
      // we don't increase its reference counter.
      // Additionally, if it is a production,
      // we need to decrease the reference counter of all
      // terminals and nonterminals in it, as they have been increased
      // when creating the production that we now don't need.
      if (e instanceof Production) {
        e.leftSide.references--;
        for (const symbol of e.rightSide) {
          symbol.references--;
        }
      }
    }
    return e;
  } else {
    element.references++;
    array.push(element);
    return element;
  }
};

// this creates a TextField component that changes color based on the
// validity of the input
const ValidationTextField = styled(TextField)({
  "& input:valid + fieldset": {
    borderColor: "#E0E3E7",
    borderWidth: 1,
  },
  "& input:invalid + fieldset": {
    borderColor: "red",
    borderWidth: 1,
  },
  "& input:valid:focus + fieldset": {
    borderLeftWidth: 4,
    padding: "4px !important", // override inline-style
  },
});

// The lecture examples are hardcoded here:
// - grammarName is the name displayed when selecting the grammar.
// - startNonterminal is the nonterminal that is used as the user
// start symbol. (S' -> startNonterminal will be added automatically)
// - productions is an array of strings, where each string is a production,
// in the same format as if entered by the user.
const lectureExamples: [
  grammarName: string,
  startNonterminal: string,
  productions: string[],
][] = [
  ["Example 1:", "S", ["S -> aSb", "S -> "]],
  ["Example 2:", "S", ["S -> As", "A -> aA", "A -> "]],
  [
    "Example 3:",
    "S",
    ["S -> aAaB", "S -> bAbB", "A -> aA", "A -> a", "B -> aB", "B -> a"],
  ],
  [
    "Example 4:",
    "S",
    [
      "S -> P",
      "P -> n->V",
      "V -> O/V",
      "V -> O",
      "O -> L",
      "O -> ",
      "L -> YL",
      "L -> Y",
      "Y -> n",
      "Y -> t",
    ],
  ],
];

/**
 * This is the second page of the webtutor.
 * It reads the grammars productions from the user and displays them.
*/
function ReadGrammarPage() {
  const selector = (state: GrammarSlice & GrammarSetupSlice) => ({
    // GrammarSlice
    startSymbol: state.startSymbol,
    epsilon: state.epsilon,
    endOfInput: state.endOfInput,
    productions: state.productions,
    nonTerminals: state.nonTerminals,
    terminals: state.terminals,
    setProductions: state.setProductions,
    setNonTerminals: state.setNonTerminals,
    setTerminals: state.setTerminals,
    // GrammarSetupSlice
    start: state.start,
    sorted: state.sorted,
    setStart: state.setStart,
    setSorted: state.setSorted,
    setReduced: state.setReduced,
  });
  const {
    // GrammarSlice
    startSymbol,
    epsilon,
    endOfInput,
    productions,
    nonTerminals,
    terminals,
    setProductions,
    setNonTerminals,
    setTerminals,
    // GrammarSetupSlice
    start,
    sorted,
    setStart,
    setSorted,
    setReduced,
  } = useBoundStore(selector, shallow);

  // The production that the user is currently entering
  const [newProduction, setNewProduction] = useState("");
  // the error state for and text displayed by the ValidationTextField
  const [error, setError] = useState(false);
  const [errorText, setErrorText] = useState("");

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

  // loading a lecture example may take some time, so we need to show the user
  // a loading indicator.
  // If the grammar is changed or we navigate to the next page, we need to
  // reset the loading and success indicators.
  const [loadingLectureExample, setLoadingLectureExample] = useState<
    number | undefined
  >(undefined);
  const [lectureExampleSuccess, setLectureExampleSuccess] = useState<
    number | undefined
  >(undefined);

  /**
   * Function to check if a production is valid.
   * It displays a notification to the user if the production is invalid.
   * 
   * @param production - The production to be checked.
   * @returns True if the production is valid, false otherwise.
   */
  const validProduction = (production: string): boolean => {
    // Firstly check if it is valid and display appropriate error messages
    if (production === "") {
      setError(true);
      setErrorText("Please enter a production!");
      showSnackbar("Please enter a production!", "error", true);
      return false;
    }
    if (!production.includes("->")) {
      setError(true);
      setErrorText("Please enter a production of form A->...");
      showSnackbar("Please enter a production of form A->...", "error", true);
      return false;
    }

    const [left, right] = production.split(/->(.*)/s).map((x) => x.trim());
    if (left.length !== 1) {
      setError(true);
      setErrorText("The left side of the production must be a single nonterminal!");
      showSnackbar(
        "The left side of the production must be a single nonterminal!",
        "error",
        true,
      );
      return false;
    }
    if (left < "A" || left > "Z") {
      setError(true);
      setErrorText("The left side of the production must be a nonterminal!");
      showSnackbar(
        "The left side of the production must be a nonterminal!",
        "error",
        true,
      );
      return false;
    }

    for (const c of right) {
      if (!allowedSymbols.includes(c)) {
        setError(true);
        setErrorText(
          "The right side of the production must only contain allowed symbols!" +
            ` ("${c}" is not allowed)`,
        );
        showSnackbar(
          "The right side of the production must only contain allowed symbols!" +
            ` ("${c}" is not allowed)`,
          "error",
          true,
        );
        return false;
      }
    }
    
    // If the production is valid, add it to the grammar

    setError(false);
    setErrorText("");

    let leftSide = new Nonterminal(left);
    const rightSide: Array<Terminal | Nonterminal> = [];

    const copyProductions = [...productions];
    const copyNonTerminals = [...nonTerminals];
    const copyTerminals = [...terminals];

    leftSide = addIfNewAndReturn(copyNonTerminals, leftSide);
    for (const c of right) {
      if (c >= "A" && c <= "Z") {
        let n = new Nonterminal(c);
        n = addIfNewAndReturn(copyNonTerminals, n);
        rightSide.push(n);
      } else {
        let t = new Terminal(c);
        t = addIfNewAndReturn(copyTerminals, t);
        rightSide.push(t);
      }
    }
    if (right === "") {
      epsilon.references++;
      rightSide.push(epsilon);
    }

    addIfNewAndReturn(
      copyProductions,
      new Production(leftSide, rightSide),
      false,
    );

    setProductions(copyProductions);
    setNonTerminals(copyNonTerminals);
    setTerminals(copyTerminals);

    return true;
  };

  /**
   * Function to clear the grammar.
   * 
   * @remarks
   * 
   * This removes all productions, nonterminals, and terminals from the grammar.
   * 
   * It also resets the special symbols (epsilon, endOfInput, startSymbol) and
   * clears the selection of the start symbol and the lecture example indicator.
   * 
   * Lastly it also sets reduced to false, even though this should be
   * unnecessary (it will be set to false before it becomes relevant anyway).
   */
  const clearGrammar = () => {
    // reset special symbols
    // epsilon
    epsilon.references = 0;
    epsilon.productive = true;
    epsilon.reachable = false;
    epsilon.empty = true;
    epsilon.first = [];
    epsilon.follow = [];
    // end of input
    endOfInput.references = 0;
    endOfInput.productive = true;
    endOfInput.reachable = false;
    endOfInput.empty = false;
    endOfInput.first = [];
    endOfInput.follow = [];
    // start symbol
    startSymbol.references = 0;
    startSymbol.productive = false;
    startSymbol.reachable = true;
    startSymbol.empty = false;
    startSymbol.first = [];
    startSymbol.follow = [];
    // remove start
    for (const n of nonTerminals) {
      n.start = false;
    }
    // and clear all arrays
    setStart([]);
    // This should be unnecessary, as reduced will be set to
    // false when entering a new production, which must be done
    // before proceeding to the next page anyway.
    // But it is here and I don't want to accidentally break something.
    setReduced(false);
    setProductions([]);
    setNonTerminals([]);
    setTerminals([]);
    // grammar changed, so we don't have a lecture example anymore
    setLectureExampleSuccess(undefined);
  };

  const lectureExamplePopupContent = (
    <>
      <DialogContentText id={"scroll-dialog-Lecture-Examples-description"}>
        Choose one of the following grammars to load it into the webtutor:
      </DialogContentText>
      <List>
        {lectureExamples.map(
          ([grammarName, startNonterminal, productions], index) => (
            <ReactFragment key={grammarName + index}>
              {index !== 0 && <Divider sx={{ my: 1 }} />}
              <ListItem>
                <ListItemText
                  primary={grammarName}
                  secondary={productions.join("\n")}
                />
              </ListItem>
              <ListItem>
                <Button
                  aria-label={"load " + grammarName}
                  variant="contained"
                  color={
                    // Here we use !sorted to check if the user navigated to the
                    // next page after loading a lecture example.
                    // It seems to work without it, but I'm not sure why, so I
                    // keep it in for now.
                    !sorted && lectureExampleSuccess === index
                      ? "success"
                      : "info"
                  }
                  className="mt-2"
                  endIcon={
                    // Here we use !sorted to check if the user navigated to the
                    // next page after loading a lecture example.
                    // It seems to work without it, but I'm not sure why, so I
                    // keep it in for now.
                    !sorted && lectureExampleSuccess === index ? (
                      <CheckOutlinedIcon />
                    ) : (
                      <DescriptionOutlinedIcon />
                    )
                  }
                  disabled={loadingLectureExample !== undefined}
                  onClick={() => {
                    // only try and load one grammar at a time
                    if (loadingLectureExample === undefined) {
                      setLectureExampleSuccess(undefined);
                      setLoadingLectureExample(index);

                      // 1. step: clear the grammar:
                      // reset special symbols
                      // epsilon
                      epsilon.references = 0;
                      epsilon.productive = true;
                      epsilon.reachable = false;
                      epsilon.empty = true;
                      epsilon.first = [];
                      epsilon.follow = [];
                      // end of input
                      endOfInput.references = 0;
                      endOfInput.productive = true;
                      endOfInput.reachable = false;
                      endOfInput.empty = false;
                      endOfInput.first = [];
                      endOfInput.follow = [];
                      // start symbol
                      startSymbol.references = 0;
                      startSymbol.productive = false;
                      startSymbol.reachable = true;
                      startSymbol.empty = false;
                      startSymbol.first = [];
                      startSymbol.follow = [];
                      // remove start
                      for (const n of nonTerminals) {
                        n.start = false;
                      }

                      // 2. step: load the grammar
                      const newProductions: Production[] = [];
                      const newNonTerminals: Nonterminal[] = [];
                      const newTerminals: Terminal[] = [];

                      // Add the entrypoint production S' -> startNonterminal.
                      // This means that the user does not have to select the
                      // start symbol in the next step.
                      const nonterminal = new Nonterminal(startNonterminal);
                      nonterminal.start = true;
                      nonterminal.references++;
                      startSymbol.references++;
                      const newProduction = new Production(startSymbol, [
                        nonterminal,
                      ]);
                      newProduction.references++;
                      newProductions.push(newProduction);
                      newNonTerminals.push(startSymbol);
                      newNonTerminals.push(nonterminal);

                      // Add the rest of the productions (all but S'->...)
                      for (const production of productions) {
                        if (import.meta.env.DEV) {
                          console.log("Loading production:", production);
                        }

                        const [left, right] = production
                          .split(/->(.*)/s)
                          .map((x) => x.trim());

                        let leftSide = new Nonterminal(left);
                        const rightSide: Array<Terminal | Nonterminal> = [];

                        leftSide = addIfNewAndReturn(newNonTerminals, leftSide);
                        for (const c of right) {
                          if (c >= "A" && c <= "Z") {
                            let n = new Nonterminal(c);
                            n = addIfNewAndReturn(newNonTerminals, n);
                            rightSide.push(n);
                          } else {
                            let t = new Terminal(c);
                            t = addIfNewAndReturn(newTerminals, t);
                            rightSide.push(t);
                          }
                        }
                        if (right === "") {
                          epsilon.references++;
                          rightSide.push(epsilon);
                        }

                        addIfNewAndReturn(
                          newProductions,
                          new Production(leftSide, rightSide),
                          false,
                        );
                      }

                      const newStart: [name: Nonterminal, start: boolean][] =
                        newNonTerminals.map(
                          (n: Nonterminal): [Nonterminal, boolean] => [
                            n,
                            n.start,
                          ],
                        );

                      setSorted(false);
                      setReduced(false);
                      setStart(newStart);

                      setProductions(newProductions);
                      setNonTerminals(newNonTerminals);
                      setTerminals(newTerminals);

                      setLectureExampleSuccess(index);
                      setLoadingLectureExample(undefined);
                    }
                  }}
                >
                  {loadingLectureExample === index && (
                    <CircularProgress
                      size={24}
                      sx={{
                        color: "success.main",
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        marginTop: "-12px",
                        marginLeft: "-12px",
                      }}
                    />
                  )}
                  {
                    // Here we use !sorted to check if the user navigated to the
                    // next page after loading a lecture example.
                    // It seems to work without it, but I'm not sure why, so I
                    // keep it in for now.
                    !sorted && lectureExampleSuccess === index
                      ? "Loaded"
                      : "Load"
                  }
                </Button>
              </ListItem>
            </ReactFragment>
          ),
        )}
      </List>
    </>
  );

  // TODO: add up-/download grammar button
  return (
    <Box
      className="flex h-full flex-col"
      sx={{
        flexGrow: 1,
      }}
    >
      <p>The Nonterminals of the grammar are:</p>
      <ul className="commaList m-0 list-none p-0 before:mr-1 before:content-['𝑁_=_{'] after:ml-1 after:content-['}']">
        {nonTerminals
          .filter((n) => n.name !== startSymbol.name)
          .map((nonterminal, index) => (
            <li key={index} className="inline">
              {nonterminal.representation}
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
      <div className="flex justify-center">
        <List className="commaList listSpace m-0 p-0 text-left before:mr-1 before:content-['𝑃_=_{'] after:ml-1 after:content-['}']">
          {productions.map((production, index) => (
            <ListItem key={index} className="py-0">
              <IconButton
                aria-label="remove production"
                size="small"
                color="error"
                className="mr-1"
                sx={{
                  "&:hover > svg": {
                    color: "error.main",
                  },
                }}
                onClick={() => {
                  // This is the function that is calles whenever
                  // a production is removed:
                  
                  // remove start attribute if the "start" production is removed
                  if (production.leftSide.name === startSymbol.name) {
                    for (const symbol of production.rightSide) {
                      if (symbol instanceof Nonterminal) {
                        symbol.start = false;
                      }
                    }
                    const newStart = start.map(
                      ([n]: [Nonterminal, boolean]): [Nonterminal, boolean] => [
                        n,
                        false,
                      ],
                    );
                    setStart(newStart);
                  }
                  // decrement the reference counter of all symbols in the production
                  for (const symbol of production.rightSide) {
                    symbol.references--;
                  }
                  production.leftSide.references--;
                  production.references--;

                  // grammar changed, so we don't have a lecture example anymore
                  setLectureExampleSuccess(undefined);
                  // this way we can check if we can proceed by
                  // letting the reduce function error out
                  // since S' is unproductive
                  setReduced(false);
                  // remove all symbols with reference counter 0
                  setNonTerminals(nonTerminals.filter((n) => n.references > 0));
                  setTerminals(terminals.filter((t) => t.references > 0));
                  setProductions(productions.filter((p) => p.references > 0));
                }}
              >
                <RemoveCircleOutlineIcon />
              </IconButton>
              <ListItemText
                className="flex-none"
                primary={production.representation}
              />
            </ListItem>
          ))}
        </List>
      </div>
      <Box>
        <ValidationTextField
          error={error}
          helperText={errorText}
          label="Enter a production of form A -> 𝛼"
          variant="outlined"
          className="mb-1 mt-3"
          id="productionInput"
          value={newProduction}
          onChange={(event) => {
            setNewProduction(event.target.value);
          }}
          onKeyUp={(event) => {
            if (event.key === "Enter") {
              if (validProduction(newProduction)) {
                // clear the text field if we accepted the production
                document.getElementsByTagName("input")[0].value = "";
                setNewProduction("");
                setSorted(false);
                setReduced(false);
                // grammar changed, so we don't have a lecture example anymore
                setLectureExampleSuccess(undefined);
              }
            }
          }}
        />
        <br />
        <Button
          aria-label="remove all productions"
          variant="contained"
          color="error"
          className="mx-1 mt-2"
          endIcon={<HighlightOffIcon />}
          onClick={clearGrammar}
          disabled={productions.length === 0}
        >
          Clear All
        </Button>
        <Button
          aria-label="add new production"
          variant="contained"
          className="mx-1 mt-2"
          endIcon={<AddCircleOutlineIcon />}
          onClick={() => {
            if (validProduction(newProduction)) {
              // clear the text field if we accepted the production
              document.getElementsByTagName("input")[0].value = "";
              setNewProduction("");
              setSorted(false);
              setReduced(false);
              // grammar changed, so we don't have a lecture example anymore
              setLectureExampleSuccess(undefined);
            }
          }}
        >
          Add
        </Button>
        <br />
        <ScrollableDialogComponent
          DisplayButton={(props) => (
            <Button
              aria-label="load a grammar from the lecture examples"
              variant="contained"
              color="info"
              className="mt-2"
              endIcon={<DescriptionOutlinedIcon />}
              {...props}
            >
              Lecture Examples
            </Button>
          )}
          title={"Lecture Examples"}
          content={lectureExamplePopupContent}
        />
      </Box>
    </Box>
  );
}

export default ReadGrammarPage;
