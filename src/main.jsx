import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AppProvider from "./components/common/AppProvider";
// import "./styles/GlobalStyle.css";
import "./styles/index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppProvider />
  </StrictMode>
);
