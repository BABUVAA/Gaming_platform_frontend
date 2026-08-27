import { createSlice } from "@reduxjs/toolkit";
import { sessionInvalidated } from "../actions/sessionActions.js";
import createApiThunk from "../thunks/createApiThunk.js";
import { removeActiveChatByUserId } from "../../utils/chatMessages.js";

const selectPlayerSummaryData = (response) => {
  const summary = response.data?.data;

  if (!summary?.userId || !summary.username || !summary.role) {
    throw new Error("Player summary response is incomplete.");
  }

  return summary;
};

export const fetchPlayerSummary = createApiThunk(
  "player/fetchSummary",
  {
    path: "/api/users/summary",
    selectData: selectPlayerSummaryData,
    errorMessage: "Unable to load player information.",
    toast: { error: true },
  },
  {
    condition: (_, { getState }) => {
      const { auth, player } = getState();
      return auth.isAuthenticated && player.summaryStatus !== "loading";
    },
  },
);

// Player requests use the `/api/users` backend boundary. Authentication
// requests remain in authSlice because they establish or destroy a session.
export const fetchPlayerProfile = createApiThunk(
  "player/fetchProfile",
  {
    path: "/api/users/profile",
    selectData: (response) => {
      const profile = response.data?.data;
      if (!profile?._id || !profile.profile || typeof profile.profile !== "object") {
        throw new Error("Player profile response is incomplete.");
      }
      return profile;
    },
    errorMessage: "Unable to load player profile.",
    toast: { error: true },
  },
  {
    condition: (_, { getState }) => {
      const { player } = getState();

      // Route guards and the server own authentication. Keeping the transport
      // independent of auth bootstrap timing prevents an authenticated Profile
      // page from remaining idle when session state settles in the same render.
      return player.profileStatus !== "loading";
    },
  },
);

export const fetchPublicPlayerProfile = createApiThunk(
  "player/fetchPublicProfile",
  {
    path: ({ arg: playerTag }) =>
      `/api/users/public/${encodeURIComponent(playerTag)}`,
    selectData: (response) => response.data?.data || null,
    errorMessage: "Unable to load this player profile.",
  },
);

export const searchPlayer = createApiThunk(
  "player/search",
  {
    path: "/api/users/searchPlayer",
    method: "post",
    errorMessage: "Unable to find that player.",
  },
);

export const updatePlayerProfileFile = createApiThunk(
  "player/updateProfileFile",
  {
    path: "/api/users/profile_file_update",
    method: "post",
    // Multipart requests need an explicit content type while the browser adds
    // the generated boundary to the outgoing FormData payload.
    getRequestConfig: () => ({
      headers: { "Content-Type": "multipart/form-data" },
    }),
    errorMessage: "Failed to update profile",
    toast: {
      success: "Profile updated",
      error: true,
    },
  },
);

export const updatePlayerProfileData = createApiThunk(
  "player/updateProfileData",
  {
    path: "/api/users/profile_data_update",
    method: "post",
    errorMessage: "Failed to update profile",
    toast: {
      success: "Profile updated",
      error: true,
    },
  },
);

const createInitialState = () => ({
  summary: null,
  summaryStatus: "idle",
  summaryRequestId: null,
  profile: null,
  profileStatus: "idle",
  // The request ID prevents an old session's response from entering a newer
  // player's state after logout or account replacement.
  profileRequestId: null,
  // Personal thread shortcuts are browser-session state, not profile data.
  // Relationships stay in the social slice and the server remains chat truth.
  activeChats: [],
  publicProfile: null,
  publicProfileTag: null,
  publicProfileStatus: "idle",
  publicProfileRequestId: null,
  error: null,
});

const resetPlayerState = (state) => {
  Object.assign(state, createInitialState());
};

const playerSlice = createSlice({
  name: "player",
  initialState: createInitialState(),
  reducers: {
    resetError: (state) => {
      state.error = null;
    },
    clearPublicProfile: (state) => {
      state.publicProfile = null;
      state.publicProfileTag = null;
      state.publicProfileStatus = "idle";
      state.publicProfileRequestId = null;
    },
    upsertActiveChat: (state, action) => {
      const incomingChat = action.payload;
      if (!incomingChat?.userId) return;

      if (!Array.isArray(state.activeChats)) {
        state.activeChats = [];
      }

      const existingIndex = state.activeChats.findIndex(
        (chat) =>
          chat?.userId === incomingChat.userId ||
          chat?._id === incomingChat.userId ||
          chat?.id === incomingChat.userId,
      );

      if (existingIndex === -1) {
        state.activeChats.unshift(incomingChat);
        return;
      }

      state.activeChats[existingIndex] = {
        ...state.activeChats[existingIndex],
        ...incomingChat,
      };
    },
    removeActiveChat: (state, action) => {
      if (!Array.isArray(state.activeChats)) return;
      state.activeChats = removeActiveChatByUserId(
        state.activeChats,
        action.payload,
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlayerSummary.pending, (state, action) => {
        state.summaryStatus = "loading";
        state.summaryRequestId = action.meta.requestId;
        state.error = null;
      })
      .addCase(fetchPlayerSummary.fulfilled, (state, action) => {
        if (state.summaryRequestId !== action.meta.requestId) return;

        state.summary = action.payload;
        state.summaryStatus = "succeeded";
        state.summaryRequestId = null;
      })
      .addCase(fetchPlayerSummary.rejected, (state, action) => {
        if (state.summaryRequestId !== action.meta.requestId) return;

        state.summaryStatus = "failed";
        state.summaryRequestId = null;
        if (!action.meta.aborted && !action.meta.condition) {
          state.error = action.payload;
        }
      })
      .addCase(fetchPlayerProfile.pending, (state, action) => {
        state.profileStatus = "loading";
        state.profileRequestId = action.meta.requestId;
        state.error = null;
      })
      .addCase(fetchPlayerProfile.fulfilled, (state, action) => {
        if (state.profileRequestId !== action.meta.requestId) return;

        state.profile = action.payload;
        state.profileStatus = "succeeded";
        state.profileRequestId = null;
      })
      .addCase(fetchPlayerProfile.rejected, (state, action) => {
        if (state.profileRequestId !== action.meta.requestId) return;

        state.profileStatus = "failed";
        state.profileRequestId = null;
        state.error = action.payload;
      })
      .addCase(fetchPublicPlayerProfile.pending, (state, action) => {
        state.publicProfile = null;
        state.publicProfileTag = action.meta.arg;
        state.publicProfileStatus = "loading";
        state.publicProfileRequestId = action.meta.requestId;
      })
      .addCase(fetchPublicPlayerProfile.fulfilled, (state, action) => {
        if (state.publicProfileRequestId !== action.meta.requestId) return;

        state.publicProfile = action.payload;
        state.publicProfileStatus = "succeeded";
        state.publicProfileRequestId = null;
      })
      .addCase(fetchPublicPlayerProfile.rejected, (state, action) => {
        if (state.publicProfileRequestId !== action.meta.requestId) return;

        state.publicProfile = null;
        state.publicProfileStatus = "failed";
        state.publicProfileRequestId = null;
      })
      .addCase(sessionInvalidated, resetPlayerState)
      .addMatcher(
        (action) =>
          action.type === "auth/logout/pending" ||
          action.type === "auth/login/pending" ||
          action.type === "auth/signup/pending",
        resetPlayerState,
      );
  },
});

export const playerActions = playerSlice.actions;
export default playerSlice;
