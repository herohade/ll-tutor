import { styled } from "@mui/material/styles";
import MuiDrawer from "@mui/material/Drawer";
import Stepper from "@mui/material/Stepper";
import StepLabel from "@mui/material/StepLabel";
import Step from "@mui/material/Step";
import StepContent from "@mui/material/StepContent";
import Tyoography from "@mui/material/Typography";
import Toolbar from "@mui/material/Toolbar";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { shallow } from "zustand/shallow";
import useBoundStore from "../store/store";
import { NavigationSlice } from "../types";

const drawerWidth: number = 240;

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  "& .MuiDrawer-paper": {
    position: "relative",
    whiteSpace: "nowrap",
    width: drawerWidth,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    boxSizing: "border-box",
    ...(!open && {
      overflowX: "hidden",
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      width: theme.spacing(7),
      [theme.breakpoints.up("sm")]: {
        width: theme.spacing(9),
      },
    }),
  },
}));

const steps: { label: string; content: string[] }[] = [
  {
    label: "Select Grammar",
    content: [
      "Enter a production of form A -> α.",
      "Select the start symbol from the nonterminals.",
    ],
  },
  {
    label: "Calculate Empty Attributes",
    content: [
      "Set up the dependency graph for calculating the empty sets.",
      "Propagate the empty attribute through the dependency graph.",
    ],
  },
  { label: "Calculate First Sets", content: ["TODO", "TODO"] },
  { label: "Calculate Follow Sets", content: ["TODO", "TODO"] },
];

function ProgressDrawerComponent() {
  const selector = (state: NavigationSlice) => ({
    // NavigationSlice
    page: state.page,
    open: state.open,
    toggleOpen: state.toggleOpen,
  });
  const { page, open, toggleOpen } = useBoundStore(selector, shallow);
  return (
    <Drawer variant="permanent" open={open}>
      <Toolbar
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          px: [1],
        }}
      >
        <IconButton onClick={toggleOpen}>
          <ChevronLeftIcon />
        </IconButton>
      </Toolbar>
      <Divider />
      <Stepper
        // Math.floor(page / 2) is the same as page >> 1. We can do this since
        // there are always two pages per step. So we only need to dynamically
        // change the Task description (StepContent) between the two pages.
        // We exclude the StartPage (page 0) from this calculation (page - 1).
        activeStep={(page - 1) >> 1}
        orientation="vertical"
        className="pl-3 pt-3 sm:pl-5 sm:pt-5"
      >
        {steps.map(({ label, content }, index) => (
          <Step key={label + index}>
            <StepLabel>{open && label}</StepLabel>
            {open && (
              <StepContent>
                {/* Since there is a transition when opening the drawer, the
                width would dynamically change causing the text to constantly
                readjust line-brakes during opening. This can be fixed by
                either auto-wrapping with fixed size (white-space:normal +
                width:...) or by hardcoding line-breaks (white-space:pre).
                Here we chose the former. */}
                <Tyoography className="w-[186.4px] whitespace-normal text-start sm:w-[178.4px]">
                  {content[(page - 1) % 2]}
                </Tyoography>
              </StepContent>
            )}
          </Step>
        ))}
      </Stepper>
    </Drawer>
  );
}

export default ProgressDrawerComponent;
