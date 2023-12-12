import { useSnackbar, VariantType } from "notistack";

import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";

import { shallow } from "zustand/shallow";
import useBoundStore from "../store/store";

import {
  Production,
  Nonterminal,
  GrammarSetupSlice,
  GrammarSlice,
} from "../types";

/*
This is the third page of the webtutor.
It lets the user select the start symbol from the nonterminals.
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

  const clickStartSymbol = (nonterminal: Nonterminal) => () => {
    let newProductions = [...productions];
    let newNonTerminals = [...nonTerminals];
    // if we press the start symbol again, we want to remove it
    const alreadyStart = nonterminal.start;

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

    // we only meant to remove so we skip the adding back
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
                // variant="contained"
                color={
                  start.find(([n]) => n.name === nonterminal.name)?.[1]
                    ? "success"
                    : "primary"
                }
                className="px-1 py-2"
                onClick={clickStartSymbol(nonterminal)}
                aria-label={"toggle " + nonterminal.name + " as start symbol"}
              >
                <Avatar
                  sx={{
                    bgcolor: nonterminal.start
                      ? "success.main"
                      : "primary.main",
                    color: nonterminal.start
                      ? "success.contrastText"
                      : "primary.contrastText",
                    fontWeight: "bold",
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
            <li
              key={index}
              className={
                production.leftSide.name === startSymbol.name &&
                start.some(([, s]) => s)
                  ? "startSymbolProductionGreen ml-4"
                  : "ml-4"
              }
            >
              {production.representation}
            </li>
          ))}
        </ul>
      </div>
    </Box>
  );
}

export default SelectStartSymbolPage;
