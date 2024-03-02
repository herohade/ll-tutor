import { useSnackbar, VariantType } from "notistack";

import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import ListItem from "@mui/material/ListItem";

import { shallow } from "zustand/shallow";
import useBoundStore from "../store/store";

import {
  Production,
  Nonterminal,
  GrammarSetupSlice,
  GrammarSlice,
} from "../types";

/**
 * This is the third page of the webtutor.
 * It lets the user select the start symbol from the nonterminals.
*/
function SelectStartSymbolPage() {
  const selector = (state: GrammarSlice & GrammarSetupSlice) => ({
    // GrammarSlice
    startSymbol: state.startSymbol,
    productions: state.productions,
    nonTerminals: state.nonTerminals,
    terminals: state.terminals,
    setProductions: state.setProductions,
    setNonTerminals: state.setNonTerminals,
    // GrammarSetupSlice
    start: state.start,
    setStart: state.setStart,
    setReduced: state.setReduced,
  });
  const {
    // GrammarSlice
    startSymbol,
    productions,
    setProductions,
    nonTerminals,
    setNonTerminals,
    terminals,
    // GrammarSetupSlice
    start,
    setStart,
    setReduced,
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
   * A function that takes a nonterminal and returns a function
   * to handle the selection of it as the start symbol.
   * 
   * @remarks
   * 
   * If a nonterminal is selected as the start symbol and is clicked again,
   * it will be deselected. This means it will no longer be highlighted
   * and the production S' -\> startSymbol will be removed.
   * 
   * If no nonterminal is selected as the start symbol and one is clicked,
   * it will be highlighted and the production S' -\> startSymbol will be added.
   * 
   * If a different nonterminal is selected as the start symbol, then
   * the one being clicked, it will be deselected and the new one will be
   * selected.
   * 
   * @param nonterminal - The nonterminal that would be clicked.
   * @returns A function to handle the click event of the nonterminal.
   */
  const clickStartSymbol = (nonterminal: Nonterminal) => () => {
    let newProductions = [...productions];
    let newNonTerminals = [...nonTerminals];
    // If we press the start symbol again, we want to remove it
    // This means we do not add a new start symbol after removing
    // the current one.
    const alreadyStart = nonterminal.start;

    // If there there already is a start symbol, we want to
    // remove it (as a start symbol).
    if (startSymbol.references > 0) {
      newNonTerminals = newNonTerminals.filter(
        (n) => n.name !== startSymbol.name,
      );
      const oldStartSymbolProduction = newProductions.find(
        (p) => p.leftSide.name === startSymbol.name,
      );
      if (oldStartSymbolProduction === undefined) {
        // this should never happen as the reference count was positive
        if (import.meta.env.DEV) {
          console.error("Error Code 191b7f: Please contact the developer.");
        }
        showSnackbar(
          "Error Code 191b7f: Please contact the developer.",
          "error",
          true,
        );
      } else {
        oldStartSymbolProduction.references--;
        for (const r of oldStartSymbolProduction.rightSide) {
          // this should never result on a non-positive reference count so we do not need to remove any (non)terminals afterwards
          r.references--;
          if (r instanceof Nonterminal) {
            r.start = false;
          }
        }
      }
      startSymbol.references--;
    }

    // If we are not removing the start symbol, we are adding
    // a new one.
    if (!alreadyStart) {
      nonterminal.start = true;
      nonterminal.references++;
      startSymbol.references++;
      const newProduction = new Production(startSymbol, [nonterminal]);
      newProduction.references++;
      newProductions = [newProduction, ...newProductions];
      newNonTerminals = [startSymbol, ...newNonTerminals];
    }

    newProductions = newProductions.filter(
      (production) => production.references > 0,
    );
    newNonTerminals = newNonTerminals.filter(
      (nonterminal) => nonterminal.references > 0,
    );
    const newStart: [name: Nonterminal, start: boolean][] = newNonTerminals.map(
      (n: Nonterminal): [Nonterminal, boolean] => [n, n.start],
    );

    setReduced(false);
    setProductions(newProductions);
    setNonTerminals(newNonTerminals);
    setStart(newStart);
  };

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
              <IconButton
                color={
                  start.find(([n]) => n.name === nonterminal.name)?.[1]
                    ? "success"
                    : "default"
                }
                sx={{
                  "&:hover > div": {
                    bgcolor: "success.main",
                    color: "success.contrastText",
                    borderColor: "success.main",
                    opacity: start.find(([n]) => n.name === nonterminal.name)?.[1] ? 0.9 : 0.5,
                  },
                }}
                className="rounded p-1"
                onClick={clickStartSymbol(nonterminal)}
                aria-label={"toggle " + nonterminal.name + " as start symbol"}
              >
                <Avatar
                  sx={{
                    bgcolor: nonterminal.start ? "success.main" : "transparent",
                    color: nonterminal.start
                      ? "success.contrastText"
                      : "text.primary",
                    border: 1,
                    borderColor: nonterminal.start
                      ? "success.main"
                      : "text.primary",
                    width: "1.5rem",
                    height: "1.5rem",
                  }}
                  // "rounded" for rounded corners, "" for full circle
                  variant="rounded"
                >
                  {nonterminal.representation}
                </Avatar>
              </IconButton>
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
        <ul className="commaList listSpace m-0 list-none p-0 text-left before:mr-1 before:content-['𝑃_=_{'] after:ml-1 after:content-['}']">
          {productions.map((production, index) => (
            <ListItem
              key={index}
              sx={{
                color: production.leftSide.name === startSymbol.name &&
                start.some(([, s]) => s) ? "success.light" : "text.primary",
              }}
              className="ml-4 p-0"
            >
              {production.representation}
            </ListItem>
          ))}
        </ul>
      </div>
    </Box>
  );
}

export default SelectStartSymbolPage;
