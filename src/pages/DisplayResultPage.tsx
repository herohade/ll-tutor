import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

import { useMemo } from "react";

import { shallow } from "zustand/shallow";
import useBoundStore from "../store/store";

import {
  FirstNodeSlice,
  FollowNodeSlice,
  GrammarSlice,
  NavigationSlice,
  Production,
  Terminal,
} from "../types";

/*
This is the tenth page of the webtutor.
It displays the resulting lookahead table for the grammar.
*/
function DisplayResultPage() {
  const selector = (
    state: NavigationSlice & GrammarSlice & FirstNodeSlice & FollowNodeSlice,
  ) => ({
    // NavigationSlice
    setPage: state.setPage,
    // GrammarSlice
    epsilon: state.epsilon,
    endOfInput: state.endOfInput,
    productions: state.productions,
    nonTerminals: state.nonTerminals,
    terminals: state.terminals,
    // FirstNodeSlice
    setFirstNodeEdgesHidden: state.setFirstNodeEdgesHidden,
    // FollowNodeSlice
    setFollowNodeEdgesHidden: state.setFollowNodeEdgesHidden,
  });
  const {
    // NavigationSlice
    setPage,
    // GrammarSlice
    epsilon,
    endOfInput,
    productions,
    nonTerminals,
    terminals,
    // FirstNodeSlice
    setFirstNodeEdgesHidden,
    // FollowNodeSlice
    setFollowNodeEdgesHidden,
  } = useBoundStore(selector, shallow);

  const followSymbols: Terminal[] = useMemo(() => {
    return [...terminals, endOfInput];
  }, [endOfInput, terminals]);

  // LookaheadTable is a mapping from nonterminal name to
  // a mapping from followSymbol name to productions
  // (can be multiple productions because of conflicts)
  // Nonterminal + FollowSymbol = Productions.
  //
  // ComputationMap is a mapping from numbered production name
  // to its first, follow and first ⊙_1 follow set.
  // Both store the same information, but in different formats.
  // The first is used to display the table, the second is used
  // to display the computations.
  const [lookaheadTable, computationMap]: [
    Map<string, Map<string, Production[]>>,
    Map<string, [Terminal[], Terminal[], Terminal[]]>,
  ] = useMemo(() => {
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
    const newComputationMap = new Map<
      string,
      [Terminal[], Terminal[], Terminal[]]
    >();

    // For all productions, compute firstSet(right) ⊙_1 followSet(left).
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

      const firstAndFollow = [...first];

      // If first(right side) contains epsilon, we add follow(left side)
      if (emptyFirst) {
        for (const followSymbol of production.leftSide.follow) {
          if (!firstAndFollow.some((t) => t.name === followSymbol.name)) {
            firstAndFollow.push(followSymbol);
          }
        }
      }

      if (import.meta.env.DEV) {
        console.log("first", first);
        console.log("firstAndFollow", production, firstAndFollow);
      }

      // Now we add the computation to the computation map.
      newComputationMap.set(production.numberedRepresentation(), [
        emptyFirst ? [epsilon, ...first] : [...first],
        [...production.leftSide.follow],
        [...firstAndFollow],
      ]);

      // Now we add the lookahead (followSymbol, production) to
      // the left side's entry in the lookahead table.
      for (const followSymbol of firstAndFollow) {
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
      console.log("newComputationMap", newComputationMap);
    }

    return [newlookaheadTable, newComputationMap];
  }, [epsilon, followSymbols, nonTerminals, productions]);

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

          <div className="flex flex-col items-center pb-1">
            <Button
              variant="contained"
              color="success"
              onClick={() => {
                // These are the functions invoked when navigation to the
                // previous pages one by one from this page to the first page.
                // (from HeaderComponent)
                setFollowNodeEdgesHidden(false);
                setFirstNodeEdgesHidden(false);
                // Instead of navigating one by one, we just jump to page 1.
                setPage(1);
              }}
            >
              Try another grammar
            </Button>
          </div>
        </div>
      </div>
      {/* right side, reactflow canvas */}
      <div className="h-full w-1/2 overflow-auto rounded-lg border-2 border-solid sm:w-2/3">
        {/* First we show the computations for the lookahead table */}
        <Typography
          variant="h6"
          component="div"
          sx={{
            // This should not move when scrolling left or right
            position: "sticky",
            left: 0,
            py: 1,
          }}
        >
          Compu&shy;tation of the LL(1)-Look&shy;ahead
        </Typography>
        <Table stickyHeader aria-label="computations">
          <TableBody>
            {productions.map((production) => {
              const [leftSide, rightSide] = production.name
                .split("=>")
                .map((s) => s.trim());
              const [firstSet, followSet, lookaheadSet] = computationMap.get(
                production.numberedRepresentation(),
              ) ?? [[], [], []];
              return (
                <TableRow
                  hover
                  role="checkbox"
                  tabIndex={-1}
                  key={production.name}
                  sx={{
                    ".tableSetOperator": {
                      color: "secondary.main",
                    },
                    ".tableSetElements": {
                      color: "primary.main",
                      fontWeight: "bold",
                    },
                    whiteSpace: "nowrap",
                  }}
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
                    {leftSide}-rule&nbsp;{production.number}
                  </TableCell>

                  <TableCell align={"center"}>
                    <span className="tableSetOperator">
                      First<sub>1</sub>(
                    </span>

                    <span className="tableSetElements">{rightSide}</span>

                    <span className="tableSetOperator">
                      ) ⊙<sub>1</sub> Follow
                      <sub>1</sub>(
                    </span>

                    <span className="tableSetElements">{leftSide}</span>

                    <span className="tableSetOperator">)</span>
                  </TableCell>

                  <TableCell align={"center"}>
                    <span className="tableSetOperator">=</span>
                  </TableCell>

                  <TableCell
                    align={"center"}
                    sx={{
                      minWidth: "4rem",
                    }}
                  >
                    <span className="tableSetOperator">{"{ "}</span>

                    <span className="tableSetElements">
                      {firstSet.map((t) => t.name).join(", ")}
                    </span>

                    <span className="tableSetOperator">
                      {" }"} ⊙<sub>1</sub> {"{ "}
                    </span>

                    <span className="tableSetElements">
                      {followSet.map((t) => t.name).join(", ")}
                    </span>

                    <span className="tableSetOperator">{" }"}</span>
                  </TableCell>

                  <TableCell align={"center"}>
                    <span className="tableSetOperator">=</span>
                  </TableCell>

                  <TableCell
                    align={"center"}
                    sx={{
                      minWidth: "4rem",
                    }}
                  >
                    <span className="tableSetOperator">{"{ "}</span>
                    <span className="tableSetElements">
                      {lookaheadSet.map((t) => t.name).join(", ")}
                    </span>
                    <span className="tableSetOperator">{" }"}</span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <br />
        {/* And here the lookahead table */}
        <Typography
          variant="h6"
          component="div"
          sx={{
            // This should not move when scrolling left or right
            position: "sticky",
            left: 0,
            pb: 1,
          }}
        >
          LL(1)-Look&shy;ahead Table
        </Typography>
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
              />
              {followSymbols.map((followSymbol) => (
                <TableCell key={followSymbol.name} align={"center"}>
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
