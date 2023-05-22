import React, { useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import useTranscribe from "./hooks/useTranscribe";

function App() {
  const { start, stop, transcript, translatedScript } = useTranscribe();
  const [transcribing, setTranscribing] = useState(false);

  return (
    <div className="App">
      <header className="App-header">
        <div>
          {transcript.map((t) => (
            <ul>
              <li>{t}</li>
            </ul>
          ))}
        </div>
        <div>
          {translatedScript.map((t) => (
            <ul>
              <li>{t}</li>
            </ul>
          ))}
        </div>
        <button
          disabled={transcribing}
          onClick={() => {
            setTranscribing(true);
            start();
          }}
        >
          Start
        </button>
        <button
          disabled={!transcribing}
          onClick={() => {
            setTranscribing(false);
            stop();
          }}
        >
          Stop
        </button>
      </header>
    </div>
  );
}

export default App;
