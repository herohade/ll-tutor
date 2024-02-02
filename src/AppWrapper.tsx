import { createTheme, ThemeProvider } from "@mui/material/styles";
import { indigo, pink } from "@mui/material/colors";
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

/**
 * Top level component that wraps the {@link App}.
 * It provides basic styling, theme settings, and
 * the snackbar.
 *
 * @returns The top level component that wraps the App.
 */
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

  const theme = useMemo(() => {
    const userMode =
      colorScheme === "system"
        ? prefersLightMode
          ? "light"
          : "dark"
        : colorScheme;

    return createTheme({
      palette: {
        mode: userMode,
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
        first: {
          selected: userMode === "light" ? indigo.A200 : indigo.A100,
          charging: userMode === "light" ? pink.A200 : pink.A100,
          contrastText: userMode === "light" ? "#fff" : "rgba(0, 0, 0, 0.87)",
          disabledText:
            userMode === "light"
              ? "rgba(255, 255, 255, 0.6)"
              : "rgba(0, 0, 0, 0.26)",
          hover: indigo.A700,
        },
        follow: {
          selected: userMode === "light" ? indigo.A200 : indigo.A100,
          charging: userMode === "light" ? pink.A200 : pink.A100,
          contrastText: userMode === "light" ? "#fff" : "rgba(0, 0, 0, 0.87)",
          disabledText:
            userMode === "light"
              ? "rgba(255, 255, 255, 0.6)"
              : "rgba(0, 0, 0, 0.26)",
          hover: indigo.A700,
        },
      },
      // // The default background for GroupNodes is transparent.
      // // This makes the background non-transparent.
      // components: {
      //   MuiCssBaseline: {
      //     styleOverrides: (theme) => `
      //       .react-flow__node-group {
      //         background-color: ${theme.palette.background.paper};
      //         }
      //       `,
      //   },
      // },
    });
  }, [colorScheme, prefersLightMode]);

  // The CssBaseline component ensures that the MUI default styles
  // are applied to the entire page.
  const cssBaseline = <CssBaseline />;

  const app = <App />;

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        {cssBaseline}
        <SnackbarProvider
          autoHideDuration={settings.snackbarDuration}
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
          {app}
        </SnackbarProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
