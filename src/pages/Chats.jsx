import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import ChatBox from "../components/common/ChatBox";
import { FiMessageSquare, FiUsers } from "react-icons/fi";

const Chats = () => {
  const { profile } = useSelector((store) => store.player);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatType, setChatType] = useState(null);
  const [chatName, setChatName] = useState(null);
  const [personalChats, setPersonalChats] = useState(profile?.activeChats || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const clanChat = profile?.clan || null;
  const totalChats = (clanChat ? 1 : 0) + personalChats.length;

  useEffect(() => {
    setPersonalChats(profile?.activeChats || []);
  }, [profile?.activeChats]);

  const helperStats = useMemo(
    () => [
      { label: "Open threads", value: totalChats },
      { label: "Direct chats", value: personalChats.length },
      { label: "Clan room", value: clanChat ? "Live" : "Not joined" },
    ],
    [clanChat, personalChats.length, totalChats]
  );

  const openChat = ({ id, type, name }) => {
    setSelectedChat(id);
    setChatType(type);
    setChatName(name);
    setIsModalOpen(false);
  };

  return (
    <div className="flex min-h-0 flex-col space-y-4">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-white">Chats</h1>
        <div className="flex flex-wrap gap-2">
            {helperStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2"
              >
                <span className="text-[10px] uppercase tracking-wide text-slate-400">
                  {stat.label}: {" "}
                </span>
                <span className="text-xs font-black text-white">{stat.value}</span>
              </div>
            ))}
        </div>
      </section>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[19rem_minmax(0,1fr)] lg:[height:calc(100vh-9rem)]">
        <div
          className={`min-h-0 ${selectedChat ? "hidden lg:block" : "block"}`}
        >
          <ChatSidebar
            onOpenChat={openChat}
            clanChat={clanChat}
            personalChats={personalChats}
            onNewChat={() => setIsModalOpen(true)}
          />
        </div>

        <div
          className={`min-h-0 ${selectedChat ? "block" : "hidden lg:block"}`}
        >
          {selectedChat ? (
            <div className="h-full min-h-0 rounded-2xl border border-slate-800 bg-slate-950/90 p-2">
              <ChatBox
                selectedChat={selectedChat}
                chatType={chatType}
                chatName={chatName}
                onBack={() => setSelectedChat(null)}
              />
            </div>
          ) : (
            <div className="flex h-full min-h-[20rem] items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/70 p-5 text-center text-sm text-slate-400">
              Pick a clan or private thread to open the live communication pane.
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <NewChatModal
          onClose={() => setIsModalOpen(false)}
          personalChats={personalChats}
          setPersonalChats={setPersonalChats}
          onOpenChat={openChat}
        />
      )}
    </div>
  );
};

const ChatSidebar = ({ onOpenChat, clanChat, personalChats, onNewChat }) => {
  return (
    <div className="h-full min-h-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/90">
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Match Feed
          </p>
          <h2 className="mt-1 text-xl font-black text-white">Chats</h2>
        </div>
        <button
          className="rounded-2xl bg-cyan-300 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-950"
          onClick={onNewChat}
        >
          New
        </button>
      </div>

      <div className="h-full space-y-2 overflow-y-auto p-3">
        {clanChat && (
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-4 text-left transition hover:border-slate-700"
            onClick={() => {
              onOpenChat({
                id: clanChat._id,
                type: "clan",
                name: clanChat.clanName,
              });
            }}
          >
            <span className="flex items-start gap-3">
              <span className="rounded-2xl bg-violet-500/10 p-3 text-violet-300">
                <FiUsers />
              </span>
              <span>
                <span className="block text-sm font-bold text-white">
                  {clanChat.clanName}
                </span>
                <span className="block text-xs text-slate-500">
                  Clan channel
                </span>
              </span>
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">
              Live
            </span>
          </button>
        )}

        {personalChats.map((chat, index) => (
          <button
            key={chat._id || chat.userId || chat.id || `chat-${index}`}
            type="button"
            className="block w-full rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-4 text-left transition hover:border-slate-700"
            onClick={() => {
              onOpenChat({
                id: chat.userId || chat.id || chat._id || "unknown",
                type: "personal",
                name: chat.username || chat.profile?.username || "Unknown player",
              });
            }}
          >
            <span className="flex items-start gap-3">
              <span className="rounded-2xl bg-cyan-400/10 p-3 text-cyan-200">
                <FiMessageSquare />
              </span>
              <span>
                <span className="block text-sm font-bold text-white">
                  {chat.username || chat.profile?.username}
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  Direct player channel
                </span>
              </span>
            </span>
          </button>
        ))}

        {!clanChat && personalChats.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 px-4 py-5 text-sm text-slate-400">
            No chat threads yet. Start a new direct chat to begin.
          </div>
        ) : null}
      </div>
    </div>
  );
};

const NewChatModal = ({ onClose, personalChats, setPersonalChats, onOpenChat }) => {
  const { profile } = useSelector((store) => store.player);
  const friends = profile?.profile?.friends || [];
  const [selectedUser, setSelectedUser] = useState(null);

  const startChat = () => {
    if (!selectedUser) return;

    const friend = friends.find((entry) => entry._id === selectedUser);
    if (!friend) return;

    const existingChat = personalChats.find(
      (chat) =>
        chat._id === friend._id ||
        chat.userId === friend._id ||
        chat.id === friend._id
    );

    if (!existingChat) {
      setPersonalChats([...personalChats, { ...friend, type: "personal" }]);
    }

    onOpenChat({
      id: friend._id,
      type: "personal",
      name: friend.profile?.username || "Player",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-[0_24px_60px_rgba(2,8,23,0.55)]">
        <h2 className="text-2xl font-black text-white">Start a New Chat</h2>
        <select
          className="mt-4 w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-100"
          value={selectedUser || ""}
          onChange={(event) => setSelectedUser(event.target.value)}
        >
          <option value="">Select a friend</option>
          {friends.map((friend) => (
            <option key={friend._id} value={friend._id}>
              {friend.profile.username}
            </option>
          ))}
        </select>

        <div className="mt-5 flex justify-end gap-3">
          <button
            className="rounded-2xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950"
            onClick={startChat}
          >
            Start Chat
          </button>
        </div>
      </div>
    </div>
  );
};

ChatSidebar.propTypes = {
  onOpenChat: PropTypes.func.isRequired,
  clanChat: PropTypes.shape({
    _id: PropTypes.string,
    clanName: PropTypes.string,
  }),
  personalChats: PropTypes.arrayOf(PropTypes.object).isRequired,
  onNewChat: PropTypes.func.isRequired,
};

NewChatModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  personalChats: PropTypes.arrayOf(PropTypes.object).isRequired,
  setPersonalChats: PropTypes.func.isRequired,
  onOpenChat: PropTypes.func.isRequired,
};

export default Chats;
