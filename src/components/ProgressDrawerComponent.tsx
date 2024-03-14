import { styled } from "@mui/material/styles";
import MuiDrawer from "@mui/material/Drawer";
import Stepper from "@mui/material/Stepper";
import StepLabel from "@mui/material/StepLabel";
import Step from "@mui/material/Step";
import StepContent from "@mui/material/StepContent";
import Typography from "@mui/material/Typography";
import Toolbar from "@mui/material/Toolbar";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import SettingsIcon from "@mui/icons-material/Settings";
import InfoIcon from "@mui/icons-material/Info";

import { shallow } from "zustand/shallow";
import useBoundStore from "../store/store";

import { Dispatch, SetStateAction } from "react";

import { SettingsComponent } from ".";

import { NavigationSlice } from "../types";

/**
 * The props for the {@link ProgressDrawerComponent} component
 * 
 * @param setTutorialOpen - The react state setter function for the tutorial open state, needed as the help button top open it is in the progress bar
 */
export interface Props {
  setTutorialOpen: Dispatch<SetStateAction<boolean>>;
}

// how big the drawer (=progress bar) is when open, in px
const drawerWidth: number = 240;

// This creates a styled version of the MuiDrawer component
// that can shrink and expand, and has a transition animation for it
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

// The step's names and their description displayed by the progress
// bar when expanded
const steps: { label: string; content: JSX.Element[] }[] = [
  {
    label: "Select Grammar",
    content: [
      <>{"Enter a production of form A -> 𝛼."}</>,
      <>{"Select the start symbol from the nonterminals."}</>,
    ],
  },
  {
    label: "Compute Empty Attributes",
    content: [
      <>{"Set up the dependency graph for computing the empty sets."}</>,
      <>{"Propagate the empty attribute through the dependency graph."}</>,
    ],
  },
  {
    label: "Compute First Sets",
    content: [
      <>
        {"Model the "}F<sub>ε</sub>
        {"-set inequality system as a graph."}
      </>,
      <>
        {"Propagate the "}F<sub>ε</sub>
        {"-sets through the dependency graph."}
      </>,
    ],
  },
  {
    label: "Compute Follow Sets",
    content: [
      <>{"Model the Follow-set inequality system as a graph."}</>,
      <>{"Propagate the Follow-sets through the dependency graph."}</>,
    ],
  },
];

/**
 * The progress bar (drawer) that shows the current progress of the user
 * 
 * @param setTutorialOpen - The react state setter function for the tutorial open state, needed as the help button top open it is in the progress bar
 */
function ProgressDrawerComponent({ setTutorialOpen }: Props) {
  const selector = (state: NavigationSlice) => ({
    // NavigationSlice
    page: state.page,
    open: state.open,
    toggleOpen: state.toggleOpen,
  });
  const { page, open, toggleOpen } = useBoundStore(selector, shallow);
  return (
    <Drawer variant="permanent" className="h-dvh" open={open}>
      <div className="flex h-full flex-col overflow-auto">
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
          // change the Task description (StepContent) every the two pages.
          // We exclude the StartPage (page 0) from this computation (page - 1).
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
                  <Typography className="w-[186.4px] whitespace-normal text-start sm:w-[178.4px]">
                    {content[(page - 1) % 2]}
                  </Typography>
                </StepContent>
              )}
            </Step>
          ))}
        </Stepper>
      </div>
      <Stack direction="column" spacing={{ xs: 1, md: 2 }} className="m-2">
        <Button
          variant="contained"
          color="info"
          className="min-w-0"
          aria-label="help"
          onClick={() => setTutorialOpen(true)}
        >
          <Typography sx={{ display: open ? "block" : "none" }}>
            Help
          </Typography>
          <InfoIcon
            sx={{
              ml: open ? 1 : 0,
              mr: open ? -0.5 : 0,
            }}
          />
        </Button>
        <SettingsComponent
          DisplayButton={(props) => (
            <Button
              variant="contained"
              className="min-w-0"
              aria-label="settings"
              {...props}
            >
              <Typography sx={{ display: open ? "block" : "none" }}>
                Settings
              </Typography>
              <SettingsIcon
                sx={{
                  ml: open ? 1 : 0,
                  mr: open ? -0.5 : 0,
                }}
              />
            </Button>
          )}
        />
      </Stack>
    </Drawer>
  );
}

export default ProgressDrawerComponent;
