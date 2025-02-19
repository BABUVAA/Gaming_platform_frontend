// src/context/SocketContext.js
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { io } from "socket.io-client";

// Create a Context for the Socket
const SocketContext = createContext();

// SocketProvider component to provide the socket instance and connection status
export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null); // Store socket instance in useRef
  const [connected, setConnected] = useState(false); // Track connection status

  useEffect(() => {
    // Initialize socket connection on mount
    socketRef.current = io(import.meta.env.VITE_SERVER_URL, {
      withCredentials: true,
    });

    socketRef.current.on("connect", () => {
      setConnected(true);
      console.log("Connected to socket server ");
    });

    socketRef.current.on("disconnect", () => {
      setConnected(false);
      console.log("Disconnected from socket server");
    });

    // Cleanup: Disconnect socket on unmount
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to use socket context in other components
export const useSocket = () => useContext(SocketContext);
