import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import InfoIcon from "@mui/icons-material/Info";
import DialogContentText from "@mui/material/DialogContentText";

import TUMLogo from "../assets/TUMLogo.svg";

import { ScrollableDialogComponent } from "../components";

/*
This is the first page of the webtutor.
It is displayed when the user opens the webtutor.
It contains a short introduction of the webtutor.
*/
function StartPage() {
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
            <>
              <img
                src={TUMLogo}
                alt="LL Tutor Logo"
                style={{
                  height: "4rem",
                  display: "block",
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
              />
              <DialogContentText
                id={"scroll-dialog-What-is-LL-Tutor-description"}
              >
                <br />
                The LL Tutor is a webtutor developed for the course Compiler
                Construction at the chair I2 of the TUM School of Computation,
                Information and Technology at the Technical University of
                Munich. In this app, you will be guided through the steps of
                constructing a look-ahead table for an LL(1) grammar.
                <br />
                <br />
                In case you found any bug, please report it to{" "}
                <a href={`mailto:${import.meta.env.VITE_CONTACT_EMAIL}`}>
                  {import.meta.env.VITE_CONTACT_NAME}
                </a>
                .
              </DialogContentText>
            </>
          }
        />
      </Stack>

      <Typography variant="body1" className="mt-auto opacity-50 sm:hidden">
        Consider using landscape mode for the best experience!
      </Typography>
    </Box>
  );
}

export default StartPage;
