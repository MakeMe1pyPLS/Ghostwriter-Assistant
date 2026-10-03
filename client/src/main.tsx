import { createRoot } from "react-dom/client";
import React from "react";
import App from "./App";
import { installApiBaseRewrite } from "./lib/api";
import "./index.css";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

installApiBaseRewrite();

createRoot(document.getElementById("root")!).render(<App />);
