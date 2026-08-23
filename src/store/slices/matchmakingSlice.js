import { createSlice } from "@reduxjs/toolkit";
import createApiThunk from "../thunks/createApiThunk.js";

const createJoinAttemptId = () =>
  globalThis.crypto?.randomUUID?.() ||
  `join_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;

/**
 * Adds a player or an eligible saved team to a Quick Match queue.
 *
 * Queue membership changes through HTTP because it is a durable command that
 * must receive a normal request response. Socket.IO only delivers the live
 * queue and match updates published after this request succeeds.
 */
export const joinQuickMatchQueue = createApiThunk(
  "matchmaking/joinQuickMatchQueue",
  {
    path: ({ arg }) =>
      `/api/player/quick-matches/${arg.offeringId}/queue`,
    method: "post",
    getBody: ({ attemptId, teamId }) => ({
      attemptId: attemptId || createJoinAttemptId(),
      ...(teamId ? { teamId } : {}),
    }),
    // The response contains the queue position/status needed by future match
    // screens, without exposing Axios response objects to Redux state.
    selectData: (response) => response.data?.data || response.data,
    errorMessage: "Unable to join this match right now.",
    toast: {
      success: true,
      error: true,
    },
  },
  {
    condition: (_, { getState }) => {
      // A player can submit only one join command at a time. This prevents a
      // double-click from creating competing queue requests in the browser.
      const state = getState();
      return (
        state.player?.summary?.role !== "staff" &&
        state.matchmaking.joinStatus !== "loading"
      );
    },
  },
);

const initialState = {
  joinStatus: "idle",
  joinError: null,
  joiningOfferingId: null,
};

const matchmakingSlice = createSlice({
  name: "matchmaking",
  initialState,
  reducers: {
    clearJoinError: (state) => {
      // Clear an inline error when a player changes their team selection or
      // starts a fresh queue attempt.
      state.joinError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(joinQuickMatchQueue.pending, (state, action) => {
        state.joinStatus = "loading";
        state.joinError = null;
        state.joiningOfferingId = action.meta.arg.offeringId;
      })
      .addCase(joinQuickMatchQueue.fulfilled, (state) => {
        state.joinStatus = "succeeded";
        state.joiningOfferingId = null;
      })
      .addCase(joinQuickMatchQueue.rejected, (state, action) => {
        // A condition rejection means another join request is already active,
        // not that the visible player action failed.
        if (action.meta.condition) return;

        state.joinStatus = action.meta.aborted ? "idle" : "failed";
        state.joinError = action.meta.aborted ? null : action.payload;
        state.joiningOfferingId = null;
      });
  },
});

export const matchmakingActions = matchmakingSlice.actions;
export default matchmakingSlice;
