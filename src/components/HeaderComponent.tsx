import { styled } from "@mui/material/styles";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import NavigateBefore from "@mui/icons-material/NavigateBefore";
import NavigateNext from "@mui/icons-material/NavigateNext";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import MenuIcon from "@mui/icons-material/Menu";
import Divider from "@mui/material/Divider";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";

import { VariantType, useSnackbar } from "notistack";

import { Node, Edge, MarkerType } from "reactflow";

import { Dispatch, SetStateAction } from "react";

import { shallow } from "zustand/shallow";
import useBoundStore from "../store/store";

import {
  EdgeData,
  EdgePathType,
  EmptyAlgorithmSlice,
  EmptyNodeSlice,
  FirstAlgorithmNodeMap,
  FirstAlgorithmSlice,
  FirstNodeSlice,
  FollowAlgorithmNodeMap,
  FollowAlgorithmSlice,
  FollowNodeSlice,
  GrammarSetupSlice,
  GrammarSlice,
  NavigationSlice,
  NodeColor,
  NodeData,
  Nonterminal,
  Production,
  Terminal,
} from "../types";

interface Props {
  setTutorialOpen: Dispatch<SetStateAction<boolean>>;
}

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

function HeaderComponent({ setTutorialOpen }: Props) {
  const selector = (
    state: NavigationSlice &
      GrammarSlice &
      GrammarSetupSlice &
      EmptyNodeSlice &
      EmptyAlgorithmSlice &
      FirstNodeSlice &
      FirstAlgorithmSlice &
      FollowNodeSlice &
      FollowAlgorithmSlice,
  ) => ({
    // NavigationSlice
    minPage: state.minPage,
    maxPage: state.maxPage,
    page: state.page,
    open: state.open,
    settings: state.settings,
    tutorialPage: state.tutorialPage,
    previousPage: state.previousPage,
    nextPage: state.nextPage,
    toggleOpen: state.toggleOpen,
    setSettings: state.setSettings,
    setTutorialPage: state.setTutorialPage,
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
    preparedFirstMap: state.preparedFirstMap,
    preparedFollow: state.preparedFollow,
    preparedFollowMap: state.preparedFollowMap,
    setSorted: state.setSorted,
    setReduced: state.setReduced,
    setPreparedEmpty: state.setPreparedEmpty,
    setPreparedFirst: state.setPreparedFirst,
    setPreparedFirstMap: state.setPreparedFirstMap,
    setPreparedFollow: state.setPreparedFollow,
    setPreparedFollowMap: state.setPreparedFollowMap,
    // EmptyNodeSlice
    emptySetupComplete: state.emptySetupComplete,
    emptyNodes: state.emptyNodes,
    setEmptySetupComplete: state.setEmptySetupComplete,
    setEmptyNodes: state.setEmptyNodes,
    setEmptyEdges: state.setEmptyEdges,
    updateAllEmptyNodeAndEdgeColors: state.updateAllEmptyNodeAndEdgeColors,
    // EmptyAlgorithmSlice
    finishedEmpty: state.finishedEmpty,
    setEmptyNonterminalMap: state.setEmptyNonterminalMap,
    setEmptyProductionMap: state.setEmptyProductionMap,
    setEmptyUserFixpoint: state.setEmptyUserFixpoint,
    setEmptyFixpoint: state.setEmptyFixpoint,
    setEmptyWorkList: state.setEmptyWorkList,
    setFinishedEmpty: state.setFinishedEmpty,
    // FirstNodeSlice
    firstSetupComplete: state.firstSetupComplete,
    firstNodes: state.firstNodes,
    firstEdges: state.firstEdges,
    getFirstNodeId: state.getFirstNodeId,
    getFirstEdgeId: state.getFirstEdgeId,
    setFirstSetupComplete: state.setFirstSetupComplete,
    setFirstNodes: state.setFirstNodes,
    setFirstEdges: state.setFirstEdges,
    setFirstNodeEdgesHidden: state.setFirstNodeEdgesHidden,
    // FirstAlgorithmSlice
    finishedFirst: state.finishedFirst,
    firstNodeMap: state.firstNodeMap,
    setFinishedFirst: state.setFinishedFirst,
    setFirstNodeMap: state.setFirstNodeMap,
    // FollowNodeSlice
    followSetupComplete: state.followSetupComplete,
    followNodes: state.followNodes,
    followEdges: state.followEdges,
    getFollowNodeId: state.getFollowNodeId,
    getFollowEdgeId: state.getFollowEdgeId,
    setFollowSetupComplete: state.setFollowSetupComplete,
    setFollowNodes: state.setFollowNodes,
    setFollowEdges: state.setFollowEdges,
    setFollowNodeEdgesHidden: state.setFollowNodeEdgesHidden,
    setExpandFollowParent: state.setExpandFollowParent,
    // FollowAlgorithmSlice
    finishedFollow: state.finishedFollow,
    followNodeMap: state.followNodeMap,
    setFinishedFollow: state.setFinishedFollow,
    setFollowNodeMap: state.setFollowNodeMap,
  });
  const {
    // NavigationSlice
    minPage,
    maxPage,
    page,
    open,
    settings,
    tutorialPage,
    previousPage,
    nextPage,
    toggleOpen,
    setSettings,
    setTutorialPage,
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
    preparedEmpty,
    preparedFirst,
    preparedFirstMap,
    preparedFollow,
    preparedFollowMap,
    setSorted,
    setReduced,
    setPreparedEmpty,
    setPreparedFirst,
    setPreparedFirstMap,
    setPreparedFollow,
    setPreparedFollowMap,
    // EmptyNodeSlice
    emptySetupComplete,
    emptyNodes,
    setEmptySetupComplete,
    setEmptyNodes,
    setEmptyEdges,
    updateAllEmptyNodeAndEdgeColors,
    // EmptyAlgorithmSlice
    finishedEmpty,
    setEmptyNonterminalMap,
    setEmptyProductionMap,
    setEmptyUserFixpoint,
    setEmptyFixpoint,
    setEmptyWorkList,
    setFinishedEmpty,
    // FirstNodeSlice
    firstSetupComplete,
    firstNodes,
    firstEdges,
    getFirstNodeId,
    getFirstEdgeId,
    setFirstSetupComplete,
    setFirstNodes,
    setFirstEdges,
    setFirstNodeEdgesHidden,
    // FirstAlgorithmSlice
    finishedFirst,
    firstNodeMap,
    setFinishedFirst,
    setFirstNodeMap,
    // FollowNodeSlice
    followSetupComplete,
    followNodes,
    followEdges,
    getFollowNodeId,
    getFollowEdgeId,
    setFollowSetupComplete,
    setFollowNodes,
    setFollowEdges,
    setFollowNodeEdgesHidden,
    setExpandFollowParent,
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
      setFirstSetupComplete(false);
      setFollowSetupComplete(false);
      setPreparedEmpty(false);
      setPreparedFirst(false);
      setPreparedFirstMap(false);
      setPreparedFollow(false);
      setPreparedFollowMap(false);
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
      const unusedTerminals = [
        ...new Set(workList.map((p) => p.rightSide).flat()),
      ].filter((s) => s instanceof Terminal);
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

      // We now need to either reset our changes to the reference counts if we
      // want to preserve the original grammar or we need to remove the
      // unreachable (non)terminals and productions (all of them).
      // For now we try the first option since the user might not want
      // to have to re-enter the grammar after a typo.
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
    // 2. got through set of newly reachable nonterminals and mark all new
    // nonterminals on the right sides as reachable and add them to the new-list
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
        // we might be able to just use if (production.leftSide.reachable)
        // here but this would include symbols added in this iteration
        // and I'm currently too lazy to check if this could be a problem
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

    // number the productions (for printing A->...^0, A->...^1, ...)
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

    // prepare the reactflow canvas

    // These are needed to color nonterminals and productions next to the canvas
    // This must happen before preparing the first step of the empty algorithm
    setEmptyNonterminalMap(newNonTerminals.map((n) => [n.name, n.empty]));
    setEmptyProductionMap(newProductions.map((p) => [p.name, p.empty]));

    // delete the old nodes and edges (if there are any)
    const newNodes: Node<NodeData>[] = [];
    const newEdges: Edge<EdgeData>[] = [];
    setEmptyNodes(newNodes);
    setEmptyEdges(newEdges);

    return true;
  };

  // Set up the first step of the empty attribute algorithm
  // WARNING: When changing the empty attribute algorithm, this part
  // needs to be updated accordingly!
  const prepareEmptyAlgorithm = () => {
    if (preparedEmpty) {
      if (import.meta.env.DEV) {
        console.log("Empty attribute algorithm is already prepared!");
      }
      return true;
    } else {
      if (import.meta.env.DEV) {
        console.log("Preparing empty attribute algorithm...");
      }
      setPreparedEmpty(true);
    }

    // Prepare the first step of the empty algorithm

    // update nodes to reflece beginning of the first step
    updateAllEmptyNodeAndEdgeColors();

    // Compute next steps solution
    /*
    // Full Algorithm:
    // 1. set terminal ε to empty = true
    // (already happens when creating)

    // 2. while fixpoint is not reached, check all productions
    let workList: Array<Production> = [...productions];
    // with non-empty left side
    let fixpoint = false;
    // TODO: perhaps remove this counter
    let counter = 0;
    while (!fixpoint && counter < 10000) {
        // TODO: remove this counter
        counter++;
        fixpoint = true;

        // 3. remove all new empty productions
        workList = workList.filter((p) => !p.empty);
        for (const production of workList) {
            // 5. if right side is empty, set left side and production to empty
            // also set fixpoint to false since there are new empty nonterminals
            if (!production.rightSide.some((s) => !s.empty)) {
                production.leftSide.empty = true;
                production.empty = true;
                fixpoint = false;
                continue;
            }
        }
    }
  */
    let newEmptyWorkList = [...productions];
    let newEmptyFixpoint = true;
    newEmptyWorkList = newEmptyWorkList.filter((p) => !p.empty);
    const newEmptyProductions = [];
    for (const production of newEmptyWorkList) {
      if (!production.rightSide.some((s) => !s.empty)) {
        newEmptyProductions.push(production);
      }
    }
    for (const production of newEmptyProductions) {
      production.empty = true;
      if (!production.leftSide.empty) {
        production.leftSide.empty = true;
        newEmptyFixpoint = false;
      }
    }

    if (import.meta.env.DEV) {
      console.log("newEmptyWorkList", newEmptyWorkList);
      console.log("newEmptyFixpoint", newEmptyFixpoint);
    }

    // reset the empty attribute algorithm
    setEmptyWorkList(newEmptyWorkList);
    setEmptyFixpoint(newEmptyFixpoint);
    setEmptyUserFixpoint(false);
    setFinishedEmpty(false);

    return true;
  };

  // Set up the canvas for the first set algorithm.
  // We add a new FirstNode for each (Non)terminal,
  // a FirstNode {t}, as well as an Edge {t} -> t for each terminal t.
  // Also we reset the first set algorithm.
  const prepareFirstAlgorithm = () => {
    if (preparedFirst) {
      if (import.meta.env.DEV) {
        console.log("First set algorithm is already prepared!");
      }
      return true;
    } else {
      if (import.meta.env.DEV) {
        console.log("Preparing first set algorithm...");
      }
      setPreparedFirst(true);
    }

    // Prepare the canvas for the first set algorithm
    const newFirstNodes: Node<NodeData>[] = [];
    const newFirstEdges: Edge<EdgeData>[] = [];

    // add a new FirstNode for each (Non)terminal
    for (const node of emptyNodes.filter((n) => n.data.name !== "ε")) {
      const newNode: Node<NodeData> = {
        id: getFirstNodeId(),
        type: "first",
        position: node.position,
        deletable: false,
        data: {
          ...node.data,
        },
      };
      newFirstNodes.push(newNode);
    }

    // add a FirstNode {t} for each terminal t
    for (const terminal of terminals) {
      const terminalNode: Node<NodeData> | undefined = newFirstNodes.find(
        (n) => n.data.name === terminal.name,
      );
      if (!terminalNode) {
        if (import.meta.env.DEV) {
          console.error(
            "Error Code 60c841: Terminal not found among newFirstNodes!",
            terminal,
          );
        }
        showSnackbar(
          "Error Code 60c841: Please contact the developer!",
          "error",
          true,
        );
        return false;
      }
      const nodeId = getFirstNodeId();
      const nodeName = `{${terminal.name}}`;
      const newNode: Node<NodeData> = {
        id: nodeId,
        type: "first",
        position: { // this is eyeballed, we just hope this is a good position
          x: terminalNode.position.x,
          y: terminalNode.position.y - (terminalNode.height ?? 50) - 50,
        },
        deletable: false,
        data: {
          name: nodeName,
          empty: false,
          color: NodeColor.none,
        },
      };
      const edgeName = nodeName + "->" + terminalNode.data.name;
      const newEdge: Edge<EdgeData> = {
        id: getFirstEdgeId(),
        type: "floating",
        source: nodeId,
        target: terminalNode.id,
        sourceNode: newNode,
        targetNode: terminalNode,
        deletable: false,
        data: {
          pathType: EdgePathType.Straight,
          isGroupEdge: false,
          name: edgeName,
        },
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          orient: "auto",
          color: NodeColor.none,
        },
        style: {
          strokeWidth: 2,
          stroke: NodeColor.none,
        },
      };
      newFirstNodes.push(newNode);
      newFirstEdges.push(newEdge);
    }

    setFirstNodes(newFirstNodes);
    setFirstEdges(newFirstEdges);

    return true;
  };

  // Set up the first set map.
  // Required for the reactflow nodes to keep track of their first set.
  const prepareFirstMap = () => {
    if (preparedFirstMap) {
      if (import.meta.env.DEV) {
        console.log("First set map is already prepared!");
      }
      setFirstNodeEdgesHidden(true);
      return true;
    } else {
      if (import.meta.env.DEV) {
        console.log("Preparing first set map...");
      }
      setPreparedFirstMap(true);
    }

    // reset the first set algorithm
    setFinishedFirst(false);
    // hide the edges of the FirstNodes (we only need edges between sccs)
    setFirstNodeEdgesHidden(true);

    // Prepare the first set map
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
          .map((e) => e.source);
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

    return true;
  };

  // Set up the canvas for the follow set algorithm.
  // We add a new FollowNode for each Nonterminal.
  // We also add FollowNodes and edges to replicate the F_epsilon graph
  // and a FollowNode {$}, as well as an Edge {$} -> S' for the start symbol S'.
  const prepareFollowAlgorithm = () => {
    if (preparedFollow) {
      if (import.meta.env.DEV) {
        console.log("Follow set algorithm is already prepared!");
      }
      return true;
    } else {
      if (import.meta.env.DEV) {
        console.log("Preparing follow set algorithm...");
      }
      setPreparedFollow(true);
    }

    const newFollowNodes: Node<NodeData>[] = [];
    const newFollowEdges: Edge<EdgeData>[] = [];

    // since we can't use the elk layouting algorithm here,
    // we will just eyeball the positions of the nodes
    const maxXY: { x: number; y: number } = { x: 0, y: 0 };

    // Add all FirstNodes as FollowNodes (we need F_epsilon again)
    for (const node of firstNodes) {
      // group nodes stay group nodes, first nodes become follow nodes
      const type = node.type === "group" ? "group" : "follow";
      const parentNodeName: string | undefined = node.parentNode
        ? firstNodes.find((n) => n.id === node.parentNode)?.data.name
        : undefined;
      const parentNode: string | undefined = parentNodeName
        ? newFollowNodes.find(
            (n) => n.data.name === "Fε(" + parentNodeName + ")",
          )?.id
        : undefined;

      // update the furthest position of a node
      if (node.position.x < maxXY.x) {
        maxXY.x = node.position.x;
      }
      if (node.position.y < maxXY.y) {
        maxXY.y = node.position.y;
      }

      const newNode: Node<NodeData> = {
        id: getFollowNodeId(),
        type,
        position: node.position,
        width: node.width,
        height: node.height,
        parentNode,
        extent: node.extent,
        expandParent: type !== "group" ? true : undefined,
        deletable: false,
        data: {
          ...node.data,
          name: "Fε(" + node.data.name + ")",
        },
      };
      newFollowNodes.push(newNode);
    }

    // move the position of the first node to the top left
    maxXY.x -= 300;
    // afterwards alternate between moving left and up
    let leftOrUp = false;

    // Add FollowNode {$} (Part of Follow set for S')
    // Also add it's group node, since that one should display
    // F_epsilon. If all nodes added by the user were Follow
    // group nodes, that would be nicer.
    const dollarGroupNodeId = getFollowNodeId();

    const dollarGroupNode: Node<NodeData> = {
      id: dollarGroupNodeId,
      type: "group",
      position: {
        x: maxXY.x,
        y: maxXY.y,
      },
      deletable: false,
      data: {
        name: "Fε(SCC({$}))",
        empty: false,
        color: NodeColor.none,
      },
    };

    const dollarNode: Node<NodeData> = {
      id: getFollowNodeId(),
      type: "follow",
      position: {
        x: 140,
        y: 130,
      },
      parentNode: dollarGroupNodeId,
      extent: "parent",
      expandParent: true,
      deletable: false,
      data: {
        name: "Fε({$})",
        empty: false,
        color: NodeColor.none,
      },
    };

    newFollowNodes.push(dollarGroupNode);
    newFollowNodes.push(dollarNode);

    // Add new FollowNode for all Nonterminals (these will not be for F_epsilon
    // but for Follow_1. These are the nodes the user has to connect and group)
    for (const nonterminal of nonTerminals) {
      // move the position of the next node
      maxXY.x -= leftOrUp ? 150 : 0;
      maxXY.y -= leftOrUp ? 0 : 150;
      leftOrUp = !leftOrUp;
      const position = {
        x: maxXY.x,
        y: maxXY.y,
      };

      const newNode: Node<NodeData> = {
        id: getFollowNodeId(),
        type: "follow",
        position,
        deletable: false,
        data: {
          name: "Follow(" + nonterminal.name + ")",
          empty: nonterminal.empty,
          color: nonterminal.empty ? NodeColor.older : NodeColor.none,
        },
      };
      newFollowNodes.push(newNode);
    }

    // Add Edge {$} -> S' (Part of Follow set for S')
    const sourceNode: Node<NodeData> = dollarNode;
    const targetNode: Node<NodeData> | undefined = newFollowNodes.find(
      (n) => n.data.name === "Follow(" + startSymbol.name + ")",
    );
    if (!targetNode) {
      if (import.meta.env.DEV) {
        console.error(
          "Error Code 5d1a2e: Start symbol not found among newFollowNodes!",
          newFollowNodes,
        );
      }
      showSnackbar(
        "Error Code 5d1a2e: Please contact the developer!",
        "error",
        true,
      );
      return false;
    }
    const newEdge: Edge<EdgeData> = {
      id: getFollowEdgeId(),
      type: "floating",
      source: sourceNode.id,
      target: targetNode.id,
      sourceNode,
      targetNode,
      deletable: false,
      data: {
        pathType: EdgePathType.Straight,
        isGroupEdge: false,
        name: sourceNode.data.name + "->" + targetNode.data.name,
      },
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        orient: "auto",
        color: NodeColor.none,
      },
      style: {
        strokeWidth: 2,
        stroke: NodeColor.none,
      },
    };
    newFollowEdges.push(newEdge);

    // Add all FirstNode edges as FollowNode edges (we need F_epsilon again)
    for (const firstEdge of firstEdges) {
      // we only care about the edges between the group nodes
      // but we need them for the SCC algorithm so we hide them
      const hidden = firstEdge.data?.isGroupEdge !== true;

      const sourceNode: Node<NodeData> | undefined = newFollowNodes.find(
        (n) => n.data.name === "Fε(" + firstEdge.sourceNode?.data.name + ")",
      );
      const targetNode: Node<NodeData> | undefined = newFollowNodes.find(
        (n) => n.data.name === "Fε(" + firstEdge.targetNode?.data.name + ")",
      );
      if (!sourceNode || !targetNode) {
        if (import.meta.env.DEV) {
          console.error(
            "Error Code 75123b: FirstNode not found among newFollowNodes!",
            firstEdge,
            newFollowNodes,
          );
        }
        showSnackbar(
          "Error Code 75123b: Please contact the developer!",
          "error",
          true,
        );
        return false;
      }

      const newEdge: Edge<EdgeData> = {
        id: getFollowEdgeId(),
        type: "floating",
        source: sourceNode.id,
        target: targetNode.id,
        sourceNode,
        targetNode,
        deletable: false,
        hidden,
        data: {
          pathType: EdgePathType.Straight,
          isGroupEdge: true,
          name: sourceNode.data.name + "->" + targetNode.data.name,
        },
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          orient: "auto",
          color: NodeColor.none,
        },
        style: {
          strokeWidth: 2,
          stroke: NodeColor.none,
        },
      };

      newFollowEdges.push(newEdge);
    }

    if (import.meta.env.DEV) {
      console.log("firstNodes", firstNodes);
      console.log("firstEdges", firstEdges);
      console.log("newFollowNodes", newFollowNodes);
      console.log("newFollowEdges", newFollowEdges);
    }

    prepareFollowMap(newFollowNodes);

    setFollowNodes(newFollowNodes);
    setFollowEdges(newFollowEdges);

    // above we set expandParent to true, so that groupnodes automatically
    // expant to fit their children
    // This is not something we usually want, so we set it back to false after
    // the page (hopefully) has loaded
    // setExpandFollowParent(false);
    setTimeout(() => {
      setExpandFollowParent(false);
    }, 1000);

    return true;
  };

  // Set up the follow set map.
  // Required for the reactflow nodes to keep track of their follow set.
  const prepareFollowMap = (newFollowNodes: Node<NodeData>[]) => {
    if (import.meta.env.DEV) {
      console.log("Preparing follow set map...");
    }

    // A mapping from the id of a FirstNode to the equivalent FollowNode
    const firstToFollowGroupNodeMap = new Map<string, string>(
      firstNodes
        .filter((n) => n.type === "group")
        .map((n) => {
          const firstName = "Fε(" + n.data.name + ")";
          const followNode = newFollowNodes.find(
            (n) => n.data.name === firstName,
          );
          if (!followNode) {
            if (import.meta.env.DEV) {
              console.error(
                "Error Code 4fc921: FirstNode not found among followNodes!",
                firstName,
                newFollowNodes,
              );
            }
            showSnackbar(
              "Error Code 4fc921: Please contact the developer!",
              "error",
              true,
            );
            return ["", ""];
          }
          return [n.id, followNode.id];
        }),
    );

    // Prepare the follow set map by copying the first set map with the
    // FollowNodes equivalent ids

    // 1. create a FollowAlgorithmNodeMap for each groupnode
    const newFollowNodeMap = new Map<string, FollowAlgorithmNodeMap>(
      newFollowNodes
        .filter((n) => n.type === "group")
        .map((n) => [
          n.id,
          {
            active: false,
            incomingFollow: new Map<string, string[] | undefined>(),
            // The only new GroupNode we have at this point is the one for the
            // {$} SCC. Since we copy the sets from the FirstNode map, we need
            // to add $ to the follow set of the {$} SCC manually.
            follow: new Set<string>(
              [...firstToFollowGroupNodeMap.values()].some((v) => v === n.id)
                ? []
                : ["$"],
            ),
          },
        ]),
    );

    // 2. copy the map from the FirstNodeMap
    for (const [id, nodeMap] of firstNodeMap.entries()) {
      const newId = firstToFollowGroupNodeMap.get(id);
      if (!newId) {
        if (import.meta.env.DEV) {
          console.error(
            "Error Code 68e1b4: FirstNode not found among followNodes!",
            id,
            firstToFollowGroupNodeMap,
          );
        }
        showSnackbar(
          "Error Code 68e1b4: Please contact the developer!",
          "error",
          true,
        );
        return false;
      }

      // We need to update the incomingFirst map to use the equivalent ids
      const newIncomingFollow = new Map<string, string[] | undefined>();
      for (const [id, follow] of nodeMap.incomingFirst.entries()) {
        const newId = firstToFollowGroupNodeMap.get(id);
        if (!newId) {
          if (import.meta.env.DEV) {
            console.error(
              "Error Code dc38ed: FirstNode not found among followNodes!",
              id,
              firstToFollowGroupNodeMap,
            );
          }
          showSnackbar(
            "Error Code dc38ed: Please contact the developer!",
            "error",
            true,
          );
          return false;
        }
        newIncomingFollow.set(newId, follow);
      }

      const newNodeMap: FollowAlgorithmNodeMap = {
        active: nodeMap.active,
        incomingFollow: newIncomingFollow,
        follow: nodeMap.first,
      };

      newFollowNodeMap.set(newId, newNodeMap);
    }

    if (import.meta.env.DEV) {
      console.log("newFollowNodeMap", newFollowNodeMap);
    }

    setFollowNodeMap(newFollowNodeMap);
  };

  // Update the follow set map after the user has finished the set up step.
  const updateFollowMap = () => {
    if (preparedFollowMap) {
      if (import.meta.env.DEV) {
        console.log("Follow set map is already prepared!");
      }
      setFollowNodeEdgesHidden(true);
      return true;
    } else {
      if (import.meta.env.DEV) {
        console.log("Preparing follow set map...");
      }
      setPreparedFollowMap(true);
    }

    // reset the follow set algorithm
    setFinishedFollow(false);
    // hide the edges of the FollowNodes (we only need edges between sccs)
    setFollowNodeEdgesHidden(true);

    // Update the follow set map
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

    return true;
  };

  // Functions that are invoked when changing between pages
  // Indexed by current page - minimum page (=0)
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
      case 9: // page 8 <- (9)
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
        return (cb) => {
          if (emptySetupComplete) {
            return cb();
          } else {
            showSnackbar(
              "Please finish building the dependency graph!",
              "error",
              true,
            );
            return false;
          }
        };
      case 4: // page (4) -> 5
        return (cb) => {
          if (finishedEmpty) {
            return cb();
          } else {
            showSnackbar(
              "Please finish the empty attribute algorithm!",
              "error",
              true,
            );
            return false;
          }
        };
      case 5: // page (5) -> 6
        return (cb) => {
          if (firstSetupComplete) {
            return cb();
          } else {
            showSnackbar(
              "Please finish building the dependency graph!",
              "error",
              true,
            );
            return false;
          }
        };
      case 6: // page (6) -> 7
        return (cb) => {
          if (finishedFirst) {
            return cb();
          } else {
            showSnackbar(
              "Please finish the first set algorithm!",
              "error",
              true,
            );
            return false;
          }
        };
      case 7: // page (7) -> 8
        return (cb) => {
          if (followSetupComplete) {
            return cb();
          } else {
            showSnackbar(
              "Please finish building the dependency graph!",
              "error",
              true,
            );
            return false;
          }
        };
      case 8: // page (8) -> 9
        return (cb) => {
          if (finishedFollow) {
            return cb();
          } else {
            showSnackbar(
              "Please finish the follow set algorithm!",
              "error",
              true,
            );
            return false;
          }
        };
      case 9: // page (9) -> 10, should never happen
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
        return () => {
          return true;
        };
      case 5: // page (5) <- 6
        return () => {
          setFirstNodeEdgesHidden(false);
          return true;
        };
      case 6: // page (6) <- 7
        return () => {
          return true;
        };
      case 7: // page (7) <- 8
        return () => {
          setFollowNodeEdgesHidden(false);
          return true;
        };
      case 8: // page (8) <- 9
        return () => {
          return true;
        };
      case 9: // page (9) <- 10, should never happen
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
        return () => {
          return prepareEmptyAlgorithm();
        };
      case 5: // page 4 -> (5)
        return () => {
          return prepareFirstAlgorithm();
        };
      case 6: // page 5 -> (6)
        return () => {
          return prepareFirstMap();
        };
      case 7: // page 6 -> (7)
        return () => {
          return prepareFollowAlgorithm();
        };
      case 8: // page 7 -> (8)
        return () => {
          return updateFollowMap();
        };
      case 9: // page 8 -> (9)
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
      // open tutorial dialog if necessary
      if (settings.tutorial && page + 1 >= tutorialPage) {
        setTutorialOpen(true);
        // page+2 since nextPage() does not change the value of page in here
        setTutorialPage(page + 2);
        // after completing the tutorial, disable it
        if (maxPage === page + 1) {
          setSettings({
            ...settings,
            tutorial: false,
          });
        }
      }
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
          // TODO: fix padding, don't forget to change ProgressDrawerComponent, too
          // 1. not centered (weird on small screens because buttons below are)
          className="mr-3 sm:mr-5"
          // 2. centered (weird on big screen, looks not centered?)
          // className="mr-3 sm:mr-5 ml-[-8px]"
          // 3. centered on small, but not on big screen (xl)
          // className="mr-3 sm:mr-5 ml-[-8px] xl:ml-[-12px]"
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
            className="my-1 box-content min-w-5 xs:my-0 xs:ml-1 sm:ml-0 sm:box-border sm:min-w-16 [&>.MuiButton-startIcon]:mx-0 sm:[&>.MuiButton-startIcon]:ml-[-4px] sm:[&>.MuiButton-startIcon]:mr-2"
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
            className="ml-1 mr-1 box-content min-w-5 xs:mr-0 sm:ml-2 sm:box-border sm:min-w-16 [&>.MuiButton-endIcon]:mx-0 sm:[&>.MuiButton-endIcon]:ml-2 sm:[&>.MuiButton-endIcon]:mr-[-4px]"
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
