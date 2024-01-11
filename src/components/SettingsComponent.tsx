import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Button from "@mui/material/Button";
import Dialog, { DialogProps } from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Zoom from "@mui/material/Zoom";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import SettingsBrightnessIcon from "@mui/icons-material/SettingsBrightness";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import { TransitionProps } from "@mui/material/transitions";

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

interface Props {
  DisplayButton: React.FC<{ onClick: () => void }>;
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

  const [oldSettings, setOldSettings] = useState(settings);

  const handleClickOpen = (scrollType: DialogProps["scroll"]) => () => {
    setOpen(true);
    setScroll(scrollType);
  };

  const handleClickTutorial = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({
      ...settings,
      tutorial: event.target.checked,
    });
    setTutorialPage(page + 1);
  };

  const handleClose = (keepChanges: boolean) => {
    if (keepChanges) {
      setOldSettings(settings);
    } else {
      setSettings(oldSettings);
    }
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
