import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiGlobe,
  FiSend,
  FiUser,
  FiUserPlus,
} from "react-icons/fi";
import useSocket from "../../context/useSocket";
import { getMessageSignature } from "../../utils/chatMessages";
import { applyAvatarFallback } from "../../utils/imageFallbacks";
import {
  acceptClanInvitation,
  declineClanInvitation,
  globalChatActions,
} from "../../store/slices/globalChatSlice";
import { fetchUserClan } from "../../store/slices/clanSlice";

const GlobalChatBox = ({
  canInvite,
  onBack,
  onInvite,
  onViewProfile,
}) => {
  const dispatch = useDispatch();
  const socket = useSocket();
  const { summary } = useSelector((store) => store.player);
  const { invitations, messages, respondingInvitationId } = useSelector(
    (store) => store.globalChat,
  );
  const scrollRef = useRef(null);
  const stickToBottomRef = useRef(true);
  const [message, setMessage] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [activePlayerTag, setActivePlayerTag] = useState(null);
  const isConnected = Boolean(socket?.socket && socket?.connected);
  const canSend = Boolean(
    isConnected && message.trim() && !isJoining && !isSending,
  );

  useEffect(() => {
    if (!socket?.socket || !isConnected) return undefined;
    setIsJoining(true);
    const timeout = window.setTimeout(() => {
      setIsJoining(false);
      setSendError("Unable to load global chat. Go back and try again.");
    }, 10000);
    const loadMessages = (payload) => {
      if (payload?.threadId !== "global") return;
      window.clearTimeout(timeout);
      dispatch(globalChatActions.mergeMessages(payload.messages || []));
      setIsJoining(false);
    };

    socket.socket.on("global_load_messages", loadMessages);
    socket.socket.emit("join_global_room");
    return () => {
      window.clearTimeout(timeout);
      socket.socket.emit("leave_global_room");
      socket.socket.off("global_load_messages", loadMessages);
    };
  }, [dispatch, isConnected, socket?.socket]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !stickToBottomRef.current) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!canSend) return;
    const outgoingMessage = message.trim();
    stickToBottomRef.current = true;
    setIsSending(true);
    setSendError("");
    socket.socket.timeout(10000).emit(
      "global_message",
      { message: outgoingMessage },
      (transportError, response) => {
        setIsSending(false);
        if (transportError || response?.success !== true) {
          setSendError(
            response?.error?.message ||
              "Message was not delivered. Please try again.",
          );
          return;
        }
        dispatch(globalChatActions.appendMessage(response.message));
        setMessage((current) =>
          current.trim() === outgoingMessage ? "" : current,
        );
      },
    );
  };

  const respondToInvitation = async (invitationId, accept) => {
    const thunk = accept
      ? acceptClanInvitation(invitationId)
      : declineClanInvitation(invitationId);
    try {
      await dispatch(thunk).unwrap();
      if (accept) dispatch(fetchUserClan());
    } catch {
      // The shared request boundary already presents the normalized failure.
    }
  };

  return (
    <div className="relative mx-auto flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950 shadow-[0_18px_50px_rgba(2,8,23,0.45)]">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            aria-label="Back to chats"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-100 lg:hidden"
            onClick={onBack}
            type="button"
          >
            <FiArrowLeft /> Chats
          </button>
          <span className="hidden rounded-xl bg-cyan-300/10 p-2 text-cyan-200 sm:inline-flex">
            <FiGlobe />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-base font-medium text-white">Global Chat</h2>
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
              Meet players and recruit teammates
            </p>
          </div>
        </div>
        <span className={`ml-2 shrink-0 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${isConnected ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-200"}`}>
          {isConnected ? "Connected" : "Offline"}
        </span>
      </div>

      {invitations.length > 0 ? (
        <div className="space-y-2 border-b border-violet-400/15 bg-violet-400/5 p-3">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-200">
            Clan invitations
          </p>
          {invitations.map((invitation) => {
            const isResponding = respondingInvitationId === invitation._id;
            return (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-violet-300/15 bg-slate-950/70 px-3 py-2" key={invitation._id}>
                <span className="text-sm text-slate-200">
                  <strong>{invitation.clan.clanName}</strong> invited you to join.
                </span>
                <span className="flex gap-2">
                  <button className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 disabled:opacity-50" disabled={isResponding} onClick={() => respondToInvitation(invitation._id, false)} type="button">
                    Decline
                  </button>
                  <button className="rounded-lg bg-violet-300 px-3 py-1.5 text-xs font-bold text-slate-950 disabled:opacity-50" disabled={isResponding} onClick={() => respondToInvitation(invitation._id, true)} type="button">
                    {isResponding ? "Saving..." : "Accept"}
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      ) : null}

      {!isConnected ? (
        <div className="flex items-center gap-2 border-b border-amber-500/15 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <FiAlertCircle className="shrink-0" />
          Live chat is disconnected. Reconnect to send messages.
        </div>
      ) : null}

      <div
        className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4"
        onScroll={(event) => {
          const container = event.currentTarget;
          stickToBottomRef.current =
            container.scrollHeight - container.scrollTop - container.clientHeight < 96;
        }}
        ref={scrollRef}
      >
        {isJoining ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
            Joining the global channel...
          </div>
        ) : null}
        {!isJoining && messages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-400">
            No messages yet. Say hello or tell players what kind of squad you need.
          </div>
        ) : null}

        {messages.map((entry, index) => {
          const isOwnMessage = String(entry.senderId) === String(summary?.userId);
          const hasPlayerActions = !isOwnMessage && Boolean(entry.playerTag);
          return (
            <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`} key={getMessageSignature(entry, index)}>
              <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm shadow-sm sm:max-w-[78%] ${isOwnMessage ? "bg-cyan-300 text-slate-950" : "border border-slate-800 bg-slate-900 text-slate-100"}`}>
                {!isOwnMessage ? (
                  <div className="relative mb-1 flex items-center gap-2">
                    <img alt="" className="h-6 w-6 rounded-lg object-cover" onError={applyAvatarFallback} src={entry.avatar || "/profile-pic.png"} />
                    <button
                      aria-expanded={activePlayerTag === entry.playerTag}
                      className="font-bold text-cyan-300 hover:text-cyan-200 disabled:cursor-default disabled:text-slate-300"
                      disabled={!hasPlayerActions}
                      onClick={() => setActivePlayerTag((current) => current === entry.playerTag ? null : entry.playerTag)}
                      type="button"
                    >
                      {entry.senderName || "Player"}
                    </button>
                    {hasPlayerActions && activePlayerTag === entry.playerTag ? (
                      <div className="absolute left-0 top-8 z-20 w-52 rounded-xl border border-slate-700 bg-slate-950 p-2 shadow-2xl">
                        <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:bg-slate-800" onClick={() => { setActivePlayerTag(null); onViewProfile(entry.playerTag); }} type="button">
                          <FiUser /> View profile
                        </button>
                        {canInvite ? (
                          <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-violet-200 hover:bg-slate-800" onClick={() => { setActivePlayerTag(null); onInvite(entry.playerTag); }} type="button">
                            <FiUserPlus /> Invite to clan
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <p className="break-words leading-6">{entry.message}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-slate-800 p-3">
        <p className="mb-2 px-2 text-[11px] text-slate-500">
          Public to verified players. Never share passwords, OTPs, or payment details.
        </p>
        <div className="flex items-center gap-2">
          <input className="min-w-0 flex-1 rounded-full border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-400 disabled:opacity-60" disabled={!isConnected} maxLength={500} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => event.key === "Enter" && sendMessage()} placeholder="Message all players..." value={message} />
          <button className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500" disabled={!canSend} onClick={sendMessage} type="button">
            <FiSend /> {isSending ? "Sending..." : "Send"}
          </button>
        </div>
        {sendError ? <p className="mt-2 px-2 text-xs text-rose-300">{sendError}</p> : null}
      </div>
    </div>
  );
};

GlobalChatBox.propTypes = {
  canInvite: PropTypes.bool.isRequired,
  onBack: PropTypes.func.isRequired,
  onInvite: PropTypes.func.isRequired,
  onViewProfile: PropTypes.func.isRequired,
};

export default GlobalChatBox;
