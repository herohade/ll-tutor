import { styled } from "@mui/material";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";

import { VariantType, useSnackbar } from "notistack";

import { shallow } from "zustand/shallow";
import useBoundStore from "../store/store";

import {
  EmptyAlgorithmSlice,
  FollowAlgorithmNodeMap,
  FollowAlgorithmSlice,
  FollowNodeSlice,
  GrammarSlice,
  Nonterminal,
  Terminal,
} from "../types";

type Props = {
  graphCanvas: JSX.Element;
};

const StyledSpan = styled("span")({});

/*
This is the ninth page of the webtutor.
It lets the user apply the follow algorithm to the grammar,
to propagate the follow sets through the graph.
*/
function FollowAlgorithmPage({ graphCanvas }: Props) {
  const selector = (
    state: GrammarSlice &
      EmptyAlgorithmSlice &
      FollowNodeSlice &
      FollowAlgorithmSlice,
  ) => ({
    // GrammarSlice
    epsilon: state.epsilon,
    endOfInput: state.endOfInput,
    productions: state.productions,
    nonTerminals: state.nonTerminals,
    terminals: state.terminals,
    setNonTerminals: state.setNonTerminals,
    // EmptyAlgorithmSlice
    emptyNonterminalMap: state.emptyNonterminalMap,
    // FollowNodeSlice
    followNodes: state.followNodes,
    followEdges: state.followEdges,
    // FollowAlgorithmSlice
    finishedFollow: state.finishedFollow,
    followNodeMap: state.followNodeMap,
    setFinishedFollow: state.setFinishedFollow,
    setFollowNodeMap: state.setFollowNodeMap,
  });
  const {
    // GrammarSlice
    epsilon,
    endOfInput,
    productions,
    nonTerminals,
    terminals,
    setNonTerminals,
    // EmptyAlgorithmSlice
    emptyNonterminalMap,
    // FollowNodeSlice
    followNodes,
    followEdges,
    // FollowAlgorithmSlice
    finishedFollow,
    followNodeMap,
    setFinishedFollow,
    setFollowNodeMap,
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

  // copied from prepareFollowMap() in HeaderComponent.tsx
  const resetGraph = () => {
    // This maps each SCC (groupnode) to a FollowAlgorithmNodeMap
    // The FollowAlgorithmNodeMap contains the following information:
    // active: boolean, whether the button (SCC) is active (already processed)
    // incomingFollow: Map<string, string[] | undefined>, maps each incoming
    // SCC (groupnode) to the follow (or Fe) set of the incoming SCC or
    // undefined if it was not yet processed
    // follow: Set<string>, the follow (or Fe) set of the current SCC
    // as far as it was already processed
    const newFollowNodeMap = new Map<string, FollowAlgorithmNodeMap>(
      followNodeMap,
    );
    for (const node of followNodes) {
      // We only consider SCCs (groupnodes) here
      if (node.type === "group") {
        // Also we only need to update the newly user added (=Follow) nodes.
        // Except for the old nodes that got a new outgoing edge, since
        // those are all active from the first algorithm step, but
        // need to be inactive for the user to click and propagate their set
        if (node.data.name.startsWith("Follow(")) {
          const name: string = node.id;
          // Get all incoming SCCs (groupnodes)
          // Those are relevant since this SCC gets its follow set from them
          const incomingNodeNames: string[] = followEdges
            .filter((e) => e.target === node.id && e.source !== node.id)
            .map((e) => e.source);
          const newIncomingFollow = new Map<string, string[] | undefined>();
          for (const nodeName of incomingNodeNames) {
            newIncomingFollow.set(nodeName, undefined);
          }
          // This will be the follow set of the SCC
          // It will be dynamically updated while processing the SCC
          const nodeMap: FollowAlgorithmNodeMap = {
            active: false,
            incomingFollow: newIncomingFollow,
            follow: new Set<string>(),
          };
          newFollowNodeMap.set(name, nodeMap);
        } else {
          // If this is an old node that got a new outgoing edge,
          // we need to set it to inactive
          if (
            followEdges
              .filter((e) => e.source === node.id)
              .some((e) => e.data?.name.match(/Follow\(SCC\(/) !== null)
          ) {
            const nodeMap = newFollowNodeMap.get(node.id);
            if (!nodeMap) {
              if (import.meta.env.DEV) {
                console.error(
                  "Error Code aca93b: FollowNode not found among followNodes!",
                  node,
                  newFollowNodeMap,
                );
              }
              showSnackbar(
                "Error Code aca93b: Please contact the developer!",
                "error",
                true,
              );
              return false;
            }
            newFollowNodeMap.set(node.id, { ...nodeMap, active: false });
          }
        }
      }
    }
    if (import.meta.env.DEV) {
      console.log("newFollowNodeMap", newFollowNodeMap);
    }
    setFollowNodeMap(newFollowNodeMap);
  };

  const solveGraph = () => {
    // We start with the leafs, from there we propagate the follow sets
    // through the graph.
    const leafIds = followEdges
      .filter(
        // Leafs are all nodes SCC(A) that have an edge
        // Fε(SCC(A)) -> Follow(SCC(...))
        (e) => e.data?.name.match(/^Fε\(SCC\(.+\)\)->Follow\(.+\)$/) !== null,
      )
      .map((e) => e.source);

    const newFollowNodeMap = new Map(followNodeMap);
    for (const leafId of leafIds) {
      const leafNodeMap = newFollowNodeMap.get(leafId);
      if (leafNodeMap === undefined) {
        if (import.meta.env.DEV) {
          console.error(
            "Error Code 36817f: Leaf node not found in followNodeMap!",
            leafId,
          );
        }
        showSnackbar(
          "Error Code 36817f: Please contact the developer!",
          "error",
          true,
        );
        return;
      }

      const workList: string[] = [leafId];
      while (workList.length > 0) {
        const currentNodeId = workList.pop();
        if (currentNodeId === undefined) {
          if (import.meta.env.DEV) {
            console.error(
              "Error Code 25bffd: currentNodeId is undefined!",
              currentNodeId,
            );
          }
          showSnackbar(
            "Error Code 25bffd: Please contact the developer!",
            "error",
            true,
          );
          return;
        }
        const currentNodeMap = newFollowNodeMap.get(currentNodeId);
        if (currentNodeMap === undefined) {
          if (import.meta.env.DEV) {
            console.error(
              "Error Code 17005b: currentNodeMap is undefined!",
              currentNodeMap,
            );
          }
          showSnackbar(
            "Error Code 17005b: Please contact the developer!",
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
          console.log("followNodeMap", newFollowNodeMap);
        }

        // If all incoming SCCs (groupnodes) have been processed,
        // we can process the current SCC.
        // If not, we skip it. It will be added to the worklist again
        // once all incoming SCCs have been processed.
        // (Technically whenever an incoming SCC is processed, but
        // we would just skip it again if it was not the last one.)
        let newActive = true;
        for (const followSet of currentNodeMap.incomingFollow.values()) {
          if (followSet === undefined) {
            newActive = false;
            break;
          }
        }
        if (newActive) {
          // Calculate the follow set of the current SCC from the
          // follow sets of the incoming SCCs
          const newCurrentNodeMap = {
            ...currentNodeMap,
            follow:
              // If this is one of the leaves of the graph, keep the follow set
              // since those already have their follow sets
              // (and no incoming SCCs which would erase the follow set)
              currentNodeId !== leafId
                ? new Set(
                    [
                      ...currentNodeMap.incomingFollow.values(),
                    ].flat() as string[],
                  )
                : currentNodeMap.follow,
            active: true,
          };
          newFollowNodeMap.set(currentNodeId, newCurrentNodeMap);

          // and update this one's follow set in the outgoing SCCs
          const outgoingNodeIds = followEdges
            .filter((e) => e.data?.isGroupEdge)
            .filter(
              (e) => e.source === currentNodeId && e.target !== currentNodeId,
            )
            .map((e) => e.target);
          for (const outgoingNodeId of outgoingNodeIds) {
            // add the outgoing SCCs to the worklist
            workList.push(outgoingNodeId);

            const outgoingNodeMap = newFollowNodeMap.get(outgoingNodeId);
            if (outgoingNodeMap === undefined) {
              if (import.meta.env.DEV) {
                console.error(
                  "Error Code 290ff8: outgoingNodeMap is undefined!",
                  outgoingNodeMap,
                );
              }
              showSnackbar(
                "Error Code 290ff8: Please contact the developer!",
                "error",
                true,
              );
              return;
            }
            // update this one's follow set in the outgoing SCCs
            const newIncomingFollow = new Map(outgoingNodeMap.incomingFollow);
            newIncomingFollow.set(currentNodeId, [
              ...newCurrentNodeMap.follow.values(),
            ]);
            newFollowNodeMap.set(outgoingNodeId, {
              ...outgoingNodeMap,
              incomingFollow: newIncomingFollow,
            });
          }
          if (import.meta.env.DEV) {
            console.log(
              "updated outgoing SCCs",
              outgoingNodeIds,
              "worklist",
              workList,
            );
            console.log("newFollowNodeMap", newFollowNodeMap);
          }
        }
      }
    }
    setFollowNodeMap(newFollowNodeMap);
  };

  const checkGraph = () => {
    // TODO: maybe give more feedback like
    // which button can be clicked next?
    for (const followAlgorithmNodeMap of followNodeMap.values()) {
      // TODO: remove one of these options:
      // OPTION-1: either require all buttons to be clicked:
      if (!followAlgorithmNodeMap.active) {
        showSnackbar("There are still buttons to be clicked!", "error", true);
        return false;
      }
      // OPTION-2: or just require the follow sets to be calculated
      // (does not require the last buttons (roots?) since these
      // SCCs do not need to propagate their follow sets)
      // for (const followArray of followAlgorithmNodeMap.incomingFollow.values()) {
      //   if (followArray === undefined) {
      //     showSnackbar("There are still buttons to be clicked!", "error", true);
      //     return false;
      //   }
      // }
    }

    // update the follow sets in the grammar
    const newNonTerminals = [...nonTerminals];
    const followSymbols = [endOfInput, ...terminals];
    for (const groupNode of followNodes.filter(
      (n) => n.type === "group" && n.data.name.startsWith("Follow(SCC("),
    )) {
      // get the follow set, all children, and the (non)terminals that they
      // represent
      const childNodeNames = followNodes
        .filter((n) => n.type === "follow" && n.parentNode === groupNode.id)
        .map((n) => n.data.name.match(/\((.+)\)/)?.[1] ?? n.data.name);
      // here we map the Set<string> to Array<Terminal>
      const followSetStrings = followNodeMap.get(groupNode.id)?.follow;
      const followSet = followSetStrings
        ? [...followSetStrings].map((t) =>
            followSymbols.find((n) => n.name === t),
          )
        : undefined;
      // this should never happen
      if (followSet === undefined || followSet.some((t) => t === undefined)) {
        if (import.meta.env.DEV) {
          console.error(
            "Error Code 13de33: followSet is undefined!",
            followSet,
          );
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
                "with followSet",
                followSet,
              );
            }
            continue;
          }
          const symbol = newNonTerminals.find((n) => n.name === symbolName);
          if (symbol === undefined) {
            if (import.meta.env.DEV) {
              console.error(
                "Error Code 9642c8: symbol is undefined!",
                symbol,
                symbolName,
              );
            }
            showSnackbar(
              "Error Code 9642c8: Please contact the developer!",
              "error",
              true,
            );
            return false;
          }
          // we checked for undefined above, so we can do this safely
          symbol.follow = followSet as Array<Terminal>;
        }
      }
    }
    if (import.meta.env.DEV) {
      console.log("newNonTerminals", newNonTerminals);
    }
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
              onClick={resetGraph}
              disabled={finishedFollow}
            >
              Reset Graph
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={solveGraph}
              disabled={finishedFollow}
            >
              Show Solution
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                if (checkGraph()) {
                  setFinishedFollow(true);
                  showSnackbar(
                    "Congratulations! You have calculated the follow sets!",
                    "success",
                    true,
                  );
                }
              }}
              disabled={finishedFollow}
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

export default FollowAlgorithmPage;
