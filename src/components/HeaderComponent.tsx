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
import { shallow } from "zustand/shallow";
import useBoundStore from "../store/store";
import { GrammarSetupSlice, GrammarSlice, NavigationSlice, Production } from "../types";

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
  const selector = (state: NavigationSlice & GrammarSlice & GrammarSetupSlice) => ({
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
    sorted: state.sorted,
    setSorted: state.setSorted,
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
    sorted,
    setSorted,
  } = useBoundStore(selector, shallow);

  const { enqueueSnackbar } = useSnackbar();

  const showSnackbar = (
    message: string,
    variant: VariantType,
    preventDuplicate?: boolean,
  ) => {
    // variant could be success, error, warning, info, or default
    enqueueSnackbar(message, {
      variant,
      preventDuplicate,
    });
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

  // Functions that are invoked when changing between pages
  // Indexed by current page - minimum page
  // What to do when leaving a page to go to the previous one:
  const leaveToPrevious = (page: number): ((cb: () => boolean) => boolean) => {
    switch (page) {
      case 1: // page 0 <- (1)
      case 2: // page 1 <- (2)
      case 3: // page 2 <- (3)
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
            className="xs:block mx-auto hidden lg:pl-6"
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
