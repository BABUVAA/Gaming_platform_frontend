import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { FiAlertCircle, FiMessageCircle, FiSend } from "react-icons/fi";
import { useSocket } from "../../context/socketContext";

const getMessageSignature = (message = {}, fallbackIndex = 0) =>
  message?._id ||
  [
    message?.senderId || "unknown",
    message?.receiverId || message?.clanId || message?.chatId || "thread",
    message?.message || "",
    String(message?.timestamp || message?.createdAt || ""),
    fallbackIndex,
  ].join("::");

const dedupeMessages = (messageList = []) => {
  const seenSignatures = new Set();

  return messageList.filter((entry, index) => {
    const signature = getMessageSignature(entry, index);
    if (seenSignatures.has(signature)) return false;
    seenSignatures.add(signature);
    return true;
  });
};

const ChatBox = ({ chatType, selectedChat, chatName, onBack }) => {
  const { profile } = useSelector((store) => store.auth);
  const { userClanData } = useSelector((store) => store.clan);
  const socket = useSocket();
  const chatDisplayRef = useRef(null);
  const shouldStickToBottomRef = useRef(true);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);

  const chatId = chatType === "clan" ? userClanData?.data?._id : selectedChat;
  const senderId = profile?._id;
  const senderName = profile?.profile?.username || "unknown";
  const cachedMessages = useMemo(
    () => socket?.messages?.[chatId] || [],
    [chatId, socket?.messages]
  );
  const isConnected = Boolean(socket?.socket && socket?.connected);
  const canSend = Boolean(
    message.trim() && isConnected && chatId && senderId && !isJoiningRoom
  );

  useEffect(() => {
    setMessages(dedupeMessages(cachedMessages));
  }, [cachedMessages, chatId]);

  useEffect(() => {
    if (!socket?.socket || !chatId || !senderId) return;

    setIsJoiningRoom(true);

    const loadMessagesListener = (loadedMessages) => {
      setMessages(
        dedupeMessages(Array.isArray(loadedMessages) ? loadedMessages : [])
      );
      setIsJoiningRoom(false);
    };

    const messageListener = (newMessage) => {
      setMessages((prevMessages) => {
        return dedupeMessages([...prevMessages, newMessage]);
      });
    };

    socket.socket.off(`${chatType}_load_messages`, loadMessagesListener);
    socket.socket.off(`${chatType}_message`, messageListener);
    socket.socket.on(`${chatType}_load_messages`, loadMessagesListener);
    socket.socket.on(`${chatType}_message`, messageListener);
    socket.socket.emit(`join_${chatType}_room`, chatId);

    return () => {
      setIsJoiningRoom(false);
      socket.socket.emit(`leave_${chatType}_room`, chatId);
      socket.socket.off(`${chatType}_message`, messageListener);
      socket.socket.off(`${chatType}_load_messages`, loadMessagesListener);
    };
  }, [chatType, chatId, senderId, socket?.socket]);

  useEffect(() => {
    const container = chatDisplayRef.current;
    if (!container || !shouldStickToBottomRef.current) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleScroll = () => {
    const container = chatDisplayRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    shouldStickToBottomRef.current = distanceFromBottom < 96;
  };

  const sendMessage = () => {
    if (!canSend) return;

    const trimmedMessage = message.trim();
    let messageData = {
      clanId: chatId,
      senderId,
      senderName,
      message: trimmedMessage,
    };

    if (chatType === "personal") {
      messageData = {
        receiverId: selectedChat,
        receiverName: chatName,
        senderId,
        senderName,
        message: trimmedMessage,
      };
    }

    shouldStickToBottomRef.current = true;
    socket.socket.emit(`${chatType}_message`, messageData);
    setMessage("");
  };

  if (!chatType) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <FiMessageCircle size={40} className="mb-3 text-slate-500" />
        <h2 className="text-base font-medium text-slate-100">
          No Chat Selected
        </h2>
        <p className="text-sm text-slate-400">
          Select a chat to start messaging.
        </p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950 shadow-[0_18px_50px_rgba(2,8,23,0.45)]">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-slate-100 md:hidden"
            onClick={() => onBack()}
          >
            Back
          </button>
          <div>
            <h2 className="text-base font-medium text-white">
              {chatType === "clan" ? "Clan Chat" : chatName}
            </h2>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
              {chatType === "clan" ? "Squad channel" : "Direct player chat"}
            </p>
          </div>
        </div>
        <div
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
            isConnected
              ? "bg-emerald-500/15 text-emerald-300"
              : "bg-amber-500/15 text-amber-200"
          }`}
        >
          {isConnected ? "Connected" : "Offline"}
        </div>
      </div>

      {!isConnected ? (
        <div className="flex items-center gap-2 border-b border-amber-500/15 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <FiAlertCircle className="shrink-0" />
          <span>
            Live chat is disconnected. Make sure the backend socket server is
            running.
          </span>
        </div>
      ) : null}

      <div
        ref={chatDisplayRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4"
      >
        {isJoiningRoom ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
            Joining channel and syncing messages...
          </div>
        ) : null}

        {!isJoiningRoom && messages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-400">
            No messages yet. Start the conversation from here.
          </div>
        ) : null}

        {messages.map((msg, index) => {
          const isOwnMessage = msg.senderId === senderId;

          return (
            <div
              key={getMessageSignature(msg, index)}
              className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  isOwnMessage
                    ? "bg-cyan-300 text-slate-950"
                    : "border border-slate-800 bg-slate-900 text-slate-100"
                }`}
              >
                {chatType === "clan" && !isOwnMessage ? (
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">
                    {msg.senderName || "Player"}
                  </span>
                ) : null}
                <p className="leading-6">{msg.message}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="w-full border-t border-slate-800 p-3">
        <div className="flex items-center gap-2">
          <input
            placeholder={
              isConnected
                ? "Type a message..."
                : "Reconnect live services to send messages"
            }
            className="flex-1 rounded-full border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && sendMessage()}
            disabled={!isConnected || !chatId || !senderId}
          />

          <button
            disabled={!canSend}
            className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
            onClick={sendMessage}
          >
            <FiSend />
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
