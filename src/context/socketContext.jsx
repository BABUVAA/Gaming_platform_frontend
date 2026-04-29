import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { useDispatch } from "react-redux";
import { io } from "socket.io-client";
import { tournamentAction } from "../store/tournamentSlice";
import { showToast, types } from "../store/toastSlice";
import { authAction } from "../store/authSlice";
import { notificationActions } from "../store/notificationSlice";
import platformStore from "../store";

const getMessageSignature = (message = {}, fallbackIndex = 0) =>
  message?._id ||
  [
    message?.senderId || "unknown",
    message?.receiverId || message?.clanId || message?.chatId || "thread",
    message?.message || "",
    String(message?.timestamp || message?.createdAt || ""),
    fallbackIndex,
  ].join("::");

const appendUniqueMessage = (messageList = [], newMessage) => {
  const existingSignatures = new Set(
    messageList.map((entry, index) => getMessageSignature(entry, index))
  );
  const newSignature = getMessageSignature(newMessage, messageList.length);

  if (existingSignatures.has(newSignature)) {
    return messageList;
  }

  return [...messageList, newMessage];
};

// Create a Context for the Socket
const SocketContext = createContext();

// SocketProvider component
export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const dispatch = useDispatch();
  const [connected, setConnected] = useState(false);
  const [lastError, setLastError] = useState("");
  const [messages, setMessages] = useState({}); // Store messages per chatId

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(import.meta.env.VITE_SERVER_URL, {
      withCredentials: true,
    });

    socketRef.current.on("connect", () => {
      setConnected(true);
      setLastError("");
    });

    socketRef.current.on("disconnect", () => {
      setConnected(false);
    });

    socketRef.current.on("connect_error", (error) => {
      setConnected(false);
      setLastError(error?.message || "Unable to connect to live services.");
    });

    // Listen for messages from both clan and private chats
    socketRef.current.on("clan_message", (newMessage) => {
      handleNewMessage(newMessage);
    });

    socketRef.current.on("personal_message", (newMessage) => {
      handleNewMessage(newMessage);
    });

    // ✅ Listen for live new tournament updates
    socketRef.current.on("newTournament", (updatedTournament) => {
      handleTournamentUpdate(updatedTournament);
    });

    // ✅ Listen for live tournament updates
    socketRef.current.on("updateTournament", (updatedTournament) => {
      handleTournamentUpdate(updatedTournament);
    });

    // Listen for Tournament Join
    socketRef.current.on("TOURNAMENT_JOIN_SUCCESS", (data) => {
      if (data.tournament) {
        // ✅ Update tournament in auth profile
        dispatch(authAction.addJoinedTournament(data.tournament));
      }
    });
    // Listen for Joined Tournament
    socketRef.current.on("JOINED_TOURNAMENT_UPDATE", (data) => {
      if (data.tournament) {
        // ✅ Update tournament in auth profile
        dispatch(authAction.addJoinedTournament(data.tournament));

        // ✅ Access current state
        const state = platformStore.getState(); // make sure store is imported
        const currentTournament = state.tournament.tournamentId;

        // ✅ Dispatch only if ids match
        if (currentTournament?._id === data.tournament._id) {
          dispatch(tournamentAction.updateTournamentById(data.tournament));
        }
      }
    });

    // ✅ Listen for real-time notifications
    socketRef.current.on("notification", (notification) => {
      dispatch(
        showToast({
          message: notification.title,
          type: types.SUCCESS,
          position: "bottom-right",
        })
      );

      // Optionally: store notification in Redux state
      dispatch(notificationActions.addNotification(notification));
    });

    // Listen for live ERROR updates
    socketRef.current.on("ERROR", (data) => {
      const fallbackMessage = "A live update failed to process.";
      dispatch(
        showToast({
          message: data?.message || fallbackMessage,
          type: types.DANGER,
          position: "bottom-right",
        })
      );
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  // Function to handle messages and store them separately for each chat
  const handleNewMessage = (newMessage) => {
    const currentUserId = platformStore.getState().auth?.profile?._id;
    const chatId =
      newMessage?.chatId ||
      newMessage?.clanId ||
      (newMessage?.receiverId && newMessage?.senderId && currentUserId
        ? newMessage.senderId === currentUserId
          ? newMessage.receiverId
          : newMessage.senderId
        : null) ||
      newMessage?.receiverId ||
      newMessage?.senderId;

    if (!chatId) return;

    if (
      newMessage?.receiverId &&
      newMessage?.senderId &&
      currentUserId &&
      newMessage.senderId !== currentUserId
    ) {
      dispatch(
        authAction.upsertActiveChat({
          userId: newMessage.senderId,
          username: newMessage.senderName || "Player",
        })
      );
    }

    setMessages((prev) => ({
      ...prev,
      [chatId]: appendUniqueMessage(prev[chatId] || [], newMessage),
    }));
  };

  // Function to find tournament Category
  const getTournamentCategory = (tournament) => {
    if (tournament.isFeatured) return "featuredTournaments";

    switch (tournament.status) {
      case "registration_open":
        return "activeTournaments";
      case "upcoming":
        return "upcomingTournaments";
      case "completed":
        return "pastTournaments";
      default:
        return "tournament"; // Optional: skip other statuses like "completed"
    }
  };

  // ✅ Function to handle real-time tournament updates
  const handleTournamentUpdate = (updatedTournament) => {
    // 🧠 Usage
    const foundCategory = getTournamentCategory(updatedTournament);
    if (!foundCategory) {
      console.warn("Tournament doesn't match any updateable category.");
      return;
    }
    // Dispatch updated tournament to the correct category
    dispatch(
      tournamentAction.addTournament({
        category: foundCategory,
        tournament: updatedTournament,
      })
    );
  };

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        connected,
        lastError,
        messages,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to use socket context
export const useSocket = () => useContext(SocketContext);
