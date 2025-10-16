import React, { useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { ThemeProvider, createTheme, CssBaseline, IconButton } from "@mui/material";
import { Brightness4, Brightness7 } from "@mui/icons-material";

const ThemedApp = () => {
  const [mode, setMode] = useState("light");

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === "dark"
            ? {
                background: { default: "#0e1117", paper: "#1b1f27" },
              }
            : {
                background: { default: "#f5f7fa", paper: "#ffffff" },
              }),
        },
      }),
    [mode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "1rem" }}>
        <IconButton onClick={() => setMode(mode === "light" ? "dark" : "light")}>
          {mode === "light" ? <Brightness4 /> : <Brightness7 />}
        </IconButton>
      </div>
      <App />
    </ThemeProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemedApp />
  </React.StrictMode>
);
