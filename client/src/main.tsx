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

// On the homepage the static hero from index.html is already on screen, so render
// as a transition: React splits the first render into short slices instead of one
// long task. Elsewhere render straight away.
const root = createRoot(document.getElementById("root")!);
if ((window as any).__ciqShell) startTransition(() => root.render(<App />));
else root.render(<App />);
