import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// biome-ignore lint/style/noRestrictedImports: main.tsx is the app entry point
import { App } from "@/app";
import "@/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
