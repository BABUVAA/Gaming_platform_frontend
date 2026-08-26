import { createSlice } from "@reduxjs/toolkit";
import { sessionInvalidated } from "../actions/sessionActions";
import createApiThunk from "../thunks/createApiThunk";
import { removeActiveChatByUserId } from "../../utils/chatMessages";

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
    errorMessage: "Unable to load player profile.",
    toast: { error: true },
  },
  {
    condition: (_, { getState }) => {
      const { auth, player } = getState();

      // Profile data is private and can only be requested for an authenticated
      // session. Refuse only overlapping loads so explicit refreshes still work.
      return (
        auth.isAuthenticated &&
        player.profileStatus !== "loading"
      );
    },
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
    upsertActiveChat: (state, action) => {
      const incomingChat = action.payload;
      if (!state.profile || !incomingChat?.userId) return;

      if (!Array.isArray(state.profile.activeChats)) {
        state.profile.activeChats = [];
      }

      const existingIndex = state.profile.activeChats.findIndex(
        (chat) =>
          chat?.userId === incomingChat.userId ||
          chat?._id === incomingChat.userId ||
          chat?.id === incomingChat.userId,
      );

      if (existingIndex === -1) {
        state.profile.activeChats.unshift(incomingChat);
        return;
      }

      state.profile.activeChats[existingIndex] = {
        ...state.profile.activeChats[existingIndex],
        ...incomingChat,
      };
    },
    removeActiveChat: (state, action) => {
      if (!state.profile || !Array.isArray(state.profile.activeChats)) return;
      state.profile.activeChats = removeActiveChatByUserId(
        state.profile.activeChats,
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
