import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import { useMemo } from "react";

import { shallow } from "zustand/shallow";
import useBoundStore from "../store/store";

import { GrammarSlice, Production, Terminal } from "../types";

/*
This is the tenth page of the webtutor.
It displays the resulting lookahead table for the grammar.
*/
function DisplayResultPage() {
  const selector = (state: GrammarSlice) => ({
    // GrammarSlice
    endOfInput: state.endOfInput,
    productions: state.productions,
    nonTerminals: state.nonTerminals,
    terminals: state.terminals,
  });
  const {
    // GrammarSlice
    endOfInput,
    productions,
    nonTerminals,
    terminals,
  } = useBoundStore(selector, shallow);

  const followSymbols: Terminal[] = useMemo(() => {
    return [...terminals, endOfInput];
  }, [endOfInput, terminals]);

  // A mapping from nonterminal name to
  // a mapping from followSymbol name to productions
  // (can be multiple productions because of conflicts)
  const lookaheadTable: Map<string, Map<string, Production[]>> = useMemo(() => {
    // Initialize the lookahead table with empty arrays for all
    // nonterminals and followSymbols.
    const newlookaheadTable = new Map<string, Map<string, Production[]>>(
      nonTerminals.map((nonTerminal) => [
        nonTerminal.name,
        new Map<string, Production[]>(
          followSymbols.map((followSymbol) => [followSymbol.name, []]),
        ),
      ]),
    );
    // For all productions, calculate firstSet(right) ⊙_1 followSet(left).
    for (const production of productions) {
      let emptyFirst = true;
      const first: Terminal[] = [];
      // First add first(right side)
      for (const symbol of production.rightSide) {
        const firstSet = symbol.first;
        for (const firstSymbol of firstSet) {
          // get f_e by removing epsilon from the first set
          if (firstSymbol.empty) {
            continue;
          }
          if (!first.some((t) => t.name === firstSymbol.name)) {
            first.push(firstSymbol);
          }
        }
        if (!symbol.empty) {
          emptyFirst = false;
          break;
        }
      }
      // If first(right side) contains epsilon, we add follow(left side)
      if (emptyFirst) {
        for (const followSymbol of production.leftSide.follow) {
          if (!first.some((t) => t.name === followSymbol.name)) {
            first.push(followSymbol);
          }
        }
      }

      if (import.meta.env.DEV) {
        console.log("first", production, first);
      }

      // Now we add the lookahead (followSymbol, production) to
      // the left side's entry in the lookahead table.
      for (const followSymbol of first) {
        const innerMap = newlookaheadTable.get(production.leftSide.name);
        if (innerMap) {
          const productionList = innerMap.get(followSymbol.name);
          if (productionList) {
            productionList.push(production);
          } else {
            if (import.meta.env.DEV) {
              console.log(
                "ProductionList for",
                production.leftSide.name,
                "and",
                followSymbol.name,
                "is undefined",
                newlookaheadTable,
              );
            }
          }
        } else {
          if (import.meta.env.DEV) {
            console.log(
              "InnerMap for",
              production.leftSide.name,
              "is undefined",
              newlookaheadTable,
            );
          }
        }
      }
    }

    if (import.meta.env.DEV) {
      console.log("newlookaheadTable", newlookaheadTable);
    }

    return newlookaheadTable;
  }, [followSymbols, nonTerminals, productions]);

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
            <ul className="commaList listSpace m-0 mb-2 list-none p-0 text-left before:mr-1 before:content-['𝑃_=_{'] after:ml-1 after:content-['}']">
              {productions.map((production, index) => (
                <li key={index} className="ml-4">
                  {production.numberedRepresentation()}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      {/* right side, reactflow canvas */}
      <div className="h-full w-1/2 overflow-auto rounded-lg border-2 border-solid sm:w-2/3">
        {/* TODO: make it a collapsible table, collapse the calculation */}
        <Table stickyHeader aria-label="lookahead table">
          <TableHead>
            <TableRow>
              <TableCell
                align={"center"}
                sx={{
                  // make the first column (shows the nonterminal) sticky
                  // if the screen is large enough
                  position: { xs: "", sm: "sticky" },
                  left: { xs: "", sm: 0 },
                  zIndex: { xs: "", sm: "3" },
                  backgroundColor: { xs: "", sm: "background.paper" },
                  borderRight: (theme) =>
                    theme.palette.mode === "dark"
                      ? "1px solid #393939"
                      : "1px solid #ebebeb",
                }}
                // TODO: Do I want to display the below or not?
                // If so I probably need to change xs: ... sm: ...
                // to xs: ... md: ... above and below
                // className="sm:p-0"
              >
                {/* TODO: Do I want to display the below or not? If so I probably need to change xs: ... sm: ... to xs: ... md: ... above and below */}
                {/* Copied and modified from https://www.peterkrautzberger.org/0213/ */}
                {/* <div
                  style={{
                    display: "grid",
                    width: "100%",
                    justifyContent: "space-between",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gridAutoRows: "1fr",
                    background: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' preserveAspectRatio='none' viewBox='0 0 100 100'><line x1='0' y1='0' x2='100' y2='100' stroke='grey' vector-effect='non-scaling-stroke'/></svg>")`,
                    backgroundSize: "100% 100%",
                  }}
                >
                  <div
                    style={{
                      gridColumnStart: 2,
                    }}
                  >
                    Lookahead
                  </div>
                  <div
                    style={{
                      gridColumnStart: 1,
                    }}
                  >
                    Nonterminal
                  </div>
                </div> */}
              </TableCell>
              {followSymbols.map((followSymbol) => (
                <TableCell
                  key={followSymbol.name}
                  align={"center"}
                >
                  {followSymbol.name}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {nonTerminals.map((nonTerminal) => {
              const productionList = lookaheadTable.get(nonTerminal.name);
              if (!productionList) {
                if (import.meta.env.DEV) {
                  console.log(
                    "ProductionList for",
                    nonTerminal.name,
                    "is undefined",
                    lookaheadTable,
                  );
                }
                return (
                  <TableCell align={"center"}>{nonTerminal.name}</TableCell>
                );
              }

              return (
                <TableRow
                  hover
                  role="checkbox"
                  tabIndex={-1}
                  key={nonTerminal.name}
                >
                  <TableCell
                    align={"center"}
                    sx={{
                      // make the first column (shows the nonterminal) sticky
                      // if the screen is large enough
                      position: { xs: "", sm: "sticky" },
                      left: { xs: "", sm: 0 },
                      backgroundColor: { xs: "", sm: "background.paper" },
                      borderRight: (theme) =>
                        theme.palette.mode === "dark"
                          ? "1px solid #393939"
                          : "1px solid #ebebeb",
                    }}
                  >
                    {nonTerminal.name}
                  </TableCell>
                  {followSymbols.map((followSymbol) => {
                    const productions = productionList.get(followSymbol.name);
                    if (!productions) {
                      if (import.meta.env.DEV) {
                        console.log(
                          "Productions for",
                          nonTerminal.name,
                          "and",
                          followSymbol.name,
                          "is undefined",
                          lookaheadTable,
                        );
                      }
                      return (
                        <TableCell
                          key={`${nonTerminal.name}-${followSymbol.name}`}
                          align={"center"}
                        >
                          -
                        </TableCell>
                      );
                    }

                    return (
                      <TableCell
                        key={`${nonTerminal.name}-${followSymbol.name}`}
                        align={"center"}
                      >
                        {productions.map((production, index) => (
                          <>
                            ({production.leftSide.name},&nbsp;
                            {production.number})
                            {index < productions.length - 1 ? ", " : ""}
                          </>
                        ))}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

export default DisplayResultPage;
