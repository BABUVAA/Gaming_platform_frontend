import { createRoot } from "react-dom/client";
import { AppProvider } from "./components";
import "./styles/index.css";

createRoot(document.getElementById("root")).render(<AppProvider />);
