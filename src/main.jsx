import React from "react";
import { createRoot } from "react-dom/client";
import AppProvider from "./app/AppProvider";
import "./styles/index.css";

// This is the frontend entry point. We mount one top-level app provider
// that assembles routing, global state, persistence, and other app-wide layers.
// StrictMode only affects development and helps surface unsafe side effects
// early by stress-testing render and effect behavior.
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppProvider />
  </React.StrictMode>
);
