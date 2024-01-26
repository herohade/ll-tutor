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

interface Props {
  DisplayButton: React.FC<{ onClick: () => void }>;
  title: string;
  content: JSX.Element;
  ariaTitle?: string;
  ariaDescription?: string;
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

export default function ScrollableDialogComponent({
  DisplayButton,
  title,
  content,
  ariaTitle,
  ariaDescription,
}: Props) {
  const [open, setOpen] = useState(false);
  const [scroll, setScroll] = useState<DialogProps["scroll"]>("paper");

  const handleClickOpen = (scrollType: DialogProps["scroll"]) => () => {
    setOpen(true);
    setScroll(scrollType);
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
