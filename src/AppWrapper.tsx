import { createTheme, ThemeProvider } from "@mui/material/styles";
import { indigo } from "@mui/material/colors";
import CssBaseline from "@mui/material/CssBaseline";
import StyledEngineProvider from "@mui/material/StyledEngineProvider";
import useMediaQuery from "@mui/material/useMediaQuery";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

import { SnackbarProvider, closeSnackbar } from "notistack";

import { useMemo } from "react";

import useBoundStore from "./store/store";
import { shallow } from "zustand/shallow";

import App from "./App";

import { NavigationSlice, NodeColor } from "./types";

// basic css required for react-flow to work
import "reactflow/dist/base.css";

export default function AppWrapper() {
  const selector = (state: NavigationSlice) => ({
    // NavigationSlice
    settings: state.settings,
  });
  const {
    // NavigationSlice
    settings,
  } = useBoundStore(selector, shallow);

  const colorScheme = settings.colorScheme;
  const prefersLightMode = useMediaQuery("(prefers-color-scheme: light)");

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode:
            colorScheme === "system"
              ? prefersLightMode
                ? "light"
                : "dark"
              : colorScheme,
          // primary: {
          //   main: '#3070b3',
          // },
          // secondary: {
          //   main: '#b37430',
          // },
          empty: {
            text: indigo.A400,
            main: NodeColor.none,
            new: NodeColor.thisTurn,
            recent: NodeColor.lastTurn,
            old: NodeColor.older,
          },
        },
      }),
    [colorScheme, prefersLightMode],
  );

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider
          action={(snackbarId) => (
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={() => closeSnackbar(snackbarId)}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        >
          <App />
        </SnackbarProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
