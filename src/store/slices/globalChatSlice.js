import { createSlice } from "@reduxjs/toolkit";
import createApiThunk from "../thunks/createApiThunk";
import { logout } from "./authSlice";
import { appendUniqueMessage, dedupeMessages } from "../../utils/chatMessages";

export const invitePlayerToClan = createApiThunk("globalChat/invitePlayer", {
  path: "/api/clan/invitations",
  method: "post",
  toast: { success: true, error: true },
});

export const fetchChatThreads = createApiThunk("globalChat/fetchThreads", {
  path: "/api/users/chats",
  errorMessage: "Unable to load conversations.",
});

export const fetchMyClanInvitations = createApiThunk(
  "globalChat/fetchMyClanInvitations",
  {
    path: "/api/clan/invitations/mine",
    errorMessage: "Unable to load clan invitations.",
  },
);

export const acceptClanInvitation = createApiThunk(
  "globalChat/acceptClanInvitation",
  {
    path: ({ arg }) =>
      `/api/clan/invitations/${encodeURIComponent(arg)}/accept`,
    method: "post",
    getBody: () => undefined,
    toast: { success: true, error: true },
  },
);

export const declineClanInvitation = createApiThunk(
  "globalChat/declineClanInvitation",
  {
    path: ({ arg }) =>
      `/api/clan/invitations/${encodeURIComponent(arg)}`,
    method: "delete",
    getBody: () => undefined,
    toast: { success: true, error: true },
  },
);

const initialState = {
  messages: [],
  personalThreads: [],
  threadsStatus: "idle",
  activePersonalThreadId: null,
  invitations: [],
  invitationsStatus: "idle",
  respondingInvitationId: null,
};

const globalChatSlice = createSlice({
  name: "globalChat",
  initialState,
  reducers: {
    mergeMessages: (state, action) => {
      state.messages = dedupeMessages([
        ...(action.payload || []),
        ...state.messages,
      ]).slice(-200);
    },
    appendMessage: (state, action) => {
      state.messages = appendUniqueMessage(
        state.messages,
        action.payload,
      ).slice(-200);
    },
    setActivePersonalThread: (state, action) => {
      const threadId = action.payload ? String(action.payload) : null;
      state.activePersonalThreadId = threadId;
    },
    clearPersonalUnread: (state, action) => {
      const thread = state.personalThreads.find(
        (entry) => String(entry.userId) === String(action.payload || ""),
      );
      if (thread) thread.unreadCount = 0;
    },
    receivePersonalMessage: (state, action) => {
      const message = action.payload?.message;
      const currentUserId = String(action.payload?.currentUserId || "");
      if (!message || !currentUserId) return;
      const isIncoming = String(message.receiverId) === currentUserId;
      const otherUserId = String(
        isIncoming ? message.senderId : message.receiverId,
      );
      if (!otherUserId) return;

      const existingIndex = state.personalThreads.findIndex(
        (entry) => String(entry.userId) === otherUserId,
      );
      const existing = existingIndex >= 0
        ? state.personalThreads[existingIndex]
        : null;
      const updated = {
        ...existing,
        userId: otherUserId,
        username:
          existing?.username ||
          (isIncoming ? message.senderName : message.receiverName) ||
          "Player",
        latestMessage: message.message,
        latestMessageAt: message.timestamp,
        unreadCount:
          isIncoming && state.activePersonalThreadId !== otherUserId
            ? Number(existing?.unreadCount || 0) + 1
            : 0,
      };
      if (existingIndex >= 0) state.personalThreads.splice(existingIndex, 1);
      state.personalThreads.unshift(updated);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChatThreads.pending, (state) => {
        state.threadsStatus = "loading";
      })
      .addCase(fetchChatThreads.fulfilled, (state, action) => {
        const incoming = action.payload?.data?.threads || [];
        const liveByUser = new Map(
          state.personalThreads.map((thread) => [String(thread.userId), thread]),
        );
        const merged = incoming.map((thread) => {
          const live = liveByUser.get(String(thread.userId));
          liveByUser.delete(String(thread.userId));
          return live && new Date(live.latestMessageAt || 0) > new Date(thread.latestMessageAt || 0)
            ? live
            : thread;
        });
        state.personalThreads = [...liveByUser.values(), ...merged].slice(0, 50);
        state.threadsStatus = "succeeded";
      })
      .addCase(fetchChatThreads.rejected, (state) => {
        state.threadsStatus = "failed";
      })
      .addCase(fetchMyClanInvitations.pending, (state) => {
        state.invitationsStatus = "loading";
      })
      .addCase(fetchMyClanInvitations.fulfilled, (state, action) => {
        state.invitations = action.payload?.data?.invitations || [];
        state.invitationsStatus = "succeeded";
      })
      .addCase(fetchMyClanInvitations.rejected, (state) => {
        state.invitationsStatus = "failed";
      })
      .addCase(acceptClanInvitation.pending, (state, action) => {
        state.respondingInvitationId = action.meta.arg;
      })
      .addCase(acceptClanInvitation.fulfilled, (state, action) => {
        state.invitations = state.invitations.filter(
          (invitation) => invitation._id !== action.meta.arg,
        );
        state.respondingInvitationId = null;
      })
      .addCase(acceptClanInvitation.rejected, (state) => {
        state.respondingInvitationId = null;
      })
      .addCase(declineClanInvitation.pending, (state, action) => {
        state.respondingInvitationId = action.meta.arg;
      })
      .addCase(declineClanInvitation.fulfilled, (state, action) => {
        state.invitations = state.invitations.filter(
          (invitation) => invitation._id !== action.meta.arg,
        );
        state.respondingInvitationId = null;
      })
      .addCase(declineClanInvitation.rejected, (state) => {
        state.respondingInvitationId = null;
      })
      .addCase(logout.fulfilled, () => initialState);
  },
});

export const globalChatActions = globalChatSlice.actions;
export default globalChatSlice.reducer;
