import { styled } from "@mui/material";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";

import { VariantType, useSnackbar } from "notistack";

import { shallow } from "zustand/shallow";
import useBoundStore from "../store/store";

import {
  EmptyAlgorithmSlice,
  FirstAlgorithmNodeMap,
  FirstAlgorithmSlice,
  FirstNodeSlice,
  GrammarSlice,
  Nonterminal,
  Terminal,
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
 * This is the seventh page of the webtutor.
 * It lets the user propagate the first sets through the graph.
 * 
 * @param graphCanvas - The reactflow canvas to display the grammar.
 */
function FirstAlgorithmPage({ graphCanvas }: Props) {
  const selector = (
    state: GrammarSlice &
      EmptyAlgorithmSlice &
      FirstNodeSlice &
      FirstAlgorithmSlice,
  ) => ({
    // GrammarSlice
    epsilon: state.epsilon,
    productions: state.productions,
    nonTerminals: state.nonTerminals,
    terminals: state.terminals,
    setNonTerminals: state.setNonTerminals,
    setTerminals: state.setTerminals,
    // EmptyAlgorithmSlice
    emptyNonterminalMap: state.emptyNonterminalMap,
    // FirstNodeSlice
    firstNodes: state.firstNodes,
    firstEdges: state.firstEdges,
    // FirstAlgorithmSlice
    finishedFirst: state.finishedFirst,
    firstNodeMap: state.firstNodeMap,
    setFinishedFirst: state.setFinishedFirst,
    setFirstNodeMap: state.setFirstNodeMap,
  });
  const {
    // GrammarSlice
    epsilon,
    productions,
    nonTerminals,
    terminals,
    setNonTerminals,
    setTerminals,
    // EmptyAlgorithmSlice
    emptyNonterminalMap,
    // FirstNodeSlice
    firstNodes,
    firstEdges,
    // FirstAlgorithmSlice
    finishedFirst,
    firstNodeMap,
    setFinishedFirst,
    setFirstNodeMap,
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
   * Function to reset the graph to its initial state.
   * 
   * @remarks
   * 
   * This function maps each SCC (groupnode) to a new
   * {@link FirstAlgorithmNodeMap}. This effectively resets the graph.
   * 
   * @privateRemarks
   * 
   * This is copied from prepareFirstMap() in {@link HeaderComponent}.
   */
  const resetGraph = () => {
    // This maps each SCC (groupnode) to a FirstAlgorithmNodeMap
    // The FirstAlgorithmNodeMap contains the following information:
    // active: boolean, whether the button (SCC) is active (already processed)
    // incomingFirst: Map<string, string[] | undefined>, maps each incoming
    // SCC (groupnode) to the first set of the incoming SCC or undefined
    // if it was not yet processed
    // first: Set<string>, the first set of the current SCC (groupnode)
    // as far as it was already processed
    const newFirstNodeMap = new Map<string, FirstAlgorithmNodeMap>();
    for (const node of firstNodes) {
      // We only consider SCCs (groupnodes) here
      if (node.type === "group") {
        const name: string = node.id;
        // Get all incoming SCCs (groupnodes)
        // Those are relevant since this SCC gets its first set from them
        const incomingNodeNames: string[] = firstEdges
          .filter((e) => e.target === node.id && e.source !== node.id)
          .map((e) => {
            if (e.sourceNode) {
              return e.sourceNode.id;
            } else {
              if (import.meta.env.DEV) {
                console.error(
                  "Error Code 7c164d: Source node not found for edge!",
                  e,
                );
              }
              showSnackbar(
                "Error Code 7c164d: Please contact the developer!",
                "error",
                true,
              );
              return "";
            }
          });
        const newIncomingFirst = new Map<string, string[] | undefined>();
        for (const nodeName of incomingNodeNames) {
          newIncomingFirst.set(nodeName, undefined);
        }
        // Here we initialize the first set of the SCC
        // It will be dynamically updated while processing the SCC
        // unless this is one of the leaves of the graph ("{terminalname}").
        // If so, we need to add terminalname to the array and it will be 
        // complete.
        // In theory {terminalnale} should only ever appear in the name for the
        // leaves. Also it should only ever be one terminal in those SCCs.
        // Considering this, firstArray should contain at most one element.
        // That being either terminalname if this is the SCC of {terminalname}
        // or nothing if this is not the SCC of {terminalname}.
        // So this regex should do the trick.
        // ( Including edge cases like terminalname="}" -> "{}}" )
        const firstArray = node.data.name.match(/{(.+)}/)?.[1] ?? [];
        const nodeMap: FirstAlgorithmNodeMap = {
          active: false,
          incomingFirst: newIncomingFirst,
          first: new Set<string>(firstArray),
        };
        newFirstNodeMap.set(name, nodeMap);
      }
    }
    if (import.meta.env.DEV) {
      console.log("newFirstNodeMap", newFirstNodeMap);
    }
    setFirstNodeMap(newFirstNodeMap);
  };

  /**
   * Function to solve the graph.
   * 
   * @remarks
   * 
   * This function starts with the leafs of the graph and
   * propagates the first sets through the graph.
   */
  const solveGraph = () => {
    // We start with the leafs, from there we propagate the first sets
    // through the graph. Leafs are group nodes with no incoming edges.
    const leafIds = firstNodes
      .filter((n) => n.type === "group")
      .filter(
        (n) =>
          firstEdges.find((e) => {
            return e.target === n.id && e.source !== n.id;
          }) === undefined,
      )
      .map((n) => n.id);

    const newFirstNodeMap = new Map(firstNodeMap);
    for (const leafId of leafIds) {
      const leafNodeMap = newFirstNodeMap.get(leafId);
      if (leafNodeMap === undefined) {
        if (import.meta.env.DEV) {
          console.error(
            "Error Code 61a6ac: Leaf node not found in firstNodeMap!",
            leafId,
          );
        }
        showSnackbar(
          "Error Code 61a6ac: Please contact the developer!",
          "error",
          true,
        );
        return;
      }

      // We add the leafs to the worklist
      const workList: string[] = [leafId];
      // For each SCC in the worklist, we check if all incoming SCCs
      // have been processed. If so, we process the current SCC.
      while (workList.length > 0) {
        const currentNodeId = workList.pop();
        if (currentNodeId === undefined) {
          if (import.meta.env.DEV) {
            console.error(
              "Error Code 004a3e: currentNodeId is undefined!",
              currentNodeId,
            );
          }
          showSnackbar(
            "Error Code 004a3e: Please contact the developer!",
            "error",
            true,
          );
          return;
        }
        const currentNodeMap = newFirstNodeMap.get(currentNodeId);
        if (currentNodeMap === undefined) {
          if (import.meta.env.DEV) {
            console.error(
              "Error Code 658cd6: currentNodeMap is undefined!",
              currentNodeMap,
            );
          }
          showSnackbar(
            "Error Code 658cd6: Please contact the developer!",
            "error",
            true,
          );
          return;
        }
        if (import.meta.env.DEV) {
          console.log(
            "processing leafId",
            leafId,
            "currentNodeId",
            currentNodeId,
            "worklist",
            workList,
          );
          console.log("firstNodeMap", newFirstNodeMap);
        }

        // If all incoming SCCs (groupnodes) have been processed,
        // we can process the current SCC.
        // If not, we skip it. It will be added to the worklist again
        // once all incoming SCCs have been processed.
        let newActive = true;
        for (const firstSet of currentNodeMap.incomingFirst.values()) {
          if (firstSet === undefined) {
            newActive = false;
            break;
          }
        }
        if (newActive) {
          // Compute the first set of the current SCC from the
          // first sets of the incoming SCCs
          const newCurrentNodeMap = {
            ...currentNodeMap,
            first:
              // If this is one of the leaves of the graph, keep the first set
              // since those already have their first sets.
              // (and no incoming SCCs which would have erased the first set)
              currentNodeId !== leafId
                ? new Set(
                    [
                      ...currentNodeMap.incomingFirst.values(),
                    ].flat() as string[],
                  )
                : currentNodeMap.first,
            active: true,
          };
          newFirstNodeMap.set(currentNodeId, newCurrentNodeMap);

          // update this one's first set in the outgoing SCCs
          const outgoingNodeIds = firstEdges
            .filter((e) => e.data?.isGroupEdge)
            .filter(
              (e) => e.source === currentNodeId && e.target !== currentNodeId,
            )
            .map((e) => e.target);
          for (const outgoingNodeId of outgoingNodeIds) {
            // add the outgoing SCCs to the worklist
            workList.push(outgoingNodeId);

            const outgoingNodeMap = newFirstNodeMap.get(outgoingNodeId);
            if (outgoingNodeMap === undefined) {
              if (import.meta.env.DEV) {
                console.error(
                  "Error Code c7ec4d: outgoingNodeMap is undefined!",
                  outgoingNodeMap,
                );
              }
              showSnackbar(
                "Error Code c7ec4d: Please contact the developer!",
                "error",
                true,
              );
              return;
            }
            // update this one's first set in the outgoing SCCs
            const newIncomingFirst = new Map(outgoingNodeMap.incomingFirst);
            newIncomingFirst.set(currentNodeId, [
              ...newCurrentNodeMap.first.values(),
            ]);
            newFirstNodeMap.set(outgoingNodeId, {
              ...outgoingNodeMap,
              incomingFirst: newIncomingFirst,
            });
          }
          if (import.meta.env.DEV) {
            console.log(
              "updated outgoing SCCs",
              outgoingNodeIds,
              "worklist",
              workList,
            );
            console.log("newFirstNodeMap", newFirstNodeMap);
          }
        }
      }
    }
    setFirstNodeMap(newFirstNodeMap);
  };

  /**
   * Function to check the graph.
   * 
   * @remarks
   * 
   * This function checks if all buttons have been clicked.
   * If so, it copies the first sets into the grammar.
   * 
   * @returns True if the graph is correct, false otherwise.
   */
  const checkGraph = () => {
    // TODO: maybe give more feedback if the graph is not finished?
    // For now the colors in the graph should be enough.
    for (const firstAlgorithmNodeMap of firstNodeMap.values()) {
      // TODO: remove one of these options:
      // OPTION-1: either require all buttons to be clicked:
      if (!firstAlgorithmNodeMap.active) {
        showSnackbar("There are still buttons to be clicked!", "error", true);
        return false;
      }
      // OPTION-2: or just require the first sets to be computed
      // (does not require the last buttons (roots?) since these
      // SCCs do not need to propagate their first sets)
      // for (const firstArray of firstAlgorithmNodeMap.incomingFirst.values()) {
      //   if (firstArray === undefined) {
      //     showSnackbar("There are still buttons to be clicked!", "error", true);
      //     return false;
      //   }
      // }
    }

    // update the first sets in the grammar
    const newNonTerminals = [...nonTerminals];
    const newTerminals = [...terminals];
    for (const groupNode of firstNodes.filter((n) => n.type === "group")) {
      // get the first set, all children, and the (non)terminals that they
      // represent
      const childNodeNames = firstNodes
        .filter((n) => n.type === "first" && n.parentNode === groupNode.id)
        .map((n) => n.data.name);
      // here we map the Set<string> to Array<Terminal>
      const firstSetStrings = firstNodeMap.get(groupNode.id)?.first;
      const firstSet = firstSetStrings
        ? [...firstSetStrings].map((t) =>
            newTerminals.find((n) => n.name === t),
          )
        : undefined;
      // this should never happen
      if (firstSet === undefined || firstSet.some((t) => t === undefined)) {
        if (import.meta.env.DEV) {
          console.error("Error Code 13de33: firstSet is undefined!", firstSet);
        }
        showSnackbar(
          "Error Code 13de33: Please contact the developer!",
          "error",
          true,
        );
        return false;
      } else {
        for (const symbolName of childNodeNames) {
          // the leafs {terminalname} do not exist in the grammar
          // so we skip them
          if (symbolName.match(/{(.+)}/) !== null) {
            if (import.meta.env.DEV) {
              console.log(
                "skipping leaf",
                symbolName,
                "with firstSet",
                firstSet,
              );
            }
            continue;
          }
          const symbol =
            newNonTerminals.find((n) => n.name === symbolName) ??
            newTerminals.find((n) => n.name === symbolName);
          if (symbol === undefined) {
            if (import.meta.env.DEV) {
              console.error(
                "Error Code d872df: symbol is undefined!",
                symbol,
                symbolName,
              );
            }
            showSnackbar(
              "Error Code d872df: Please contact the developer!",
              "error",
              true,
            );
            return false;
          }
          // we checked for undefined above, so we can do this safely
          symbol.first = symbol.empty
            ? ([...firstSet, epsilon] as Array<Terminal>)
            : (firstSet as Array<Terminal>);
        }
      }
    }
    if (import.meta.env.DEV) {
      console.log("newNonTerminals", newNonTerminals);
      console.log("newTerminals", newTerminals);
    }
    setTerminals(newTerminals);
    setNonTerminals(newNonTerminals);
    return true;
  };

  return (
    <>
      {/* left side, grammar description and information */}
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
                  <span>
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
                                : ""
                              : v.name === epsilon.name
                                ? "empty.text"
                                : "",
                        }}
                      >
                        {v.representation + " "}
                      </StyledSpan>
                    ))}
                    {production.uppercaseNumber}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={{ xs: 1, md: 2 }}
            className="pb-1"
          >
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                resetGraph();
              }}
              disabled={finishedFirst}
            >
              Reset Graph
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={() => {
                solveGraph();
              }}
              disabled={finishedFirst}
            >
              Show Solution
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                if (checkGraph()) {
                  // we need to set this to true so the user can
                  // continue to the next page
                  setFinishedFirst(true);
                  showSnackbar(
                    "Congratulations! You have computed the first sets!",
                    "success",
                    true,
                  );
                }
              }}
              disabled={finishedFirst}
            >
              Check Graph
            </Button>
          </Stack>
        </div>
      </div>
      {/* right side, reactflow canvas */}
      <div className="h-full w-1/2 rounded-lg border-2 border-solid p-2 sm:w-2/3">
        {graphCanvas}
      </div>
    </>
  );
}

export default FirstAlgorithmPage;
