import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { useDispatch } from "react-redux";
import { io } from "socket.io-client";
import { updateTournament } from "../store/tournamentSlice";

// Create a Context for the Socket
const SocketContext = createContext();

// SocketProvider component
export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const dispatch = useDispatch();
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState({}); // Store messages per chatId
  const [tournament, setTournament] = useState([]); // Store live tournament data
  console.log(tournament);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(import.meta.env.VITE_SERVER_URL, {
      withCredentials: true,
    });

    socketRef.current.on("connect", () => {
      setConnected(true);
      console.log("✅ Connected to socket server");
    });

    socketRef.current.on("disconnect", () => {
      setConnected(false);
      console.log("❌ Disconnected from socket server");
    });

    // Listen for messages from both clan and private chats
    socketRef.current.on("clan_message", (newMessage) => {
      handleNewMessage(newMessage);
    });

    socketRef.current.on("personal_message", (newMessage) => {
      handleNewMessage(newMessage);
    });

    // ✅ Listen for live tournament updates
    socketRef.current.on("newTournament", (updatedTournament) => {
      handleTournamentUpdate(updatedTournament);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  // Function to handle messages and store them separately for each chat
  const handleNewMessage = (newMessage) => {
    setMessages((prev) => ({
      ...prev,
      [newMessage.chatId]: [...(prev[newMessage.chatId] || []), newMessage],
    }));
  };

  // ✅ Function to handle real-time tournament updates
  const handleTournamentUpdate = (updatedTournament) => {
    setTournament((prev) => [...prev, updatedTournament]);
  };

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        connected,
        messages,
        tournament,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to use socket context
export const useSocket = () => useContext(SocketContext);
