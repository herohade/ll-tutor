import { styled } from "@mui/material/styles";
import MuiDrawer from "@mui/material/Drawer";
import Stepper from "@mui/material/Stepper";
import StepLabel from "@mui/material/StepLabel";
import Step from "@mui/material/Step";
import StepContent from "@mui/material/StepContent";
import Tyoography from "@mui/material/Typography";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import { shallow } from "zustand/shallow";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
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

const steps: { label: string; content: string }[] = [
  { label: "Select Grammar", content: "Select Grammar" },
  {
    label: "Calculate Empty Attributes",
    content: "Calculate Empty Attributes",
  },
  { label: "Calculate First Sets", content: "Calculate First Sets" },
  { label: "Calculate Follow Sets", content: "Calculate Follow Sets" },
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
      <Stepper activeStep={page} orientation="vertical">
        {steps.map(({ label, content }, index) => (
          <Step key={label + index}>
            <StepLabel>{label}</StepLabel>
            <StepContent>
              <Tyoography>{content}</Tyoography>
            </StepContent>
          </Step>
        ))}
      </Stepper>
    </Drawer>
  );
}

export default ProgressDrawerComponent;
