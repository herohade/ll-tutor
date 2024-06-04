import Box from "@mui/material/Box";
import Zoom from "@mui/material/Zoom";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Switch from "@mui/material/Switch";
import Slider from "@mui/material/Slider";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import DialogTitle from "@mui/material/DialogTitle";
import ToggleButton from "@mui/material/ToggleButton";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import Dialog, { DialogProps } from "@mui/material/Dialog";
import { TransitionProps } from "@mui/material/transitions";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import DialogContentText from "@mui/material/DialogContentText";

import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import SettingsBrightnessIcon from "@mui/icons-material/SettingsBrightness";

import {
  JSXElementConstructor,
  forwardRef,
  useEffect,
  useRef,
  useState,
} from "react";

import useBoundStore from "../store/store";
import { shallow } from "zustand/shallow";

import { NavigationSlice } from "../types";

/**
 * The props for the {@link SettingsComponent}.
 * 
 * @param DisplayButton - The button that opens the dialog.
 */
export interface Props {
  DisplayButton: React.FC<{ onClick: () => void }>;
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

// These are the possible values in ms for the snackbar notification duration
const snackbarDurationMarks = [
  { value: 5000, label: "5s" },
  { value: 8000, label: "8s" },
  { value: 11000, label: "11s" },
  // 14000 is the value used to keep a uniform distance between the marks,
  // it is not actually 14s
  { value: 14000, label: "perm" },
];

/**
 * The dialog that contains the settings of the app.
 * 
 * @remarks
 * 
 * The user can change the following settings:
 * - Tutorial: On/Off
 * - Notification Duration: 5s, 8s, 11s, permanent
 * - Color Scheme: Dark, Light, System
 * 
 * The user can also cancel the dialog to restore the old settings.
 * 
 * @param DisplayButton - The button that opens the dialog.
 */
export default function SettingsComponent({ DisplayButton }: Props) {
  const [open, setOpen] = useState(false);
  const [scroll, setScroll] = useState<DialogProps["scroll"]>("paper");
  const selector = (state: NavigationSlice) => ({
    // NavigationSlice
    page: state.page,
    settings: state.settings,
    setSettings: state.setSettings,
    setTutorialPage: state.setTutorialPage,
  });
  const {
    // NavigationSlice
    page,
    settings,
    setSettings,
    setTutorialPage,
  } = useBoundStore(selector, shallow);

  // here we save the settings to restore them if the user cancels the dialog
  const [oldSettings, setOldSettings] = useState(settings);

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

  /**
   * This function toggles the tutorial setting on and off
   * 
   * @remarks
   * 
   * If the tutorial is turned on, it is set to the next page,
   * meaning it will open when the user navigates to the next step.
   * 
   * @param event - The event that triggered the change, includes the new value.
   */
  const handleClickTutorial = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({
      ...settings,
      tutorial: event.target.checked,
    });
    setTutorialPage(page + 1);
  };

  /**
   * This function closes the dialog.
   * 
   * @remarks
   * 
   * If keepChanges is true, the settings are kept.
   * If keepChanges is false, the settings are restored to the old settings.
   * 
   * @param keepChanges - Whether to keep the changes or not.
   */
  const handleClose = (keepChanges: boolean) => {
    if (keepChanges) {
      setOldSettings(settings);
    } else {
      setSettings(oldSettings);
    }
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

  return (
    <>
      <DisplayButton onClick={handleClickOpen("paper")} />
      <Dialog
        open={open}
        keepMounted
        onClose={handleClose}
        scroll={scroll}
        TransitionComponent={Transition}
        aria-labelledby="Settings Dialog"
        aria-describedby="Settings Dialog"
      >
        <DialogTitle id="Settings Dialog Title">Settings</DialogTitle>
        <DialogContent dividers={scroll === "paper"}>
          <DialogContentText id="Settings Dialog Tutorial" tabIndex={-1}>
            Tutorial:
          </DialogContentText>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography>Off</Typography>
            <Switch
              checked={settings.tutorial}
              onChange={handleClickTutorial}
              inputProps={{ "aria-label": "ant design" }}
            />
            <Typography>On</Typography>
          </Stack>
          <Divider
            sx={{
              my: 1,
            }}
          />
          <DialogContentText id="Settings Dialog Notification Duration">
            Notification Duration:
          </DialogContentText>
          <Box
            sx={{
              // The Slider component is stupid and doesn't work with
              // width: "100%" because of the absolute positioning of the
              // labels. So we account for them sticking out by ~10px on
              // both sides with calc.
              width: "calc(100% - 20px)",
              pl: "10px",
            }}
          >
            <Slider
              value={settings.snackbarDuration ||
                    (settings.snackbarDuration === null ? 14000 : 5000)}
              min={5000}
              max={14000}
              marks={snackbarDurationMarks}
              step={null}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => {
                return (
                  snackbarDurationMarks.find((mark) => mark.value === value)
                    ?.label || ""
                );
              }}
              getAriaValueText={(value) => {
                return (
                  snackbarDurationMarks.find((mark) => mark.value === value)
                    ?.label || ""
                );
              }}
              onChange={(_event, newValue) => {
                setSettings({
                  ...settings,
                  snackbarDuration:
                    newValue === 14000 ? null : (newValue as number),
                });
              }}
            />
          </Box>
          <Divider
            sx={{
              my: 1,
            }}
          />
          <DialogContentText id="Settings Dialog Color Scheme">
            Color Scheme:
          </DialogContentText>
          <ToggleButtonGroup
            value={settings.colorScheme}
            exclusive
            onChange={(
              _event: React.MouseEvent<HTMLElement>,
              newColorScheme: "dark" | "light" | "system" | null,
            ) => {
              if (newColorScheme !== null) {
                setSettings({
                  ...settings,
                  colorScheme: newColorScheme,
                });
              }
            }}
            aria-label="Color Scheme"
          >
            <ToggleButton value="dark" aria-label="dark">
              <Typography
                sx={{
                  mr: 0.5,
                  display: { xs: "none", sm: "block" },
                }}
              >
                dark
              </Typography>
              <DarkModeIcon />
            </ToggleButton>
            <ToggleButton value="light" aria-label="light">
              <Typography
                sx={{
                  mr: 0.5,
                  display: { xs: "none", sm: "block" },
                }}
              >
                light
              </Typography>
              <LightModeIcon />
            </ToggleButton>
            <ToggleButton value="system" aria-label="system">
              <Typography
                sx={{
                  mr: 0.5,
                  display: { xs: "none", sm: "block" },
                }}
              >
                system
              </Typography>
              <SettingsBrightnessIcon />
            </ToggleButton>
          </ToggleButtonGroup>
          {/* <Divider
            sx={{
              my: 1,
            }}
          />
          <DialogContentText id="Settings Dialog Language">
            - Language: (not implemented yet)
          </DialogContentText>
          <button
            onClick={() =>
              setSettings({
                ...settings,
                language: "en",
              })
            }
          >
            english
          </button>
          <button
            onClick={() =>
              setSettings({
                ...settings,
                language: "de",
              })
            }
          >
            deutsch
          </button> */}
        </DialogContent>
        <DialogActions>
          <Button
            ref={descriptionElementRef}
            onClick={() => handleClose(false)}
          >
            Cancel
          </Button>
          <Button onClick={() => handleClose(true)}>Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
