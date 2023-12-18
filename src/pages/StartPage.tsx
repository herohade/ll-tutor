import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import InfoIcon from "@mui/icons-material/Info";

import { Dispatch, SetStateAction } from "react";

import useBoundStore from "../store/store";
import { shallow } from "zustand/shallow";

import { ScrollableDialogComponent } from "../components";

import { NavigationSlice } from "../types";

interface Props {
  setTutorialOpen: Dispatch<SetStateAction<boolean>>;
}

/*
This is the first page of the webtutor.
It is displayed when the user opens the webtutor.
It contains a short introduction of the webtutor.
*/
function StartPage({ setTutorialOpen }: Props) {
  const selector = (state: NavigationSlice) => ({
    // NavigationSlice
    tutorialPage: state.tutorialPage,
    setTutorialPage: state.setTutorialPage,
  });
  const {
    // NavigationSlice
    tutorialPage,
    setTutorialPage,
  } = useBoundStore(selector, shallow);

  if (tutorialPage === 0 && localStorage.getItem("settings") === null) {
    setTutorialOpen(true);
    setTutorialPage(1);
  }
  return (
    <Box
      className="flex h-full flex-col"
      sx={{
        flexGrow: 1,
      }}
    >
      <Typography variant="h1">LL Tutor</Typography>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={{ xs: 1, sm: 2 }}
        className="self-center pb-1"
      >
        <ScrollableDialogComponent
          DisplayButton={(props) => (
            <Button
              variant="contained"
              color="info"
              endIcon={<InfoIcon />}
              aria-label="info"
              {...props}
            >
              What is LL Tutor?
            </Button>
          )}
          title={"What is LL Tutor?"}
          content={
            'LL Tutor is a webtutor for the lecture "Compiler Construction" at the Technical University of Munich.'
          }
        />
      </Stack>

      {window.innerWidth < window.innerHeight && (
        <Typography variant="body1" className="my-auto opacity-50">
          Consider using landscape mode for the best experience!
        </Typography>
      )}
    </Box>
  );
}

export default StartPage;
