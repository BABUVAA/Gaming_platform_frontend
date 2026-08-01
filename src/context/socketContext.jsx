import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { io } from "socket.io-client";
import {
  API_BASE_URL,
  refreshAuthentication,
} from "../api/axios-api";
import { sessionInvalidated } from "../store/actions/sessionActions";
import { tournamentAction } from "../store/slices/tournamentSlice";
import { showToast, types } from "../store/slices/toastSlice";
import { playerActions } from "../store/slices/playerSlice";
import { notificationActions } from "../store/slices/notificationSlice";
import {
  clanAction,
  fetchClanJoinRequests,
  fetchUserClan,
} from "../store/slices/clanSlice";
import {
  fetchClanTeams,
  fetchSocialConnections,
} from "../store/slices/socialSlice";
import platformStore from "../store";
import { useAuthStore } from "../store/useStore";
import SocketContext from "./socketContextValue";
import {
  REALTIME_CHANNEL,
  REALTIME_EVENT_TYPES,
  isSupportedRealtimeEvent,
} from "../realtime/eventContracts";

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

const getCurrentUserId = () => {
  const state = platformStore.getState();

  // Summary/auth state is available before the heavier profile request, so
  // socket identity remains usable on every authenticated page.
  return (
    state.player?.profile?._id ||
    state.player?.summary?.userId ||
    state.auth?.user?.userId
  );
};

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const socketRefreshRef = useRef(null);
  const processedRealtimeEventIdsRef = useRef(new Set());
  const domainRefreshTimersRef = useRef(new Map());
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuthStore();
  const [connected, setConnected] = useState(false);
  const [competitionRevision, setCompetitionRevision] = useState(0);
  const [lastError, setLastError] = useState("");
  const [messages, setMessages] = useState({});

  useEffect(() => {
    // Public visitors do not need private chat, notification, or tournament
    // events. Waiting for verified authentication removes unnecessary socket
    // handshakes and prevents anonymous connections from consuming capacity.
    if (!isAuthenticated) {
      socketRef.current = null;
      processedRealtimeEventIdsRef.current.clear();
      setConnected(false);
      setCompetitionRevision(0);
      setLastError("");
      setMessages({});
      return undefined;
    }

    // The app shell owns one authenticated socket connection. Keeping this
    // origin aligned with the API preserves one authenticated backend boundary.
    const socket = io(API_BASE_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    socketRef.current = socket;
    const domainRefreshTimers = domainRefreshTimersRef.current;

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
          playerActions.upsertActiveChat({
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
      dispatch(tournamentAction.upsertTournament(updatedTournament));
    };

    const scheduleDomainRefresh = (domain, thunk) => {
      if (domainRefreshTimers.has(domain)) return;

      // Coalesce event bursts so several rapid mutations produce one focused
      // HTTP refresh instead of one request per socket event.
      const timer = window.setTimeout(() => {
        domainRefreshTimers.delete(domain);
        dispatch(thunk());
      }, 100);
      domainRefreshTimers.set(domain, timer);
    };

    const scheduleCompetitionRefresh = () => {
      const domain = "competition";
      if (domainRefreshTimers.has(domain)) return;

      // Filling a room emits queue and assignment events together. One short
      // debounce window turns that burst into a single HTTP reconciliation.
      const timer = window.setTimeout(() => {
        domainRefreshTimers.delete(domain);
        setCompetitionRevision((current) => current + 1);
      }, 100);
      domainRefreshTimers.set(domain, timer);
    };

    const handleRealtimeEvent = (event) => {
      if (!isSupportedRealtimeEvent(event)) return;

      const processedEventIds = processedRealtimeEventIdsRef.current;
      if (processedEventIds.has(event.eventId)) return;
      processedEventIds.add(event.eventId);

      // Bound client-side deduplication memory while preserving insertion
      // order so the oldest processed event ID is discarded first.
      if (processedEventIds.size > 500) {
        processedEventIds.delete(processedEventIds.values().next().value);
      }

      if (
        event.type ===
        REALTIME_EVENT_TYPES.CLAN_JOIN_REQUESTS_UPDATED
      ) {
        dispatch(
          clanAction.setLiveJoinRequests({
            ...event.data,
            resourceVersion: event.resourceVersion,
          }),
        );
      } else if (
        event.type ===
        REALTIME_EVENT_TYPES.CLAN_JOIN_REQUEST_STATUS_UPDATED
      ) {
        dispatch(
          clanAction.setLiveMyJoinRequestStatus({
            ...event.data,
            resourceVersion: event.resourceVersion,
          }),
        );
        if (event.data.status === "ACCEPTED") {
          scheduleDomainRefresh("clan", fetchUserClan);
        }
      } else if (
        event.type === REALTIME_EVENT_TYPES.CLAN_UPDATED
      ) {
        scheduleDomainRefresh("clan", fetchUserClan);
      } else if (
        event.type === REALTIME_EVENT_TYPES.CLAN_TEAM_UPDATED
      ) {
        scheduleDomainRefresh("clan-teams", fetchClanTeams);
      } else if (
        event.type ===
        REALTIME_EVENT_TYPES.SOCIAL_CONNECTIONS_UPDATED
      ) {
        scheduleDomainRefresh("social", fetchSocialConnections);
      } else if (
        event.type ===
        REALTIME_EVENT_TYPES.CHAT_PERSONAL_MESSAGE_CREATED
      ) {
        handleNewMessage(event.data.message);
      } else if (
        event.type ===
        REALTIME_EVENT_TYPES.NOTIFICATION_CREATED
      ) {
        onNotification(event.data.notification);
      } else if (
        event.type ===
          REALTIME_EVENT_TYPES.MATCHMAKING_QUEUE_UPDATED ||
        event.type ===
          REALTIME_EVENT_TYPES.MATCH_ASSIGNMENT_UPDATED
      ) {
        // Socket data is only an invalidation signal. Match screens reload
        // their authorized HTTP projections instead of trusting pushed state.
        scheduleCompetitionRefresh();
      }
    };

    const onConnect = () => {
      setConnected(true);
      setLastError("");
      // Reconnects may have missed events while offline, so every competition
      // screen performs one authoritative reconciliation.
      setCompetitionRevision((current) => current + 1);

      const state = platformStore.getState();
      const clan = state.clan?.userClanData?.data;
      const currentUserId = getCurrentUserId();
      const currentMember = clan?.members?.find((member) => {
        const memberId = member.user?._id || member.user;
        return String(memberId) === String(currentUserId);
      });

      // One reconnect read repairs any event missed while the socket was
      // offline. Regular members skip this private manager endpoint.
      if (["LEADER", "COLEADER"].includes(currentMember?.role)) {
        dispatch(fetchClanJoinRequests());
      }
    };

    const onDisconnect = () => {
      setConnected(false);
    };

    const onConnectError = (error) => {
      setConnected(false);
      setLastError(error?.message || "Unable to connect to live services.");

      const code = error?.data?.code;
      if (
        !["ACCESS_TOKEN_EXPIRED", "ACCESS_TOKEN_MISSING"].includes(code)
      ) {
        return;
      }

      // Socket refresh always happens over HTTP so new credentials remain in
      // HttpOnly cookies and never enter JavaScript or a socket event payload.
      if (!socketRefreshRef.current) {
        socketRefreshRef.current = refreshAuthentication()
          .then(() => {
            if (socketRef.current === socket) socket.connect();
          })
          .catch(() => {
            dispatch(
              sessionInvalidated({
                code: "SESSION_INVALID",
                message: "Session expired. Please login again.",
                status: 401,
              })
            );
          })
          .finally(() => {
            socketRefreshRef.current = null;
          });
      }
    };

    const onAuthExpired = () => {
      onConnectError({
        data: { code: "ACCESS_TOKEN_EXPIRED" },
        message: "Access token expired.",
      });
    };

    const onAuthRevoked = () => {
      dispatch(
        sessionInvalidated({
          code: "SESSION_REVOKED",
          message: "Your session ended. Please login again.",
          status: 401,
        })
      );
    };

    const onTournamentJoin = (data) => {
      if (!data?.queueId && !data?.offeringId) return;

      // Participation is loaded from match/event APIs. Never copy generated
      // events into the player profile or reusable offering catalogue.
      dispatch(
        showToast({
          message: data.alreadyJoined
            ? "You are already in this matchmaking room."
            : "Your matchmaking entry is confirmed.",
          type: types.SUCCESS,
          position: "bottom-right",
        }),
      );
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
    socket.on("auth:expired", onAuthExpired);
    socket.on("auth:revoked", onAuthRevoked);
    socket.on("clan_message", handleNewMessage);
    socket.on(REALTIME_CHANNEL, handleRealtimeEvent);
    socket.on("personal_message", handleNewMessage);
    socket.on("newTournament", handleTournamentUpdate);
    socket.on("updateTournament", handleTournamentUpdate);
    socket.on("TOURNAMENT_JOIN_SUCCESS", onTournamentJoin);
    socket.on("JOINED_TOURNAMENT_UPDATE", onTournamentJoin);
    socket.on("notification", onNotification);
    socket.on("ERROR", onError);

    return () => {
      domainRefreshTimers.forEach((timer) =>
        window.clearTimeout(timer),
      );
      domainRefreshTimers.clear();
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("auth:expired", onAuthExpired);
      socket.off("auth:revoked", onAuthRevoked);
      socket.off("clan_message", handleNewMessage);
      socket.off(REALTIME_CHANNEL, handleRealtimeEvent);
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
  }, [dispatch, isAuthenticated]);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        competitionRevision,
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
