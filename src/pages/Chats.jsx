import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import ChatBox from "../components/common/ChatBox";
import GlobalChatBox from "../components/common/GlobalChatBox";
import { FiGlobe, FiUsers } from "react-icons/fi";
import { fetchUserClan } from "../store/slices/clanSlice.js";
import { fetchSocialConnections } from "../store/slices/socialSlice.js";
import { playerActions } from "../store/slices/playerSlice.js";
import { applyAvatarFallback } from "../utils/imageFallbacks.js";
import {
  fetchChatThreads,
  fetchMyClanInvitations,
  invitePlayerToClan,
} from "../store/slices/globalChatSlice.js";

const EMPTY_LIST = Object.freeze([]);

const Chats = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const activeChats = useSelector((store) => store.player.activeChats);
  const { connections, connectionsStatus } = useSelector((store) => store.social);
  const { userClanData, userClanStatus } = useSelector((store) => store.clan);
  const { summary } = useSelector((store) => store.player);
  const { personalThreads, threadsStatus } = useSelector(
    (store) => store.globalChat,
  );
  const [selectedChat, setSelectedChat] = useState("global");
  const [chatType, setChatType] = useState("global");
  const [chatName, setChatName] = useState("Global Chat");
  const [isModalOpen, setIsModalOpen] = useState(false);
  // The profile carries only a clan reference. Chat visibility and identity
  // come from the current membership endpoint so ordinary members receive the
  // same canonical clan record as leaders.
  const clanChat = userClanData?.data || null;
  const friends = connections?.friends || EMPTY_LIST;
  const currentClanMember = clanChat?.members?.find((member) =>
    String(member.user?._id || member.user) === String(summary?.userId),
  );
  const canInviteToClan = ["LEADER", "COLEADER"].includes(
    currentClanMember?.role,
  );
  const personalChats = useMemo(() => {
    const byUserId = new Map();
    [...personalThreads, ...(activeChats || [])].forEach((chat) => {
      const userId = String(chat.userId || chat.id || chat._id || "");
      if (userId && !byUserId.has(userId)) byUserId.set(userId, chat);
    });
    return [...byUserId.values()];
  }, [activeChats, personalThreads]);
  const visibleChats = useMemo(() => {
    const friendsById = new Map(
      friends.map((friend) => [String(friend._id), friend]),
    );
    return personalChats.map((chat) => {
      const chatId = String(chat.userId || chat.id || chat._id || "");
      const friend = friendsById.get(chatId);
      return {
        ...chat,
        avatar: chat.avatar || friend?.avatar || null,
        playerTag:
          chat.playerTag || chat.profileTag || friend?.playerTag || null,
        username:
          chat.username || chat.profile?.username || friend?.username || "Player",
        userId: chatId || chat.userId,
      };
    });
  }, [friends, personalChats]);

  useEffect(() => {
    if (chatType !== "personal" || !selectedChat) return;
    const stillAvailable = personalChats.some((chat) =>
      [chat.userId, chat.id, chat._id]
        .map((value) => String(value || ""))
        .includes(String(selectedChat))
    );
    if (!stillAvailable) {
      setSelectedChat(null);
      setChatType(null);
      setChatName(null);
    }
  }, [chatType, personalChats, selectedChat]);

  useEffect(() => {
    if (userClanStatus === "idle") {
      dispatch(fetchUserClan());
    }
  }, [dispatch, userClanStatus]);

  useEffect(() => {
    if (connectionsStatus === "idle") dispatch(fetchSocialConnections());
  }, [connectionsStatus, dispatch]);

  useEffect(() => {
    dispatch(fetchMyClanInvitations());
    if (threadsStatus === "idle") dispatch(fetchChatThreads());
  }, [dispatch, threadsStatus]);

  const openChat = ({ id, type, name }) => {
    setSelectedChat(id);
    setChatType(type);
    setChatName(name);
    setIsModalOpen(false);
  };

  const closeChat = () => {
    setSelectedChat(null);
    setChatType(null);
    setChatName(null);
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-10rem)] min-h-[28rem] max-h-[46rem] w-full max-w-6xl min-w-0 flex-col gap-4">
      <div className="grid min-h-0 flex-1 gap-3 overflow-hidden lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div
          className={`min-h-0 ${selectedChat ? "hidden lg:block" : "block"}`}
        >
          <ChatSidebar
            onOpenChat={openChat}
            clanChat={clanChat}
            personalChats={visibleChats}
            onNewChat={() => setIsModalOpen(true)}
            onViewProfile={(playerTag) =>
              navigate(`/dashboard/profile?playerTag=${encodeURIComponent(playerTag)}`)
            }
            onOpenGlobal={() =>
              openChat({ id: "global", type: "global", name: "Global Chat" })
            }
          />
        </div>

        <div
          className={`min-h-0 ${selectedChat ? "block" : "hidden lg:block"}`}
        >
          {selectedChat ? (
            <div className="h-full min-h-0 rounded-2xl border border-slate-800 bg-slate-950/90 p-2">
              {chatType === "global" ? (
                <GlobalChatBox
                  canInvite={canInviteToClan}
                  onBack={closeChat}
                  onInvite={async (playerTag) => {
                    try {
                      await dispatch(invitePlayerToClan({ playerTag })).unwrap();
                    } catch {
                      // Shared API feedback owns the visible failure.
                    }
                  }}
                  onViewProfile={(playerTag) =>
                    navigate(`/dashboard/profile?playerTag=${encodeURIComponent(playerTag)}`)
                  }
                />
              ) : (
                <ChatBox
                  selectedChat={selectedChat}
                  chatType={chatType}
                  chatName={chatName}
                  onBack={closeChat}
                />
              )}
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
          onOpenChat={openChat}
          friends={friends}
          friendsStatus={connectionsStatus}
        />
      )}
    </div>
  );
};

const ChatSidebar = ({ onOpenChat, onOpenGlobal, clanChat, personalChats, onNewChat, onViewProfile }) => {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/90">
      <div className="flex justify-end border-b border-slate-800 px-3 py-3">
        <button
          className="rounded-2xl bg-cyan-300 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-950"
          onClick={onNewChat}
        >
          New
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        <button
          className="flex w-full items-center justify-between rounded-2xl border border-cyan-300/25 bg-cyan-300/10 px-4 py-4 text-left transition hover:border-cyan-300/50"
          onClick={onOpenGlobal}
          type="button"
        >
          <span className="flex items-start gap-3">
            <span className="rounded-2xl bg-cyan-300/10 p-3 text-cyan-200">
              <FiGlobe />
            </span>
            <span>
              <span className="block text-sm font-bold text-white">Global Chat</span>
              <span className="block text-xs text-slate-400">Meet players and recruit</span>
            </span>
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">Public</span>
        </button>

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
          <div
            key={chat._id || chat.userId || chat.id || `chat-${index}`}
            className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-2 transition hover:border-slate-700"
          >
            <button
              className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-2 text-left"
              onClick={() => {
                onOpenChat({
                  id: chat.userId || chat.id || chat._id || "unknown",
                  type: "personal",
                  name: chat.username || chat.profile?.username || "Unknown player",
                });
              }}
              type="button"
            >
              <img
                alt={chat.username || chat.profile?.username || "Player"}
                className="h-11 w-11 shrink-0 rounded-xl object-cover"
                onError={applyAvatarFallback}
                src={chat.avatar || chat.profile?.avatar || "/profile-pic.png"}
              />
              <span className="min-w-0">
                <span className="block text-sm font-bold text-white">
                  {chat.username || chat.profile?.username}
                </span>
                {chat.latestMessage ? (
                  <span className="block truncate text-xs text-slate-500">
                    {chat.latestMessage}
                  </span>
                ) : null}
              </span>
            </button>
            {Number(chat.unreadCount || 0) > 0 ? (
              <span
                aria-label={`${chat.unreadCount} new messages`}
                className="inline-flex min-w-6 shrink-0 items-center justify-center rounded-full bg-cyan-300 px-2 py-1 text-[11px] font-black text-slate-950"
              >
                {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
              </span>
            ) : null}
            {chat.playerTag || chat.profileTag || chat.profile?.profileTag ? (
              <button
                className="shrink-0 rounded-lg border border-cyan-300/20 px-2 py-1.5 text-[11px] font-bold text-cyan-200"
                onClick={() => onViewProfile(chat.playerTag || chat.profileTag || chat.profile?.profileTag)}
                type="button"
              >
                Profile
              </button>
            ) : null}
          </div>
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

const NewChatModal = ({ onClose, personalChats, onOpenChat, friends, friendsStatus }) => {
  const dispatch = useDispatch();
  const [selectedUser, setSelectedUser] = useState(null);

  const startChat = () => {
    if (!selectedUser) return;

    const friend = friends.find((entry) => String(entry._id) === selectedUser);
    if (!friend) return;

    const existingChat = personalChats.find(
      (chat) =>
        chat._id === friend._id ||
        chat.userId === friend._id ||
        chat.id === friend._id
    );

    if (!existingChat) {
      dispatch(
        playerActions.upsertActiveChat({
          userId: String(friend._id),
          username: friend.username || "Player",
          avatar: friend.avatar || null,
          playerTag: friend.playerTag || null,
        }),
      );
    }

    onOpenChat({
      id: friend._id,
      type: "personal",
      name: friend.username || "Player",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-[0_24px_60px_rgba(2,8,23,0.55)]">
        <h2 className="text-2xl font-black text-white">Start a New Chat</h2>
        {friendsStatus === "loading" ? (
          <p className="mt-3 text-sm text-slate-400">Loading friends...</p>
        ) : null}
        <select
          className="mt-4 w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-100"
          value={selectedUser || ""}
          onChange={(event) => setSelectedUser(event.target.value)}
          disabled={friendsStatus === "loading"}
        >
          <option value="">Select a friend</option>
          {friends.map((friend) => (
            <option key={friend._id} value={friend._id}>
              {friend.username || "Player"}
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
  onOpenGlobal: PropTypes.func.isRequired,
  clanChat: PropTypes.shape({
    _id: PropTypes.string,
    clanName: PropTypes.string,
  }),
  personalChats: PropTypes.arrayOf(PropTypes.object).isRequired,
  onNewChat: PropTypes.func.isRequired,
  onViewProfile: PropTypes.func.isRequired,
};

NewChatModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  personalChats: PropTypes.arrayOf(PropTypes.object).isRequired,
  onOpenChat: PropTypes.func.isRequired,
  friends: PropTypes.arrayOf(PropTypes.object).isRequired,
  friendsStatus: PropTypes.string.isRequired,
};

export default Chats;
