import { createSlice } from "@reduxjs/toolkit";
import createApiThunk from "../thunks/createApiThunk.js";

const playerParticipationCondition = {
  condition: (_, { getState }) =>
    getState().player?.summary?.role !== "staff",
};

export const fetchPlayerMatchActivity = createApiThunk(
  "matchActivity/fetchActivity",
  {
    request: async ({ api, signal }) => {
      const [queuesResponse, matchesResponse] = await Promise.all([
        api.get("/api/matches/queues", { signal }),
        api.get("/api/matches", { signal }),
      ]);
      return {
        data: {
          matches: matchesResponse.data?.data || [],
          queues: queuesResponse.data?.data || [],
        },
      };
    },
    selectData: (response) => response.data,
    errorMessage: "Unable to load your match activity.",
    toast: { error: true },
  },
);

export const fetchPlayerMatch = createApiThunk(
  "matchActivity/fetchMatch",
  {
    path: ({ arg }) => `/api/matches/${arg}`,
    selectData: (response) => response.data?.data || null,
    errorMessage: "Unable to load this match room.",
    toast: { error: true },
  },
);

export const raisePlayerMatchDispute = createApiThunk(
  "matchActivity/raiseDispute",
  {
    path: ({ arg }) => `/api/matches/${arg.matchId}/dispute`,
    method: "patch",
    getBody: ({ reason }) => ({ reason }),
    selectData: (response) => response.data?.data || null,
    errorMessage: "Unable to raise this match dispute.",
    toast: { success: true, error: true },
  },
  playerParticipationCondition,
);

const initialState = {
  actionStatus: "idle",
  activity: [],
  activityError: null,
  activityStatus: "idle",
  selectedError: null,
  selectedMatch: null,
  selectedStatus: "idle",
};

const getActivityTime = (activity) =>
  new Date(activity.createdAt || activity.scheduledFor || 0).getTime();

const matchCommands = [raisePlayerMatchDispute];

const matchActivitySlice = createSlice({
  name: "matchActivity",
  initialState,
  reducers: {
    clearSelectedMatch(state) {
      state.selectedError = null;
      state.selectedMatch = null;
      state.selectedStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlayerMatchActivity.pending, (state) => {
        state.activityError = null;
        state.activityStatus = "loading";
      })
      .addCase(fetchPlayerMatchActivity.fulfilled, (state, action) => {
        const queues = Array.isArray(action.payload?.queues)
          ? action.payload.queues
          : [];
        const matches = Array.isArray(action.payload?.matches)
          ? action.payload.matches
          : [];
        state.activity = [...queues, ...matches].sort(
          (first, second) => getActivityTime(second) - getActivityTime(first),
        );
        state.activityStatus = "succeeded";
      })
      .addCase(fetchPlayerMatchActivity.rejected, (state, action) => {
        if (action.meta.aborted) {
          state.activityStatus = "idle";
          return;
        }
        state.activityError = action.payload;
        state.activityStatus = "failed";
      })
      .addCase(fetchPlayerMatch.pending, (state) => {
        state.selectedError = null;
        state.selectedStatus = "loading";
      })
      .addCase(fetchPlayerMatch.fulfilled, (state, action) => {
        state.selectedMatch = action.payload;
        state.selectedStatus = "succeeded";
      })
      .addCase(fetchPlayerMatch.rejected, (state, action) => {
        if (action.meta.aborted) {
          state.selectedStatus = "idle";
          return;
        }
        state.selectedError = action.payload;
        state.selectedMatch = null;
        state.selectedStatus = "failed";
      });

    matchCommands.forEach((command) => {
      builder
        .addCase(command.pending, (state) => {
          state.actionStatus = "loading";
        })
        .addCase(command.fulfilled, (state, action) => {
          state.actionStatus = "succeeded";
          if (action.payload) state.selectedMatch = action.payload;
        })
        .addCase(command.rejected, (state, action) => {
          if (action.meta.condition) return;
          state.actionStatus = action.meta.aborted ? "idle" : "failed";
        });
    });
  },
});

export const matchActivityActions = matchActivitySlice.actions;
export default matchActivitySlice;
