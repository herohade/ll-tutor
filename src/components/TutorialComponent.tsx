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
const contents = [
  // page 0
  "It seems you are new to this app. For your convenience, there will be short explanations when you work through each page of the app. You can toggle this feature on and off in the settings. To dismiss this dialog, click the close button or click outside of this dialog.",
  // page 1
  "In this app, you will be guided through the steps of constructing a lookahead table for an LL(1) grammar. You will be able to deepen your understanding of the algorithms you have learned in class. We will start by defining the production rules of a grammar. Type in production rules in the text field below. A production must be of form A->α, where the nonterminal A is a single uppercase letter and α is a string of terminals and nonterminals. The allowed characters are 0123456789 and abcdefghijklmnopqrstuvwxyz and ABCDEFGHIJKLMNOPQRSTUVWXYZ and !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~ (notice that space is not allowed).",
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

export default function TutorialComponent({ page, open, setOpen }: Props) {
  const handleClose = () => {
    setOpen(false);
  };

  const descriptionElementRef = useRef<HTMLElement>(null);
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
          ref={descriptionElementRef}
          tabIndex={-1}
        >
          {contents[page]}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
