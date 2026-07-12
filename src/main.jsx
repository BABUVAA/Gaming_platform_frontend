import { createRoot } from "react-dom/client";
import AppProvider from "./app/AppProvider";
import "./styles/index.css";

// This is the frontend entry point. We mount one top-level app provider
// that assembles routing, global state, persistence, and other app-wide layers.
createRoot(document.getElementById("root")).render(<AppProvider />);
