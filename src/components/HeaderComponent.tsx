import { styled } from "@mui/material/styles";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import NavigateBefore from "@mui/icons-material/NavigateBefore";
import NavigateNext from "@mui/icons-material/NavigateNext";

import { VariantType, useSnackbar } from "notistack";

import { Node, Edge } from "reactflow";

import { shallow } from "zustand/shallow";
import useBoundStore from "../store/store";

import {
  EdgeData,
  EmptyAlgorithmSlice,
  EmptyNodeSlice,
  GrammarSetupSlice,
  GrammarSlice,
  NavigationSlice,
  NodeData,
  Nonterminal,
  Production,
  Terminal,
} from "../types";

const drawerWidth: number = 240;

interface AppBarProps extends MuiAppBarProps {
  open: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})<AppBarProps>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

function HeaderComponent() {
  const selector = (
    state: NavigationSlice &
      GrammarSlice &
      GrammarSetupSlice &
      EmptyNodeSlice &
      EmptyAlgorithmSlice,
  ) => ({
    // NavigationSlice
    minPage: state.minPage,
    maxPage: state.maxPage,
    page: state.page,
    open: state.open,
    previousPage: state.previousPage,
    nextPage: state.nextPage,
    toggleOpen: state.toggleOpen,
    // GrammarSlice
    startSymbol: state.startSymbol,
    epsilon: state.epsilon,
    productions: state.productions,
    nonTerminals: state.nonTerminals,
    terminals: state.terminals,
    setProductions: state.setProductions,
    setNonTerminals: state.setNonTerminals,
    setTerminals: state.setTerminals,
    // GrammarSetupSlice
    start: state.start,
    sorted: state.sorted,
    reduced: state.reduced,
    preparedEmpty: state.preparedEmpty,
    preparedFirst: state.preparedFirst,
    setSorted: state.setSorted,
    setReduced: state.setReduced,
    setPreparedEmpty: state.setPreparedEmpty,
    setPreparedFirst: state.setPreparedFirst,
    // EmptyNodeSlice
    setEmptySetupComplete: state.setEmptySetupComplete,
    setEmptyNodes: state.setEmptyNodes,
    setEmptyEdges: state.setEmptyEdges,
    // EmptyAlgorithmSlice
    setEmptyNonterminalMap: state.setEmptyNonterminalMap,
    setEmptyTerminalMap: state.setEmptyTerminalMap,
    setEmptyProductionMap: state.setEmptyProductionMap,
  });
  const {
    // NavigationSlice
    minPage,
    maxPage,
    page,
    open,
    previousPage,
    nextPage,
    toggleOpen,
    // GrammarSlice
    startSymbol,
    epsilon,
    productions,
    nonTerminals,
    terminals,
    setProductions,
    setNonTerminals,
    setTerminals,
    // GrammarSetupSlice
    start,
    sorted,
    reduced,
    setSorted,
    setReduced,
    setPreparedEmpty,
    setPreparedFirst,
    // EmptyNodeSlice
    setEmptySetupComplete,
    setEmptyNodes,
    setEmptyEdges,
    // EmptyAlgorithmSlice
    setEmptyNonterminalMap,
    setEmptyTerminalMap,
    setEmptyProductionMap,
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

  // Function to convert a number to a superscript
  const convertToSuperscript = (n: number) => {
    return n
      .toString()
      .split("")
      .map((c) => {
        switch (c) {
          case "0":
            return "⁰";
          case "1":
            return "¹";
          case "2":
            return "²";
          case "3":
            return "³";
          case "4":
            return "⁴";
          case "5":
            return "⁵";
          case "6":
            return "⁶";
          case "7":
            return "⁷";
          case "8":
            return "⁸";
          case "9":
            return "⁹";
          default:
            return c;
        }
      })
      .join("");
  };

  // Comparison function for sorting the grammar rules
  const grammarRuleSort = (a: Production, b: Production) => {
    // start symbol is always first
    if (a.leftSide.name === startSymbol.name) {
      return -1;
    }
    if (b.leftSide.name === startSymbol.name) {
      return 1;
    }
    // sort by rule name
    if (a.leftSide.name < b.leftSide.name) {
      return -1;
    }
    if (a.leftSide.name > b.leftSide.name) {
      return 1;
    }
    // sort by rule value
    if (
      a.rightSide.map((v) => v.name).join("") <
      b.rightSide.map((v) => v.name).join("")
    ) {
      return -1;
    }
    if (
      a.rightSide.map((v) => v.name).join("") >
      b.rightSide.map((v) => v.name).join("")
    ) {
      return 1;
    }
    return 0;
  };

  // Function to sort the Productions, Nonterminals and Terminals of the grammar
  const sortGrammar = () => {
    if (sorted) {
      if (import.meta.env.DEV) {
        console.log("Grammar is already sorted!");
      }
      return true;
    } else {
      if (import.meta.env.DEV) {
        console.log("Sorting grammar...");
      }
      setSorted(true);
    }
    const newProductions = [...productions].sort(grammarRuleSort);
    const newNonTerminals = [...nonTerminals].sort((a, b) => {
      return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    });
    const newTerminals = [...terminals].sort((a, b) => {
      return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    });
    setProductions(newProductions);
    setNonTerminals(newNonTerminals);
    setTerminals(newTerminals);
    return true;
  };

  // Function to reduce the grammar and repare/reset the canvas
  // (before empty attribute algorithm)
  const reduceGrammar = () => {
    if (reduced) {
      if (import.meta.env.DEV) {
        console.log("Grammar is already reduced!");
      }
      return true;
    } else {
      if (import.meta.env.DEV) {
        console.log("Reducing grammar...");
      }
      setReduced(true);
      setEmptySetupComplete(false);
      // TODO: add this back in
      // setFirstSetupComplete(false);
      setPreparedEmpty(false);
      setPreparedFirst(false);
    }

    // reset grammar in case it was already reduced and then changed again
    let newProductions = [...productions];
    let newNonTerminals = [...nonTerminals];
    let newTerminals = [...terminals];
    for (const p of newProductions) {
      p.productive = false;
      p.reachable = false;
      p.empty = false;
      p.number = -1;
    }
    for (const n of newNonTerminals) {
      n.productive = false;
      n.reachable = false;
      n.empty = false;
    }
    startSymbol.productive = false;
    startSymbol.reachable = true;
    startSymbol.empty = false;
    for (const t of newTerminals) {
      t.productive = true;
      t.reachable = false;
      t.empty = false;
    }
    epsilon.productive = true;
    epsilon.reachable = false;
    epsilon.empty = true;

    let changedGrammar = false;

    // reduce the grammar
    // => remove unproductive productions
    // 1. mark terminals as productive (already happens when creating)
    // 2. mark nonterminals as unproductive (already happens when creating)
    // 3. add productions to workset
    let workList: Production[] = [...newProductions];
    let fixpoint = false;
    //TODO: perhaps remove this counter
    let counter = 0;
    while (!fixpoint && counter < 10000) {
      // TODO: remove this counter
      counter++;
      fixpoint = true;
      // 4. go through all productions and mark them as productive if all right side symbols are productive
      for (const production of workList) {
        production.productive = true;
        for (const symbol of production.rightSide) {
          if (symbol instanceof Nonterminal && !symbol.productive) {
            production.productive = false;
            break;
          }
        }
        // 5. mark now productive nonterminals (left sides) as productive
        if (production.productive) {
          production.leftSide.productive = true;
          fixpoint = false;
        }
      }
      // reduce workList to only unproductive productions
      workList = workList.filter((p) => !p.productive);
    }
    // TODO: remove this counter
    if (counter >= 10000) {
      if (import.meta.env.DEV) {
        console.error(
          "Error Code af634f: Fixpoint not reached! Please contact the developer!",
        );
      }
      showSnackbar(
        "Error Code af634f: Please contact the developer!",
        "error",
        true,
      );
    }
    // 6. remove unproductive rules, nonterminals and terminals
    for (const production of newProductions) {
      if (!production.productive) {
        changedGrammar = true;
        production.references--;
        production.leftSide.references--;
        for (const symbol of production.rightSide) {
          symbol.references--;
        }
      }
    }
    newProductions = newProductions.filter((p) => p.productive);
    newNonTerminals = newNonTerminals.filter((n) => n.productive);

    // here we remove now unused terminals
    if (workList.length !== 0) {
      // TODO: check if Set really filters duplicates in this case
      // if not, just remove the [Set()] step
      const unusedTerminals = [
        ...new Set(workList.map((p) => p.rightSide).flat()),
      ].filter((s) => s instanceof Terminal);
      // TODO: check if Set really filtered the duplicates
      if (import.meta.env.DEV) {
        console.log(unusedTerminals.map((t) => t.representation).join(", "));
      }
      for (const t of unusedTerminals) {
        t.productive = t.references > 0;
        // t.productive = false;
        // for (const p of newProductions) {
        //   if (p.rightSide.find((s) => s.name === t.name)) {
        //     t.productive = true;
        //     break;
        //   }
        // }
      }

      newProductions = newProductions.filter((p) => p.productive);
      newNonTerminals = newNonTerminals.filter((n) => n.productive);
      newTerminals = newTerminals.filter((t) => t.productive);

      if (import.meta.env.DEV) {
        const unusedNonTerminals = newNonTerminals.filter((n) => !n.productive);
        console.log("Unproductive productions were removed:");
        console.log(workList.map((p) => p.representation).join("\n"));
        console.log("Unused nonterminals were removed:");
        console.log(unusedNonTerminals.map((n) => n.representation).join(", "));
        console.log("Unused terminals were removed:");
        console.log(
          unusedTerminals
            .filter((t) => !t.productive)
            .map((t) => t.representation)
            .join(", "),
        );
      }
    }
    // => remove unreachable productions
    // if S' is not productive, the grammar is empty anyway
    if (!newNonTerminals.some((n) => n.name === startSymbol.name)) {
      if (import.meta.env.DEV) {
        console.log("All remaining (non)terminals are unreachable!");
      }
      showSnackbar(
        "Grammar does not contain productive and reachable productions!",
        "warning",
        true,
      );
      setReduced(false);

      // This is easy to mess up, but we need to either reset our changes
      // to the reference counts if we want to preserve the original grammar
      // or we need to remove the unreachable (non)terminals and productions
      // For now we try the first option
      for (const p of workList) {
        p.references++;
        p.leftSide.references++;
        for (const symbol of p.rightSide) {
          symbol.references++;
        }
      }

      return false;
    }

    // 1. mark start symbol as reachable (already happens when creating)
    let reachableNonTerminals: Nonterminal[] = [];
    let newReachableNonTerminals: Nonterminal[] = [startSymbol];
    let unreachableNonTerminals: Nonterminal[] = [];
    let unreachableProductions: Production[] = [...newProductions];
    // 2. got through set of newly reachable nonterminals and mark all new nonterminals
    // on the right sides as reachable and add them to the new-list
    while (newReachableNonTerminals.length !== 0) {
      reachableNonTerminals = newReachableNonTerminals;
      newReachableNonTerminals = [];
      unreachableNonTerminals = unreachableNonTerminals.filter(
        (n) => !n.reachable,
      );
      unreachableProductions = unreachableProductions.filter(
        (p) => !p.reachable,
      );
      for (const production of unreachableProductions) {
        if (
          reachableNonTerminals.some((n) => n.name === production.leftSide.name)
        ) {
          production.reachable = true;
          for (const symbol of production.rightSide) {
            if (!symbol.reachable) {
              if (symbol instanceof Nonterminal) {
                newReachableNonTerminals.push(symbol);
              }
              symbol.reachable = true;
            }
          }
        }
      }
    }

    if (import.meta.env.DEV) {
      if (unreachableProductions.some((p) => !p.reachable)) {
        console.log("Unreachable productions were removed:");
        console.log(
          newProductions
            .filter((p) => !p.reachable)
            .map((p) => p.representation)
            .join("\n"),
        );
        console.log("Unreachable nonterminals were removed:");
        console.log(
          newNonTerminals
            .filter((n) => !n.reachable)
            .map((n) => n.representation)
            .join(", "),
        );
        console.log("Unreachable terminals were removed:");
        console.log(
          newTerminals
            .filter((t) => !t.reachable)
            .map((t) => t.representation)
            .join(", "),
        );
      }
    }

    // remove unreachable productions, nonterminals and terminals
    newProductions = newProductions.filter((p) => p.reachable);
    newNonTerminals = newNonTerminals.filter((n) => n.reachable);
    newTerminals = newTerminals.filter((t) => t.reachable);

    for (const p of unreachableProductions) {
      if (!p.reachable) {
        changedGrammar = true;
        p.references--;
        p.leftSide.references--;
        for (const symbol of p.rightSide) {
          symbol.references--;
        }
      }
    }

    // number the productions
    let productionCounter = 0;
    let lastLeftSide = "";
    for (const p of newProductions.sort(grammarRuleSort)) {
      if (p.leftSide.name !== lastLeftSide) {
        productionCounter = 0;
      }
      lastLeftSide = p.leftSide.name;
      p.number = productionCounter++;
      p.uppercaseNumber = convertToSuperscript(p.number);
    }

    if (import.meta.env.DEV) {
      // print the final grammar
      console.log(
        "Nonterminals:\n{",
        newNonTerminals.map((n) => n.representation).join(", "),
        "}",
      );
      console.log(
        "Terminals:\n{",
        newTerminals.map((t) => t.representation).join(", "),
        "}",
      );
      console.log("Productions:");
      console.log(
        [...newProductions]
          .sort(grammarRuleSort)
          .map((p) => p.numberedRepresentation())
          .join("\n"),
      );
    }

    newProductions = newProductions.filter((p) => p.references > 0);
    newNonTerminals = newNonTerminals.filter((n) => n.references > 0);
    newTerminals = newTerminals.filter((t) => t.references > 0);

    setProductions(newProductions);
    setNonTerminals(newNonTerminals);
    setTerminals(newTerminals);

    if (changedGrammar) {
      showSnackbar("Grammar was reduced!", "info", true);
    }

    // prepare the canvas

    // color nonterminals, terminals and productions next to the canvas
    // this must happen before preparing the first step of the empty algorithm
    setEmptyNonterminalMap(newNonTerminals.map((n) => [n.name, n.empty]));
    setEmptyTerminalMap(newTerminals.map((t) => [t.name, t.empty]));
    setEmptyProductionMap(newProductions.map((p) => [p.name, p.empty]));

    const newNodes: Node<NodeData>[] = [];
    const newEdges: Edge<EdgeData>[] = [];

    // set the canvas
    setEmptyNodes(newNodes);
    setEmptyEdges(newEdges);

    return true;
  };

  // Functions that are invoked when changing between pages
  // Indexed by current page - minimum page
  // What to do when leaving a page to go to the previous one:
  const leaveToPrevious = (page: number): ((cb: () => boolean) => boolean) => {
    switch (page) {
      case 1: // page 0 <- (1)
      case 2: // page 1 <- (2)
        return (cb) => {
          return cb();
        };
      case 3: // page 2 <- (3)
        return (cb) => {
          showSnackbar(
            "Changing the grammar will reset the subsequent steps!",
            "warning",
            true,
          );
          return cb();
        };
      case 4: // page 3 <- (4)
      case 5: // page 4 <- (5)
      case 6: // page 5 <- (6)
      case 7: // page 6 <- (7)
      case 8: // page 7 <- (8)
        return (cb) => {
          return cb();
        };
      case 0: // page -1 <- (0), should never happen
      default:
        return () => {
          showSnackbar("You can not go back!", "error", true);
          return false;
        };
    }
  };
  // What to do when leaving a page to go to the next one:
  const leaveToNext = (page: number): ((cb: () => boolean) => boolean) => {
    switch (page) {
      case 0: // page (0) -> 1
        return (cb) => {
          return cb();
        };
      case 1: // page (1) -> 2
        return (cb) => {
          if (terminals.length > 0 || epsilon.references > 0) {
            return cb();
          } else {
            showSnackbar(
              "Please enter at least one producing Production!",
              "error",
              true,
            );
            return false;
          }
        };
      case 2: // page (2) -> 3
        return (cb) => {
          if (start.some(([, start]) => start)) {
            return cb();
          } else {
            showSnackbar("Please select a start symbol!", "error", true);
            return false;
          }
        };
      case 3: // page (3) -> 4
      case 4: // page (4) -> 5
      case 5: // page (5) -> 6
      case 6: // page (6) -> 7
      case 7: // page (7) -> 8
        return (cb) => {
          return cb();
        };
      case 8: // page (8) -> 9, should never happen
      default:
        return () => {
          showSnackbar("You can not go forward!", "error", true);
          return false;
        };
    }
  };
  // What to do when arriving at a page from the next one:
  const arriveToPrevious = (page: number): (() => boolean) => {
    switch (page) {
      case 0: // page (0) <- 1
      case 1: // page (1) <- 2
      case 2: // page (2) <- 3
      case 3: // page (3) <- 4
      case 4: // page (4) <- 5
      case 5: // page (5) <- 6
      case 6: // page (6) <- 7
      case 7: // page (7) <- 8
        return () => {
          return true;
        };
      case 8: // page (8) <- 9, should never happen
      default:
        return () => {
          showSnackbar("You can not go back!", "error", true);
          return false;
        };
    }
  };
  // What to do when arriving at a page from the previous one:
  const arriveToNext = (page: number): (() => boolean) => {
    switch (page) {
      case 1: // page 0 -> (1)
        return () => {
          return true;
        };
      case 2: // page 1 -> (2)
        return () => {
          return sortGrammar();
        };
      case 3: // page 2 -> (3)
        return () => {
          return reduceGrammar();
        };
      case 4: // page 3 -> (4)
      case 5: // page 4 -> (5)
      case 6: // page 5 -> (6)
      case 7: // page 6 -> (7)
      case 8: // page 7 -> (8)
        return () => {
          return true;
        };
      case 0: // page -1 -> (0), should never happen
      default:
        return () => {
          showSnackbar("You can not go forward!", "error", true);
          return false;
        };
    }
  };

  const handlePreviousNavigation = () => {
    if (leaveToPrevious(page)(arriveToPrevious(page - 1))) {
      previousPage();
    }
  };
  const handleNextNavigation = () => {
    if (leaveToNext(page)(arriveToNext(page + 1))) {
      nextPage();
    }
  };

  return (
    <AppBar position="fixed" open={open}>
      <Toolbar>
        {/* 1st part (progress button) is as big as progress-sidebar */}
        <IconButton
          edge="start"
          color="inherit"
          aria-label="open progress bar"
          onClick={toggleOpen}
          sx={{
            ...(open && { display: "none" }),
          }}
          className="mr-3 sm:mr-5"
        >
          <MenuIcon />
        </IconButton>
        {/* 2nd part (title) is centered over remaining width.
        If screen is so small that nav buttons on the right
        would be very close, the title is centered
        between progress bar and nav buttons. */}
        <Box sx={{ flexGrow: 1 }}>
          <Typography
            variant="h6"
            component="h2"
            align="center"
            noWrap
            className="mx-auto hidden xs:block lg:pl-6"
          >
            LL-Webtutor
          </Typography>
        </Box>
        {/* 3rd part (navigation buttons) are on the right side.
        If the screen is large enough, their position is independent
        of the rest (absolute). This centers the 2. part (title). */}
        <Box className="right-4 my-auto lg:absolute">
          <Button
            variant="outlined"
            aria-label="previous step"
            color="inherit"
            startIcon={<NavigateBefore />}
            // On small screens, we need to hide the text (Prev) and only
            // display the icon. For this we need to fix margins
            className="box-content min-w-[20px] sm:box-border sm:min-w-[64px] [&>*]:mx-0 sm:[&>.MuiButton-startIcon]:ml-[-4px] sm:[&>.MuiButton-startIcon]:mr-2"
            onClick={handlePreviousNavigation}
            disabled={page === minPage}
          >
            {/* Hide text on small screens */}
            <span className="hidden sm:block">Prev</span>
          </Button>
          <Button
            variant="outlined"
            aria-label="next step"
            color="inherit"
            endIcon={<NavigateNext />}
            // On small screens, we need to hide the text (Next) and only
            // display the icon. For this we need to fix margins
            className="ml-1 box-content min-w-[20px] sm:ml-2 sm:box-border sm:min-w-[64px] [&>*]:mx-0 sm:[&>.MuiButton-endIcon]:ml-2 sm:[&>.MuiButton-endIcon]:mr-[-4px]"
            onClick={handleNextNavigation}
            disabled={page === maxPage}
          >
            {/* Hide text on small screens */}
            <span className="hidden sm:block">Next</span>
          </Button>
        </Box>
      </Toolbar>
      <Divider />
    </AppBar>
  );
}

export default HeaderComponent;
