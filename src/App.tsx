import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import StyledEngineProvider from "@mui/material/StyledEngineProvider";
import useMediaQuery from "@mui/material/useMediaQuery";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Toolbar from "@mui/material/Toolbar";
import { useMemo } from "react";
import { shallow } from "zustand/shallow";
import { StartPage } from "./pages";
import { HeaderComponent, ProgressDrawerComponent } from "./components";
import { EmptyNodeSlice, NavigationSlice } from "./types";
import useBoundStore from "./store/store";

export default function App() {
  const selector = (state: NavigationSlice & EmptyNodeSlice) => ({
    // NavigationSlice
    minPage: state.minPage,
    maxPage: state.maxPage,
    page: state.page,
    open: state.open,
    toggleOpen: state.toggleOpen,
    // EmptyNodeSlice
    emptyNodeTypes: state.emptyNodeTypes,
    emptyEdgeTypes: state.emptyEdgeTypes,
    emptyNodes: state.emptyNodes,
    emptyEdges: state.emptyEdges,
    setEmptyNodes: state.setEmptyNodes,
    setEmptyEdges: state.setEmptyEdges,
    onEmptyNodesChange: state.onEmptyNodesChange,
    onEmptyEdgesChange: state.onEmptyEdgesChange,
    onEmptyConnect: state.onEmptyConnect,
  });
  const {
    minPage,
    maxPage,
    page,
    open,
    emptyNodeTypes,
    emptyEdgeTypes,
    emptyNodes,
    emptyEdges,
    toggleOpen,
    setEmptyNodes,
    setEmptyEdges,
    onEmptyNodesChange,
    onEmptyEdgesChange,
    onEmptyConnect,
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
    case 1:
      content = <StartPage />;
      break;
    default:
      content = (
        <>
          <div className="h-full w-1/3 bg-red-600 bg-gradient-to-b from-green-600">
            <Typography variant="h4" component="h1" gutterBottom>
              Error:
            </Typography>
          </div>
          <div className="h-full w-2/3 bg-green-600 bg-gradient-to-b from-red-600">
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
          <CssBaseline />
          <HeaderComponent />
          <ProgressDrawerComponent />
          <Box
            component="main"
            className="flex h-screen flex-col"
            sx={{
              flexGrow: 1,
              overflow: "auto",
            }}
          >
            <Toolbar />
            <Container className="my-4 flex flex-grow">{content}</Container>
          </Box>
        </Box>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
