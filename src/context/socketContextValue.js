import { createContext } from "react";

// The raw context is isolated from the provider and consumer hook so Fast
// Refresh can treat the provider module as component-only.
const SocketContext = createContext(null);

export default SocketContext;
