import React, { useCallback, useEffect, useState } from "react";
import useTranscribe from "./hooks/useTranscribe";
import { Box, Button, Card, CardContent, Divider } from "@mui/material";

function App() {
  const { start, stop, transcript, translatedScript } = useTranscribe();
  const [transcribing, setTranscribing] = useState(false);

  const openWindow = useCallback(() => {
    window.open(document.location.href, "", "width=max,height=100");
  }, []);

  return (
    <>
      <Box
        sx={{
          display: "flex",
          gap: 2,
          m: 2,
        }}
      >
        <Button
          variant="contained"
          disabled={transcribing}
          onClick={() => {
            setTranscribing(true);
            start();
          }}
        >
          Start
        </Button>
        <Button
          variant="contained"
          disabled={!transcribing}
          onClick={() => {
            setTranscribing(false);
            stop();
          }}
        >
          Stop
        </Button>

        <Button
          variant="contained"
          onClick={() => {
            openWindow();
          }}
        >
          New Window
        </Button>
      </Box>

      <Box sx={{ m: 2, display: "flex", flexDirection: "column-reverse" }}>
        {transcript.map((t, idx) => (
          <Card key={idx}>
            <CardContent>{t}</CardContent>
            <Divider></Divider>
            <CardContent>{translatedScript[idx]}</CardContent>
          </Card>
        ))}
      </Box>
    </>
  );
}

export default App;
