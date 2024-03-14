import Zoom from "@mui/material/Zoom";
import Button from "@mui/material/Button";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import Dialog, { DialogProps } from "@mui/material/Dialog";
import { TransitionProps } from "@mui/material/transitions";

import {
  JSXElementConstructor,
  forwardRef,
  useEffect,
  useRef,
  useState,
} from "react";

/**
 * The props for the {@link ScrollableDialogComponent} component.
 * 
 * @param DisplayButton - The button that opens the dialog.
 * @param title - The title of the dialog.
 * @param content - The content of the dialog.
 * @param ariaTitle - The title of the dialog for screen readers. (Default: title)
 * @param ariaDescription - The description of the dialog for screen readers. (Default: undefined)
 */
export interface Props {
  DisplayButton: React.FC<{ onClick: () => void }>;
  title: string;
  content: JSX.Element;
  ariaTitle?: string;
  ariaDescription?: string;
}

// This is a custom Transition component that uses lets something
// appear by zooming in on it (= it gets larger)
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

/**
 * A dialog that can be opened by clicking a button.
 * 
 * @remarks
 * 
 * When opening the dialog, the content pops up in the center of the screen by zooming in.
 * 
 * @param DisplayButton - The button that opens the dialog.
 * @param title - The title of the dialog.
 * @param content - The content of the dialog.
 * @param ariaTitle - The title of the dialog for screen readers. (Default: title)
 * @param ariaDescription - The description of the dialog for screen readers. (Default: undefined)
 */
export default function ScrollableDialogComponent({
  DisplayButton,
  title,
  content,
  ariaTitle,
  ariaDescription,
}: Props) {
  const [open, setOpen] = useState(false);
  const [scroll, setScroll] = useState<DialogProps["scroll"]>("paper");

  /**
   * This function opens the dialog.
   * It also accepts a {@link DialogProps | scrollType}, which can be "paper", "body" or undefined.
   * 
   * @remarks
   * 
   * The scrollType determines how the dialog container looks.
   * 
   * @privateremarks
   * 
   * Currently only paper is ever used, so we could technically remove this.
   */
  const handleClickOpen = (scrollType: DialogProps["scroll"]) => () => {
    setOpen(true);
    setScroll(scrollType);
  };

  const handleClose = () => {
    setOpen(false);
  };

  // This is used to move the browser's focus on the dialog when it opens.
  const descriptionElementRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) {
      const { current: descriptionElement } = descriptionElementRef;
      if (descriptionElement !== null) {
        descriptionElement.focus();
      }
    }
  }, [open]);

  if (!ariaTitle) {
    ariaTitle = title;
  }

  return (
    <>
      <DisplayButton onClick={handleClickOpen("paper")} />
      <Dialog
        open={open}
        keepMounted
        onClose={handleClose}
        scroll={scroll}
        TransitionComponent={Transition}
        aria-labelledby={ariaTitle}
        aria-describedby={ariaDescription}
      >
        <DialogTitle id={"scroll-dialog-" + title}>{title}</DialogTitle>
        <DialogContent
          dividers={scroll === "paper"}
          tabIndex={-1}
          sx={{
            whiteSpace: "pre-line",
          }}
        >
          {content}
        </DialogContent>
        <DialogActions>
          <Button ref={descriptionElementRef} onClick={handleClose}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
