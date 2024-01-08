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

interface Props {
  setTutorialOpen: Dispatch<SetStateAction<boolean>>;
}
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

const steps: { label: string; content: JSX.Element[] }[] = [
  {
    label: "Select Grammar",
    content: [
      <>{"Enter a production of form A -> α."}</>,
      <>{"Select the start symbol from the nonterminals."}</>,
    ],
  },
  {
    label: "Calculate Empty Attributes",
    content: [
      <>{"Set up the dependency graph for calculating the empty sets."}</>,
      <>{"Propagate the empty attribute through the dependency graph."}</>,
    ],
  },
  {
    label: "Calculate First Sets",
    content: [
      <>
        {"Model the "}F<sub>ε</sub>
        {
          "-set inequality system as a graph."
        }
      </>,
      <>
        {"Propagate the "}F<sub>ε</sub>
        {"-sets through the dependency graph."}
      </>,
    ],
  },
  { label: "Calculate Follow Sets", content: [<>{"TODO"}</>, <>{"TODO"}</>] },
];

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
          // change the Task description (StepContent) between the two pages.
          // We exclude the StartPage (page 0) from this calculation (page - 1).
          activeStep={(page - 1) >> 1}
          orientation="vertical"
          // TODO: fix padding, don't forget to change HeaderComponent, too
          // 1. not centered (weird on small screens because buttons below are)
          className="pl-3 pt-3 sm:pl-5 sm:pt-5"
          // 2. centered (weird on big screen, looks not centered?)
          // className="pl-[15.6px] pt-3 sm:pl-[23.6px] sm:pt-5"
          // 3. centered on small, but not on big screen (xl)
          // className="pl-[15.6px] pt-3 sm:pl-[23.6px] sm:pt-5 xl:pl-5"
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
