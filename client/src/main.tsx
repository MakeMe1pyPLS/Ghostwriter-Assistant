import { createRoot } from "react-dom/client";
import React from "react";
import App from "./App";
import { installApiBaseRewrite } from "./lib/api";
import { initTheme } from "./lib/theme";
import "./index.css";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

installApiBaseRewrite();
initTheme();

createRoot(document.getElementById("root")!).render(<App />);
