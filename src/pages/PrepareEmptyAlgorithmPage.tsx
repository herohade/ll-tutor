import { Edge, MarkerType, Node } from "reactflow";

import { VariantType, useSnackbar } from "notistack";

import {
  EdgeData,
  EdgePathType,
  EmptyNodeSlice,
  GrammarSlice,
  NodeColor,
  NodeData,
} from "../types";

import useBoundStore from "../store/store";
import { shallow } from "zustand/shallow";

type Props = {
  graphCanvas: JSX.Element;
};

/*
This is the fourth page of the webtutor.
The user adds the nodes and edges to the graph to model
the dependency graph for the empty set calculation.
*/
function PrepareEmptyAlgorithmPage({ graphCanvas }: Props) {
  const grammarSelector = (state: GrammarSlice) => ({
    epsilon: state.epsilon,
    productions: state.productions,
    nonTerminals: state.nonTerminals,
    terminals: state.terminals,
  });
  const { epsilon, productions, nonTerminals, terminals } = useBoundStore(
    grammarSelector,
    shallow,
  );

  const emptyNodeSelector = (state: EmptyNodeSlice) => ({
    emptySetupComplete: state.emptySetupComplete,
    emptyNodes: state.emptyNodes,
    emptyEdges: state.emptyEdges,
    getEmptyNodeId: state.getEmptyNodeId,
    getEmptyEdgeId: state.getEmptyEdgeId,
    setEmptySetupComplete: state.setEmptySetupComplete,
    setEmptyNodes: state.setEmptyNodes,
    setEmptyEdges: state.setEmptyEdges,
    toggleEmptyDeletableAndConnectable:
      state.toggleEmptyDeletableAndConnectable,
  });
  const {
    emptySetupComplete,
    emptyNodes,
    emptyEdges,
    getEmptyNodeId,
    getEmptyEdgeId,
    setEmptySetupComplete,
    setEmptyNodes,
    setEmptyEdges,
    toggleEmptyDeletableAndConnectable,
  } = useBoundStore(emptyNodeSelector, shallow);

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

  const checkGraph = () => {
    // for (const nonTerminal of newNonTerminals) {
    //   newNodes.push({
    //     id: getEmptyNodeId(),
    //     type: "empty",
    //     data: {
    //       name: nonTerminal.name,
    //       changed: true,
    //       empty: nonTerminal.empty,
    //       color: nonTerminal.empty ? NodeColor.lastTurn : NodeColor.none,
    //     },
    //     position: { x: 0, y: 0 },
    //   });
    // }
    // for (const terminal of newTerminals) {
    //   newNodes.push({
    //     id: getEmptyNodeId(),
    //     type: "empty",
    //     data: {
    //       name: terminal.name,
    //       changed: true,
    //       empty: terminal.empty,
    //       color: terminal.empty ? NodeColor.lastTurn : NodeColor.none,
    //     },
    //     position: { x: 0, y: 0 },
    //   });
    // }
    // newNodes.push({
    //   id: getEmptyNodeId(),
    //   type: "empty",
    //   data: {
    //     name: epsilon.name,
    //     changed: true,
    //     empty: epsilon.empty,
    //     color: epsilon.empty ? NodeColor.lastTurn : NodeColor.none,
    //   },
    //   position: { x: 0, y: 0 },
    // });

    // for (const production of newProductions) {
    //   for (const symbol of production.rightSide) {
    //     const edgeId = symbol.name + "->" + production.leftSide.name;
    //     if (!newEdges.some((e) => e.id === edgeId)) {
    //       newEdges.push({
    //         id: getEmptyEdgeId(),
    //         source: sourceId,
    //         target: targetId,
    //         ...and much more
    //       });
    //     }
    //   }
    // }
    const nodeMap = new Map<string, boolean>();
    for (const node of emptyNodes) {
      if (nodeMap.has(node.data.name)) {
        // node exists multiple times
        if (import.meta.env.DEV) {
          console.error("Node exists multiple times", node);
        }
        showSnackbar(
          "Node " + node.data.name + " exists multiple times!",
          "error",
          true,
        );
        return false;
      } else {
        nodeMap.set(node.data.name, false);
      }
    }
    const symbols =
      epsilon.references > 0
        ? [epsilon, ...terminals, ...nonTerminals]
        : [...terminals, ...nonTerminals];
    for (const printable of symbols) {
      const entry = nodeMap.get(printable.name);
      if (entry === undefined) {
        // printable does not exist in node list
        if (import.meta.env.DEV) {
          console.error("Printable does not exist in node list", printable);
        }
        showSnackbar(printable.name + " has no node!", "error", true);
        return false;
      } else {
        if (entry) {
          // printable exists multiple times
          // this should not be possible
          if (import.meta.env.DEV) {
            console.error(
              "Error Code 30f30a: Node is already accounted for",
              printable,
            );
            showSnackbar(
              "Error Code 30f30a: Please contact the developer!",
              "error",
              true,
            );
            return false;
          }
        } else {
          nodeMap.set(printable.name, true);
        }
      }
    }
    const unnecessaryNode = [...nodeMap].find(([, value]) => !value);
    if (unnecessaryNode !== undefined) {
      // there are nodes that should not be there
      if (import.meta.env.DEV) {
        console.error("There are nodes that should not be there", nodeMap);
      }
      showSnackbar(unnecessaryNode[0] + " is unnecessary!", "error", true);
      return false;
    }

    const edgeMap = new Map<string, boolean>();
    for (const edge of emptyEdges) {
      if (!edge.data) {
        if (import.meta.env.DEV) {
          console.error("Error Code bb0f8a: Edge has no data", edge);
        }
        showSnackbar(
          "Error Code bb0f8a: Please contact the developer!",
          "error",
          true,
        );
        return false;
      }
      if (edgeMap.has(edge.data.name)) {
        // edge exists multiple times
        if (import.meta.env.DEV) {
          console.error("Edge exists multiple times", edge);
        }
        showSnackbar(
          "Edge " + edge.data.name + " exists multiple times!",
          "error",
          true,
        );
        return false;
      } else {
        edgeMap.set(edge.data.name, false);
      }
    }
    for (const production of productions) {
      for (const symbol of production.rightSide) {
        const edgeName = symbol.name + "->" + production.leftSide.name;
        const entry = edgeMap.get(edgeName);
        if (entry === undefined) {
          // edge does not exist in edge list
          if (import.meta.env.DEV) {
            console.error(
              "Edge does not exist in edge list",
              edgeName,
              edgeMap,
              emptyEdges,
            );
          }
          showSnackbar("Edge " + edgeName + " does not exist!", "error", true);
          return false;
        } else {
          if (!entry) {
            edgeMap.set(edgeName, true);
          }
        }
      }
    }
    const unnecessaryEdge = [...edgeMap].find(([, value]) => !value);
    if (unnecessaryEdge !== undefined) {
      // there are edges that should not be there
      if (import.meta.env.DEV) {
        console.error("There are edges that should not be there", edgeMap);
      }
      showSnackbar(unnecessaryEdge[0] + " is unnecessary!", "error", true);
      return false;
    }

    showSnackbar("Correct, well done!", "success", true);

    return true;
  };

  const solve = () => {
    const newNodes: Node<NodeData>[] = [];
    const newEdges: Edge<EdgeData>[] = [];

    // only add epsilon if we actually need it
    if (epsilon.references > 0) {
      newNodes.push({
        id: getEmptyNodeId(),
        type: "empty",
        data: {
          name: epsilon.name,
          // changed: true,
          changed: false,
          empty: epsilon.empty,
          color: epsilon.empty ? NodeColor.thisTurn : NodeColor.none,
        },
        position: { x: 0, y: 0 },
      });
    }
    for (const nonTerminal of nonTerminals) {
      newNodes.push({
        id: getEmptyNodeId(),
        type: "empty",
        data: {
          name: nonTerminal.name,
          // changed: true,
          changed: false,
          empty: nonTerminal.empty,
          color: nonTerminal.empty ? NodeColor.thisTurn : NodeColor.none,
        },
        position: { x: 0, y: 0 },
      });
    }
    for (const terminal of terminals) {
      newNodes.push({
        id: getEmptyNodeId(),
        type: "empty",
        data: {
          name: terminal.name,
          // changed: true,
          changed: false,
          empty: terminal.empty,
          color: terminal.empty ? NodeColor.thisTurn : NodeColor.none,
        },
        position: { x: 0, y: 0 },
      });
    }

    for (const production of productions) {
      for (const symbol of production.rightSide) {
        const edgeName = symbol.name + "->" + production.leftSide.name;
        if (!newEdges.some((e) => e.data?.name === edgeName)) {
          const source = newNodes.find((n) => n.data.name === symbol.name);
          const target = newNodes.find(
            (n) => n.data.name === production.leftSide.name,
          );
          if (!source || !target) {
            if (import.meta.env.DEV) {
              console.error("Error Code 8f9a40: Please contact the developer!");
            }
            showSnackbar(
              "Error Code 8f9a40: Please contact the developer!",
              "error",
              true,
            );
            return false;
          }
          newEdges.push({
            id: getEmptyEdgeId(),
            type: "floating",
            source: source.id,
            target: target.id,
            sourceNode: source,
            targetNode: target,
            data: {
              pathType: EdgePathType.Straight,
              isGroupEdge: false,
              name: edgeName,
            },
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              orient: "auto",
              color: symbol.empty ? NodeColor.thisTurn : NodeColor.none,
            },
            style: {
              strokeWidth: 2,
              stroke: symbol.empty ? NodeColor.thisTurn : NodeColor.none,
            },
          });
        }
      }
    }

    setEmptyNodes(newNodes);
    setEmptyEdges(newEdges);
    // TODO: automatically layout the graph
    // This probably requires a rewrite of utils/elk.ts (useLayoutedElements)
  };

  return (
    <>
      {/* left side, task description and information */}
      <div className="mr-1 h-full w-1/3 overflow-scroll rounded-lg border-2 border-solid p-2 text-left">
        <div className="grammarDiv">
          <p>
            <span>
              <b>Task: </b>
            </span>
            Set up the dependency graph for calculating the empty sets of the
            grammar.
          </p>
          <p>The Nonterminals of the grammar are:</p>
          <ul className="nonterminalList">
            {nonTerminals.map((nonterminal, index) => (
              <li key={index}>
                {nonterminal.representation}
                {import.meta.env.DEV && " " + nonterminal.references}
              </li>
            ))}
          </ul>
          <p>The Terminals of the grammar are:</p>
          <ul className="terminalList">
            {terminals.map((terminal, index) => (
              <li key={index}>
                {terminal.representation}
                {import.meta.env.DEV && " " + terminal.references}
              </li>
            ))}
          </ul>
          <p>The Productions of the grammar are:</p>
          <ul className="productionList">
            {productions.map((production, index) => (
              <li key={index}>
                {production.numberedRepresentation()}
                {import.meta.env.DEV && " " + production.references}
              </li>
            ))}
          </ul>
          <div className="workspaceButtons fixpointInputLabelMargin">
            <button
              onClick={() => {
                if (checkGraph()) {
                  toggleEmptyDeletableAndConnectable(false, false);
                  setEmptySetupComplete(true);
                }
              }}
              disabled={emptySetupComplete}
            >
              Check Graph
            </button>
            <button
              onClick={() => {
                solve();
              }}
              disabled={emptySetupComplete}
            >
              Show Solution
            </button>
            <button
              onClick={() => {
                showSnackbar(
                  "This feature is not yet implemented!",
                  "warning",
                  true,
                );
              }}
              disabled={emptySetupComplete}
              className="dangerousButton"
            >
              Reset Canvas
            </button>
          </div>
        </div>
      </div>
      {/* right side, reactflow canvas */}
      <div className="h-full w-2/3 rounded-lg border-2 border-solid p-2">
        {graphCanvas}
      </div>
    </>
    // <>
    //   <div className="workspace">
    //     <div className="leftSide">
    //       <div className="grammarDiv">
    //         <p>
    //           <span>
    //             <b>Task: </b>
    //           </span>
    //           Set up the dependency graph for calculating the empty sets of the
    //           grammar.
    //         </p>
    //         <p>The Nonterminals of the grammar are:</p>
    //         <ul className="nonterminalList">
    //           {nonTerminals.map((nonterminal, index) => (
    //             <li key={index}>
    //               {nonterminal.representation}
    //               {import.meta.env.DEV && " " + nonterminal.references}
    //             </li>
    //           ))}
    //         </ul>
    //         <p>The Terminals of the grammar are:</p>
    //         <ul className="terminalList">
    //           {terminals.map((terminal, index) => (
    //             <li key={index}>
    //               {terminal.representation}
    //               {import.meta.env.DEV && " " + terminal.references}
    //             </li>
    //           ))}
    //         </ul>
    //         <p>The Productions of the grammar are:</p>
    //         <ul className="productionList">
    //           {productions.map((production, index) => (
    //             <li key={index}>
    //               {production.numberedRepresentation()}
    //               {import.meta.env.DEV && " " + production.references}
    //             </li>
    //           ))}
    //         </ul>
    //       </div>
    //     </div>
    //     <div className="rightSide">{graphCanvas}</div>
    //     <div className="workspaceButtons fixpointInputLabelMargin">
    //       <button
    //         onClick={() => {
    //           if (checkGraph()) {
    //             toggleEmptyDeletableAndConnectable(false, false);
    //             setEmptySetupComplete(true);
    //           }
    //         }}
    //         disabled={emptySetupComplete}
    //       >
    //         Check Graph
    //       </button>
    //       <button
    //         onClick={() => {
    //           solve();
    //         }}
    //         disabled={emptySetupComplete}
    //       >
    //         Show Solution
    //       </button>
    //       <button
    //         onClick={() => {
    //           showSnackbar("This feature is not yet implemented!", "warning", true);
    //         }}
    //         disabled={emptySetupComplete}
    //         className="dangerousButton"
    //       >
    //         Reset Canvas
    //       </button>
    //     </div>
    //   </div>
    // </>
  );
}

export default PrepareEmptyAlgorithmPage;
