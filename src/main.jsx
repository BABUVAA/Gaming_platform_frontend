import { createRoot } from "react-dom/client";
import AppProvider from "./app/AppProvider";
import "./styles/index.css";

createRoot(document.getElementById("root")).render(<AppProvider />);
