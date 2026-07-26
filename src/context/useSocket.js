import { useContext } from "react";
import SocketContext from "./socketContextValue";

const useSocket = () => {
  const socketContext = useContext(SocketContext);

  // A missing provider is a programming error. Failing explicitly gives the
  // caller a useful message instead of a later null-property exception.
  if (!socketContext) {
    throw new Error("useSocket must be used inside SocketProvider.");
  }

  return socketContext;
};

export default useSocket;
