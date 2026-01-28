import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ThemeProvider } from "./ui-lib/context/ThemeContext";
import { AliasProvider } from "./context/AliasContext";

// Initialize Apollo Mock Engine
// import "./mock/apollo-mock";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AliasProvider>
        <App />
      </AliasProvider>
    </ThemeProvider>
  </StrictMode>
);
