import { createRoot } from "react-dom/client";
import React, { startTransition } from "react";
import App from "./App";
import { installApiBaseRewrite } from "./lib/api";
import { initTheme } from "./lib/theme";
import "./index.css";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

installApiBaseRewrite();
initTheme();

// Render as a transition so React splits the first render into small slices
// instead of one long task; the static hero in index.html is on screen meanwhile.
const root = createRoot(document.getElementById("root")!);
startTransition(() => root.render(<App />));
