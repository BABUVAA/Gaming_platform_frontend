import PropTypes from "prop-types";
import { createContext, useContext, useEffect, useRef, useState } from "react";
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

const getCurrentUserId = () => platformStore.getState().auth?.profile?._id;

const getCurrentTournamentId = () =>
  platformStore.getState().tournament.tournamentId?._id;

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
      return "tournament";
  }
};

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const dispatch = useDispatch();
  const [connected, setConnected] = useState(false);
  const [lastError, setLastError] = useState("");
  const [messages, setMessages] = useState({});

  useEffect(() => {
    // The app shell owns one socket connection. Event handlers read current
    // Redux state on demand instead of reconnecting whenever auth changes.
    const socket = io(import.meta.env.VITE_SERVER_URL, {
      withCredentials: true,
    });

    socketRef.current = socket;

    const handleNewMessage = (newMessage) => {
      // We resolve the active user from the store at event time so incoming
      // socket payloads always compare against fresh auth state.
      const currentUserId = getCurrentUserId();
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

      // Personal messages from another user also keep the chat roster warm.
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

    const handleTournamentUpdate = (updatedTournament) => {
      // Every live tournament event is normalized through one reducer path so
      // list screens and detail screens stay consistent.
      const foundCategory = getTournamentCategory(updatedTournament);
      if (!foundCategory) {
        console.warn("Tournament doesn't match any updateable category.");
        return;
      }

      dispatch(
        tournamentAction.addTournament({
          category: foundCategory,
          tournament: updatedTournament,
        })
      );
    };

    const onConnect = () => {
      setConnected(true);
      setLastError("");
    };

    const onDisconnect = () => {
      setConnected(false);
    };

    const onConnectError = (error) => {
      setConnected(false);
      setLastError(error?.message || "Unable to connect to live services.");
    };

    const onTournamentJoin = (data) => {
      if (!data?.tournament) return;

      dispatch(authAction.addJoinedTournament(data.tournament));

      // If the user is already inspecting this tournament, patch the detail
      // view immediately instead of waiting for another fetch cycle.
      if (getCurrentTournamentId() === data.tournament._id) {
        dispatch(tournamentAction.updateTournamentById(data.tournament));
      }
    };

    const onNotification = (notification) => {
      dispatch(
        showToast({
          message: notification?.title || "New notification received.",
          type: types.SUCCESS,
          position: "bottom-right",
        })
      );
      dispatch(notificationActions.addNotification(notification));
    };

    const onError = (data) => {
      const fallbackMessage = "A live update failed to process.";
      dispatch(
        showToast({
          message: data?.message || fallbackMessage,
          type: types.DANGER,
          position: "bottom-right",
        })
      );
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("clan_message", handleNewMessage);
    socket.on("personal_message", handleNewMessage);
    socket.on("newTournament", handleTournamentUpdate);
    socket.on("updateTournament", handleTournamentUpdate);
    socket.on("TOURNAMENT_JOIN_SUCCESS", onTournamentJoin);
    socket.on("JOINED_TOURNAMENT_UPDATE", onTournamentJoin);
    socket.on("notification", onNotification);
    socket.on("ERROR", onError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("clan_message", handleNewMessage);
      socket.off("personal_message", handleNewMessage);
      socket.off("newTournament", handleTournamentUpdate);
      socket.off("updateTournament", handleTournamentUpdate);
      socket.off("TOURNAMENT_JOIN_SUCCESS", onTournamentJoin);
      socket.off("JOINED_TOURNAMENT_UPDATE", onTournamentJoin);
      socket.off("notification", onNotification);
      socket.off("ERROR", onError);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [dispatch]);

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

SocketProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useSocket = () => useContext(SocketContext);
