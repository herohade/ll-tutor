import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import ListItemText from "@mui/material/ListItemText";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import TextField from "@mui/material/TextField";

import { useState } from "react";

import { VariantType, useSnackbar } from "notistack";

import useBoundStore from "../store/store";
import { shallow } from "zustand/shallow";

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

// This function adds Printables (Terminals, Nonterminals and Productions) to
// a given array.
// It does this only if it is not already contained, so we don't have duplicates
// It also increments the reference counter of the element
const addIfNewAndReturn = function <T extends printable>(
  array: T[],
  element: T,
  allowDuplicates: boolean = true,
): T {
  const e = array.find((e) => e.name === element.name);
  if (e) {
    if (allowDuplicates) {
      e.references++;
    } else {
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

/*
This is the second page of the webtutor.
It reads the grammars productions from the user and displays them.
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
    setStart,
    setSorted,
    setReduced,
  } = useBoundStore(selector, shallow);

  const [newProduction, setNewProduction] = useState("");

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

  // check if the production is valid, else tell the user
  const validProduction = (production: string): boolean => {
    if (production === "") {
      showSnackbar("Please enter a production!", "error", true);
      return false;
    }
    if (!production.includes("->")) {
      showSnackbar("Please enter a production of form A->...", "error", true);
      return false;
    }

    const [left, right] = production.split(/->(.*)/s).map((x) => x.trim());
    if (left.length !== 1) {
      showSnackbar(
        "The left side of the production must be a single nonterminal!",
        "error",
        true,
      );
      return false;
    }
    if (left < "A" || left > "Z") {
      showSnackbar(
        "The left side of the production must be a nonterminal!",
        "error",
        true,
      );
      return false;
    }

    for (const c of right) {
      if (!allowedSymbols.includes(c)) {
        showSnackbar(
          "The right side of the production must only contain allowed symbols!" +
            ` ("${c}")`,
          "error",
          true,
        );
        return false;
      }
    }

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

  // TODO: add up-/download grammar button
  // TODO: add example grammars
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
                  // remove start if necessary
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
          label="Enter a production of form A -> 𝛼"
          variant="outlined"
          className="my-3"
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
              }
            }
          }}
        />
        <br />
        <Button
          aria-label="remove all productions"
          variant="contained"
          color="error"
          className="mr-2"
          endIcon={<HighlightOffIcon />}
          onClick={() => {
            // reset special symbold
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
            // this way we can check if we can proceed by
            // letting the reduce function error out
            // since S' is unproductive
            setReduced(false);
            setProductions([]);
            setNonTerminals([]);
            setTerminals([]);
          }}
          disabled={productions.length === 0}
        >
          Clear All
        </Button>
        <Button
          aria-label="add new production"
          variant="contained"
          endIcon={<AddCircleOutlineIcon />}
          onClick={() => {
            if (validProduction(newProduction)) {
              // clear the text field if we accepted the production
              document.getElementsByTagName("input")[0].value = "";
              setNewProduction("");
              setSorted(false);
              setReduced(false);
            }
          }}
        >
          Add
        </Button>
      </Box>
    </Box>
  );
}

export default ReadGrammarPage;
