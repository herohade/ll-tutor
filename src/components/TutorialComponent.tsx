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
} from "react";

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

const ariaTitles = [
  // page 0
  "TODO",
  // page 1
  "TODO",
  // page 2
  "TODO",
  // page 3
  "TODO",
  // page 4
  "TODO",
  // page 5
  "TODO",
  // page 6
  "TODO",
  // page 7
  "TODO",
  // page 8
  "TODO",
];
const ariaDescriptions = [
  // page 0
  "TODO",
  // page 1
  "TODO",
  // page 2
  "TODO",
  // page 3
  "TODO",
  // page 4
  "TODO",
  // page 5
  "TODO",
  // page 6
  "TODO",
  // page 7
  "TODO",
  // page 8
  "TODO",
];
const titles = [
  // page 0
  "Tutorial",
  // page 1
  "Grammar",
  // page 2
  "Start symbol",
  // page 3
  "Empty Attributes",
  // page 4
  "Empty Attributes",
  // page 5
  "First Attributes",
  // page 6
  "TODO",
  // page 7
  "TODO",
  // page 8
  "TODO",
];
const contents = [
  // page 0
  "It seems you are new to this app. For your convenience, there will be short explanations when you work through each page of the app. You can toggle this feature on and off in the settings. To dismiss this dialog, click the close button or click outside of this dialog.",
  // page 1
  "In this app, you will be guided through the steps of constructing a look-ahead table for an LL(1) grammar. You will be able to deepen your understanding of the algorithms you have learned in class. We will start by defining the production rules of a grammar. Type in production rules in the text field below. A production must be of form A->α, where the nonterminal A is a single uppercase letter and α is a string of terminals and nonterminals. The allowed characters are 0123456789 and abcdefghijklmnopqrstuvwxyz and ABCDEFGHIJKLMNOPQRSTUVWXYZ and !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~ (notice that space is not allowed).",
  // page 2
  "To finish defining the grammar, we must specify which nonterminal will be our grammar's entry point. The production S' -> <entry point>, where S' is the start symbol, will be added automatically. Please select the entry point by clicking on the nonterminal of your choice.",
  // page 3
  "To visualize the grammar's empty attributes, we will set up a simplified dependency graph. The graph nodes are the (non-)terminals of the grammar. There is an edge from B to A if there is a production A -> αBβ, where α and β are strings of terminals and nonterminals, A is a single nonterminal, and B can be either a terminal, a nonterminal, or ε. Start by adding a node for each (non-)terminal of the grammar. Then, add an edge from B to A if there is a production A -> αBβ. To add nodes, click on the bottommost plus icon on the graph canvas. You can add an edge by clicking on and holding the outer area of the source node. Then, drag the arrow to the center of your target node. You can remove a node or an edge by clicking on it and pressing the backspace key. To clear the graph, press the 'reset graph' button. Once you are done, click the 'check graph' button.",
  // page 4
  "Now, we will apply a fixpoint algorithm to compute the empty attributes of the grammar. The algorithm will be applied to the grammar's production rules on the left in conjunction with the dependency graph we have set up. We will repeat the following steps until no more changes are made to the graph: For each not-yet-empty production, we check if the entire right side is marked as empty. Empty symbols and productions will automatically be colored blue. All nonterminals A for which we find a production A -> α, where α is an empty right side, are now deemed empty. To mark them as such, we must press the corresponding button in the graph to the right. After correctly toggling all newly empty nonterminals in the graph, we proceed to the next iteration by pressing the 'check step' button. Once we reach an iteration where we cannot find any new button to toggle, we will toggle the 'fixpoint reached' switch on the left side instead. If you are unsure about the changes made to the graph, you can always reset the current step by pressing the 'reset step' button. The node's colors will change depending on whether the nonterminal is empty, newly identified as such in the last iteration, or if it was known to be empty for longer. Empty nonterminals will be colored blue, with a lighter shade the more recent they are. Nonterminals that are not empty will remain their original color. This color coding helps you track the progress of the fixpoint algorithm and find the relevant nonterminals at each step of the process.",
  // page 5
  "To calculate the first sets of the grammar, we will use the algorithm from the lecture. In this step, we will set up a dependency graph representing the first set inequality system and group the terminals and nonterminals into strongly connected components, indicating they have the same first sets. For your convenience, the graph already contains all (non-)terminal nodes, only requiring you to connect and group them. To add group nodes, click the bottommost plus icon on the graph canvas. To detach a node from its group node, select the node and press the 'detach' button. To detach all nodes from a group, click the group node and press 'ungroup'. To delete a group node, press 'delete'. This will also automatically ungroup any nodes remaining in the selected group node. Nodes can be added to a group node by dragging and dropping them onto a group node. You can add an edge by clicking on and holding the outer area of the source node. Then, drag the arrow to the center of your target node. TODO: explain how exactly the algorithm works.",
  // page 6
  "TODO",
  // page 7
  "TODO",
  // page 8
  "TODO",
];

export default function TutorialComponent({ page, open, setOpen }: Props) {
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
      keepMounted
      onClose={handleClose}
      scroll={"paper"}
      TransitionComponent={Transition}
      aria-labelledby={ariaTitles[page]}
      aria-describedby={ariaDescriptions[page]}
    >
      <DialogTitle id={"Tutorial " + titles[page]}>{titles[page]}</DialogTitle>
      <DialogContent dividers={true}>
        <DialogContentText
          id={"Tutorial " + titles[page] + " content"}
          tabIndex={-1}
        >
          {contents[page]}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button ref={descriptionElementRef} onClick={handleClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
