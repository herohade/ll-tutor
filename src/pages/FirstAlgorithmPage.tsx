import { styled } from "@mui/material";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";

import { VariantType, useSnackbar } from "notistack";

import { shallow } from "zustand/shallow";
import useBoundStore from "../store/store";

import {
  EmptyAlgorithmSlice,
  FirstAlgorithmSlice,
  GrammarSlice,
  Nonterminal,
} from "../types";

type Props = {
  graphCanvas: JSX.Element;
};

const StyledSpan = styled("span")({});

/*
This is the seventh page of the webtutor.
It lets the user apply the first algorithm to the grammar,
to propagate the first attributes through the graph.
*/
function FirstAlgorithmPage({ graphCanvas }: Props) {
  const selector = (
    state: GrammarSlice & EmptyAlgorithmSlice & FirstAlgorithmSlice,
  ) => ({
    // GrammarSlice
    epsilon: state.epsilon,
    productions: state.productions,
    nonTerminals: state.nonTerminals,
    terminals: state.terminals,
    // EmptyAlgorithmSlice
    emptyNonterminalMap: state.emptyNonterminalMap,
    // FirstAlgorithmSlice
    finishedFirst: state.finishedFirst,
    setFinishedFirst: state.setFinishedFirst,
  });
  const {
    // GrammarSlice
    epsilon,
    productions,
    nonTerminals,
    terminals,
    // EmptyAlgorithmSlice
    emptyNonterminalMap,
    // FirstAlgorithmSlice
    finishedFirst,
    setFinishedFirst,
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

  return (
    <>
      {/* left side, grammar description and information */}
      <div className="mr-1 h-full w-1/2 overflow-scroll rounded-lg border-2 border-solid p-2 text-left sm:w-1/3">
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
              // TODO
              onClick={() => {
                showSnackbar(
                  "This feature is not yet implemented!",
                  "error",
                  true,
                );
              }}
              disabled={finishedFirst}
            >
              Reset Step
            </Button>
            <Button
              variant="contained"
              color="success"
              // TODO
              onClick={() => {
                showSnackbar(
                  "This feature is not yet implemented!",
                  "error",
                  true,
                );
              }}
              disabled={finishedFirst}
            >
              Show Solution
            </Button>
            <Button
              variant="contained"
              // TODO
              onClick={() => {
                showSnackbar(
                  "This feature is not yet implemented!",
                  "error",
                  true,
                );
                setFinishedFirst(true);
                showSnackbar(
                  "Congratulations! You have calculated the first attributes!",
                  "success",
                  true,
                );
              }}
              disabled={finishedFirst}
            >
              Check Step
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
