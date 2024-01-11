import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Zoom from "@mui/material/Zoom";
import { TransitionProps } from "@mui/material/transitions";

import {
  Dispatch,
  JSXElementConstructor,
  SetStateAction,
  forwardRef,
  useEffect,
  useRef,
  useState,
} from "react";

import { ExpanderComponent } from ".";

interface Props {
  page: number;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<
      unknown,
      string | JSXElementConstructor<unknown>
    >;
  },
  ref: React.Ref<unknown>,
) {
  // return <Slide direction="up" ref={ref} {...props} />;
  return <Zoom ref={ref} {...props} />;
});

type tutorialContent =
  | {
      type: "text";
      content: JSX.Element;
    }
  | {
      type: "collapsible";
      title: string;
      content: JSX.Element;
    };

type tutorialPage = {
  ariaTitle: string;
  ariaDescription: string;
  title: string;
  contents: tutorialContent[];
};

const tutorialPages: tutorialPage[] = [
  // page 0
  {
    ariaTitle: "Help message",
    ariaDescription: "This dialog contains a short introduction to the app.",
    title: "Help",
    contents: [
      {
        type: "text",
        content: (
          <>
            {
              "It seems you are new to this app. For your convenience, there will be short explanations when you work through each page of the app. You can toggle this feature on and off in the settings."
            }
          </>
        ),
      },
      {
        type: "collapsible",
        title: "Help button",
        content: (
          <>
            {
              "If you want to reread the explanations, you can open this dialog at any time by clicking the help button in the lower left corner.\nTo dismiss this dialog, click the close button or click outside of this dialog."
            }
          </>
        ),
      },
    ],
  },
  // page 1
  {
    ariaTitle: "The grammar",
    ariaDescription: "This dialog explains the demands on the grammar.",
    title: "Grammar",
    contents: [
      {
        type: "text",
        content: (
          <>
            {
              "In this app, you will be guided through the steps of constructing a look-ahead table for an LL(1) grammar. You will be able to deepen your understanding of the algorithms you have learned in class. Let's start by defining the production rules of your grammar."
            }
          </>
        ),
      },
      {
        type: "collapsible",
        title: "Your task",
        content: <>{"Type in production rules in the text field below."}</>,
      },
      {
        type: "collapsible",
        title: "Grammar format",
        content: (
          <>
            {
              "The grammar must be in the following format:\n- A production must be of form A->α, where the nonterminal A is a single uppercase letter and α is a string of terminals and nonterminals.\n- You can only add one production at a time (So no A -> α | β)."
            }
          </>
        ),
      },
      {
        type: "collapsible",
        title: "Allowed characters",
        content: (
          <>
            {
              // ascii characters from 33 to 126 except:
              // " "(space), "$" and "|"
              'The allowed characters are:\n- 0123456789\n- abcdefghijklmnopqrstuvwxyz\n- ABCDEFGHIJKLMNOPQRSTUVWXYZ\n- !"#%&\'()*+,-./:;<=>?@[\\]^_`{}~\n(notice that space(" "), "$", and "|" are not allowed as they might be confusing).'
            }
          </>
        ),
      },
    ],
  },
  // page 2
  {
    ariaTitle: "The start symbol",
    ariaDescription: "This dialog explains the demands on the grammar.",
    title: "Start symbol",
    contents: [
      {
        type: "text",
        content: (
          <>
            {"In this step, you will add the start symbol S' to the grammar."}
          </>
        ),
      },
      {
        type: "collapsible",
        title: "Your task",
        content: (
          <>
            {
              "Decide which nonterminal will be the grammar's entry point. The production S' -> <entry point>, where S' is the start symbol, will be added automatically. Please select the entry point by clicking on the nonterminal of your choice."
            }
          </>
        ),
      },
    ],
  },
  // page 3
  {
    ariaTitle: "The empty attributes",
    ariaDescription:
      "This dialog explains the setup of the empty attribute algorithm.",
    title: "Empty Attributes",
    contents: [
      {
        type: "text",
        content: (
          <>
            {
              "To visualize the grammar's empty attributes, you will set up a simplified dependency graph."
            }
          </>
        ),
      },
      {
        type: "collapsible",
        title: "Your task",
        content: (
          <>
            {
              "Start by adding a node for each (non-)terminal of the grammar. Then, add an edge from B to A if there is a production A -> αBβ."
            }
          </>
        ),
      },
      {
        type: "collapsible",
        title: "The dependency graph",
        content: (
          <>
            {
              "- The graph's nodes are the terminals and nonterminals of the grammar, and the empty word ε.\n- There must be an edge from B to A if there exists a production A -> αBβ, where α and β are strings of terminals and nonterminals, A is a single nonterminal, and B can be either a terminal or nonterminal.\n- If A produces the empty word ε, there must be an edge from ε to A."
            }
          </>
        ),
      },
      {
        type: "collapsible",
        title: "Graph interaction",
        content: (
          <>
            {
              "- To add new nodes to the graph, click the bottommost plus icon on the canvas.\n- You can add an edge by clicking on and holding the outer area of the source node. Then, drag the arrow to the center of your target node.\n- You can remove a node or an edge by clicking on it and pressing the backspace key.\n- To delete the whole graph, press the 'reset graph' button.\n- Once you believe your solution to be correct, click the 'check graph' button."
            }
          </>
        ),
      },
    ],
  },
  // page 4
  {
    ariaTitle: "The empty attribute algorithm",
    ariaDescription: "This dialog explains the empty attribute algorithm.",
    title: "Empty Attributes",
    contents: [
      {
        type: "text",
        content: (
          <>
            {
              "Now, you will apply a fixpoint algorithm to compute the empty attributes for the grammar. The algorithm will be applied to the grammar's production rules on the left in conjunction with the dependency graph you have previously set up. You must repeat the steps until no more changes are made to the graph."
            }
          </>
        ),
      },
      {
        type: "collapsible",
        title: "Your task",
        content: (
          <>
            {
              "Repeatedly apply the algorithm by toggling the buttons in the graph, proceeding to the next iteration by pressing the 'check step' button.\nOnce you reach an iteration where you cannot find any new empty nonterminals, toggle the 'fixpoint reached' switch on the left side instead.\nIf you want to dismiss the changes made to the graph, you can always reset the current step by pressing the 'reset step' button."
            }
          </>
        ),
      },
      {
        type: "collapsible",
        title: "The fixpoint algorithm",
        content: (
          <>
            {
              "- For each not-yet-empty production, check if the entire right side is marked as empty. Empty symbols and productions will automatically be colored blue.\n- All not-empty nonterminals A become empty if a production A -> α exists, where α is an empty right side. To mark them as such, you must press the corresponding button in the graph to the right. For example, if you find a production A -> B, with B already marked as empty, you must press the button 'A' in the graph.\n- After correctly toggling all newly empty nonterminals in the graph, proceed to the next iteration step by pressing the 'check step' button.\n- Once you reach an iteration where you cannot find any new button to toggle, toggle the 'fixpoint reached' switch on the left side instead."
            }
          </>
        ),
      },
      {
        type: "collapsible",
        title: "Color coding",
        content: (
          <>
            {
              "- A node's color will change depending on whether the corresponding nonterminal is empty and if it was newly identified as such in the last iteration (making it potentially relevant in the current one) or multiple iterations ago.\n- Empty nonterminals will be colored blue, with a lighter shade the more recent it is.\n- Nonterminals that are not empty will remain their original color.\nThis color coding helps you track the algorithm's progress and find the relevant nodes at each process step."
            }
          </>
        ),
      },
    ],
  },
  // page 5
  {
    ariaTitle: "The first sets",
    ariaDescription:
      "This dialog explains the setup of the first set algorithm.",
    title: "First Sets",
    contents: [
      {
        type: "text",
        content: (
          <>
            {
              "To calculate the first sets of the grammar, you will use the algorithm from the lecture. In this step, you will set up a dependency graph representing the "
            }
            F<sub>ε</sub>
            {
              "-set inequality system and group the terminals and nonterminals into strongly connected components, indicating they have the same "
            }
            F<sub>ε</sub>
            {"-sets."}
          </>
        ),
      },
      {
        type: "collapsible",
        title: "Your task",
        content: (
          <>
            {
              "For your convenience, the graph already contains all terminal and nonterminal nodes, only requiring you to add edges to connect them and nodes to group them."
            }
          </>
        ),
      },
      {
        type: "collapsible",
        title: "The algorithm",
        // TODO
        content: (
          <>
            {
              "TODO\n(Note: While edges from groupnodes to themselves (SCC(1)->SCC(1)) are not necessary, edges from nonterminals to themselves (A->A) are still required.)"
            }
          </>
        ),
      },
      {
        type: "collapsible",
        title: "Graph interaction",
        content: (
          <>
            {
              "- To add group nodes to the graph, click the bottommost plus icon on the canvas.\n- Nodes can be added to a group node by dragging and dropping them onto a group node.\n- Select a node and press the' detach' button to separate a node from its parent (group) node.\n- To detach all nodes from a group at once, click the group node and press 'ungroup'.\n- You can delete a group node by pressing 'delete' - This will also automatically ungroup any nodes remaining in the selected group node.\n- To add an edge, click on and hold the outer area of the source node. Then, drag the arrow to the center of your target node."
            }
          </>
        ),
      },
      {
        type: "collapsible",
        title: "Color coding",
        content: (
          <>
            {
              "Empty nonterminals will be colored blue to help you visualize the inequality system."
            }
          </>
        ),
      },
    ],
  },
  // page 6
  {
    ariaTitle: "The first set algorithm",
    ariaDescription: "This dialog explains how to calculate the first sets.",
    title: "First Sets",
    contents: [
      {
        type: "text",
        content: (
          <>
            {"Now, you will propagate the "}F<sub>ε</sub>
            {"-sets through the graph."}
          </>
        ),
      },
      {
        type: "collapsible",
        title: "Your task",
        content: (
          <>
            {"Propagate the "}F<sub>ε</sub>
            {
              "-sets by toggling the buttons in the graph. Start from the leaf nodes and work up to the root nodes. Remember to press the root node's button as well.\nOnce you believe your solution to be correct, click the 'check graph' button."
            }
          </>
        ),
      },
      {
        type: "collapsible",
        title: "The algorithm",
        content: (
          <>
            {
              "- You must start from the leaf nodes, of which there are two types: A leaf node SCC-{α} - where α is a single terminal - with the "
            }
            F<sub>ε</sub>
            {
              "-set {α}. And a leaf node SCC-A - where A is one or a group of empty nonterminals - with the "
            }
            F<sub>ε</sub>
            {"-set {}. These nodes already have their "}F<sub>ε</sub>
            {"-sets.\n- Toggle a node's button to propagate their "}F
            <sub>ε</sub>
            {
              " set along the outgoing edges to their parents.\n- A parent node becomes toggleable once all children have passed on their "
            }
            F<sub>ε</sub>
            {
              "-sets to it.\n- If you want to dismiss the changes made to the graph, you can always reset it by pressing the 'reset step' button.\n- When you have toggled all root nodes, you have successfully calculated the "
            }
            F<sub>ε</sub>
            {
              "-sets of all Strongly Connected Components and can click the 'check graph' button.\n- All Nonterminals within an SCC will have that same "
            }
            F<sub>ε</sub>
            {"-set. To get the first sets, you would have to add ε to the "}F
            <sub>ε</sub>
            {
              " set of all empty Nonterminals. For non-empty Nonterminals, you would take over the "
            }
            F<sub>ε</sub>
            {"-set. However, this step is not necessary for this app."}
          </>
        ),
      },
      {
        type: "collapsible",
        title: "Color coding",
        content: (
          <>
            {
              // TODO: update colors since they will most likely change
              "- A node's color will change depending on whether all its children have passed on their "
            }
            F<sub>ε</sub>
            {"-sets to it and if it has passed on its "}F<sub>ε</sub>
            {"-set to all its parents.\n- Nodes that have passed on their "}F
            <sub>ε</sub>
            {
              " sets to their parents will be colored blue.\n- Nodes that have not yet passed on their "
            }
            F<sub>ε</sub>
            {"-sets to their parents but have received all "}F<sub>ε</sub>
            {
              "-sets from their children will be colored purple.\n- Nodes that have received some but not all "
            }
            F<sub>ε</sub>
            {
              "-sets from their children will be colored pink.\n- Nodes that have not received any "
            }
            F<sub>ε</sub>
            {"-set from their children will remain their original color."}
          </>
        ),
      },
    ],
  },
  // page 7
  {
    ariaTitle: "TODO",
    ariaDescription: "TODO",
    title: "TODO",
    contents: [
      {
        type: "text",
        content: <>{"TODO"}</>,
      },
    ],
  },
  // page 8
  {
    ariaTitle: "TODO",
    ariaDescription: "TODO",
    title: "TODO",
    contents: [
      {
        type: "text",
        content: <>{"TODO"}</>,
      },
    ],
  },
  // page 9
  {
    ariaTitle: "TODO",
    ariaDescription: "TODO",
    title: "TODO",
    contents: [
      {
        type: "text",
        content: <>{"TODO"}</>,
      },
    ],
  },
];

const collapsibleOpenInit: boolean[][] = tutorialPages.map((page) =>
  new Array(page.contents.length).fill(true),
);

export default function TutorialComponent({ page, open, setOpen }: Props) {
  const [collapsibleOpen, setCollapsibleOpen] = useState(collapsibleOpenInit);

  // A function to map the setState function of bolean[][] to a setState
  // function of boolean for a specific page and index. Required for
  // ExpanderComponent, which needs a boolean as its expanded prop (not
  // a boolean[][])
  // What a mess...
  const setCollapsibleOpenForSpecificPageAndIndex: (
    page: number,
    index: number,
  ) => Dispatch<SetStateAction<boolean>> =
    (page: number, index: number) =>
    (expanded: boolean | ((prevState: boolean) => boolean)) => {
      if (typeof expanded === "boolean") {
        setCollapsibleOpen((prev) =>
          prev.map((p, i) =>
            i === page ? p.map((c, j) => (j === index ? expanded : c)) : p,
          ),
        );
      } else {
        setCollapsibleOpen((prev) =>
          prev.map((p, i) =>
            i === page ? p.map((c, j) => (j === index ? expanded(c) : c)) : p,
          ),
        );
      }
    };

  const handleClose = () => {
    setOpen(false);
  };

  const descriptionElementRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) {
      const { current: descriptionElement } = descriptionElementRef;
      if (descriptionElement !== null) {
        descriptionElement.focus();
      }
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      scroll={"paper"}
      TransitionComponent={Transition}
      aria-labelledby={tutorialPages[page].ariaTitle}
      aria-describedby={tutorialPages[page].ariaDescription}
    >
      <DialogTitle> {tutorialPages[page].title}</DialogTitle>
      <DialogContent tabIndex={-1} dividers={true}>
        {tutorialPages[page].contents.map((c, index) =>
          c.type === "text" ? (
            <DialogContentText
              key={index}
              sx={{
                my: 1,
                whiteSpace: "pre-line",
              }}
            >
              {c.content}
            </DialogContentText>
          ) : (
            <ExpanderComponent
              key={index}
              sx={{
                my: 1,
              }}
              expanded={collapsibleOpen[page][index]}
              setExpanded={setCollapsibleOpenForSpecificPageAndIndex(
                page,
                index,
              )}
              title={
                <DialogContentText
                  sx={{
                    my: "auto",
                  }}
                >
                  {c.title}
                </DialogContentText>
              }
              children={
                <DialogContentText
                  sx={{
                    whiteSpace: "pre-line",
                  }}
                >
                  {c.content}
                </DialogContentText>
              }
            />
          ),
        )}
      </DialogContent>
      <DialogActions>
        <Button ref={descriptionElementRef} onClick={handleClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
