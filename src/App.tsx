import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import StyledEngineProvider from "@mui/material/StyledEngineProvider";
import useMediaQuery from "@mui/material/useMediaQuery";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { SnackbarProvider, closeSnackbar } from "notistack";
import { useMemo } from "react";
import { shallow } from "zustand/shallow";
import { StartPage } from "./pages";
import { HeaderComponent, ProgressDrawerComponent } from "./components";
import { NavigationSlice } from "./types";
import useBoundStore from "./store/store";
import ReadGrammarPage from "./pages/ReadGrammarPage";

export default function App() {
  const selector = (state: NavigationSlice) => ({
    // NavigationSlice
    page: state.page,
  });
  const {
    // NavigationSlice
    page,
  } = useBoundStore(selector, shallow);

  const prefersLightMode = useMediaQuery("(prefers-color-scheme: light)");

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersLightMode ? "light" : "dark",
        },
      }),
    [prefersLightMode],
  );

  let content;
  switch (page) {
    case 0:
      content = <StartPage />;
      break;
    case 1:
      content = <ReadGrammarPage />;
      break;
    default:
      content = (
        <>
          <div className="mr-1 h-full w-1/3 overflow-scroll rounded-lg border-2 border-solid bg-red-600 bg-gradient-to-b from-green-600 p-2 text-left hover:from-green-400 hover:to-green-600">
            <Typography variant="h4" component="h1" gutterBottom>
              Error:
            </Typography>
          </div>
          <div className="h-full w-2/3 rounded-lg border-2 border-solid bg-green-600 bg-gradient-to-b from-red-600 p-2 hover:from-red-400 hover:to-red-600">
            <Typography variant="h4" component="h1" gutterBottom>
              Page {page} not found
            </Typography>
          </div>
        </>
      );
      break;
  }

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <Box sx={{ display: "flex" }}>
          <CssBaseline />{" "}
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
            <HeaderComponent />
            <ProgressDrawerComponent />
            <Box
              component="main"
              className="hs-screen flex flex-col"
              sx={{
                flexGrow: 1,
                overflow: "auto",
              }}
            >
              <Toolbar />
              <Container className="my-4 flex flex-grow">{content}</Container>
            </Box>
          </SnackbarProvider>
        </Box>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
