import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ListItemText from "@mui/material/ListItemText";
import Collapse from "@mui/material/Collapse";
import { SxProps, Theme, styled } from "@mui/material";
import Box from "@mui/material/Box";
import ListItemButton, {
  ListItemButtonProps,
} from "@mui/material/ListItemButton";

import { Dispatch, ReactNode, SetStateAction } from "react";

interface Props {
  expanded: boolean;
  setExpanded: Dispatch<SetStateAction<boolean>>;
  title: ReactNode;
  children: ReactNode;
  sx?: SxProps<Theme>;
}

// This creates a styled version of the MuiListItemButton component
// It is an arrow button (^ or v) that rotates when pressed.
// This indicates wheter the content is expanded or not.
interface ExpandMoreProps extends ListItemButtonProps {
  expand: boolean;
}
const ExpandMore = styled((props: ExpandMoreProps) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { expand, ...other } = props;
  return <ListItemButton {...other} />;
})(({ theme, expand }) => ({
  // by default, the ListItemButton is indistinguishable from normal text
  // (same background color). When changing the background color, we should
  // also adjust hover and focus-visible colors to keep a good contrast
  backgroundColor:
    theme.palette.mode === "dark"
      ? "rgba(255, 255, 255, 0.08)"
      : "rgba(0, 0, 0, 0.04)",
  "&:hover": {
    backgroundColor:
      theme.palette.mode === "dark"
        ? `rgba(255, 255, 255, ${theme.palette.action.activatedOpacity})`
        : `rgba(0, 0, 0, ${theme.palette.action.activatedOpacity})`,
  },
  "&:focus-visible": {
    backgroundColor:
      theme.palette.mode === "dark"
        ? `rgba(255, 255, 255, ${theme.palette.action.activatedOpacity})`
        : `rgba(0, 0, 0, ${theme.palette.action.activatedOpacity})`,
  },
  paddingLeft: theme.spacing(1.5),
  paddingRight: theme.spacing(1.5),
  // make margin bottom ease out a little
  marginBottom: expand ? theme.spacing(1) : 0,
  transition: theme.transitions.create("margin-bottom", {
    duration: theme.transitions.duration.short,
  }),
  // We want the arrow (v) to turn 180 degrees (^) when expanded
  "&>svg": {
    transform: expand ? "rotate(180deg)" : "rotate(0deg)",
    transition: theme.transitions.create("transform", {
      duration: theme.transitions.duration.short,
    }),
  },
}));

/**
 * A component that can be expanded to show more content.
 * 
 * @param expanded - Whether the content is expanded or not
 * @param setExpanded - A function to set the expanded state
 * @param title - The title of the expander
 * @param children - The content to be shown when expanded
 * @param sx - The style of the component
 */
export default function ExpanderComponent({
  expanded,
  setExpanded,
  title,
  children,
  sx,
}: Props) {
  return (
    <Box sx={sx}>
      <ExpandMore
        expand={expanded}
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-label="show more"
      >
        <ListItemText primary={title} />
        <ExpandMoreIcon />
      </ExpandMore>
      <Collapse
        in={expanded}
        timeout="auto"
        unmountOnExit
        sx={{
          px: 2,
        }}
      >
        {children}
      </Collapse>
    </Box>
  );
}
