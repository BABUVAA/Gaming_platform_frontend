import { createSlice } from "@reduxjs/toolkit";
import createApiThunk from "../thunks/createApiThunk.js";

export const fetchQuickMatchOfferings = createApiThunk(
  "quickMatchOfferings/fetchAll",
  {
    path: "/api/staff/tournaments/offerings",
    selectData: (response) => response.data?.data?.offerings || [],
    errorMessage: "Unable to load Quick Match offerings.",
    toast: { error: true },
  },
);

export const fetchTournamentManagerGames = createApiThunk(
  "quickMatchOfferings/fetchManagerGames",
  {
    path: "/api/staff/tournaments/games",
    selectData: (response) => response.data?.data?.games || [],
    errorMessage: "Unable to load assigned tournament games.",
    toast: { error: true },
  },
);

export const fetchPlayerQuickMatchOfferings = createApiThunk(
  "quickMatchOfferings/fetchPlayerDiscovery",
  {
    path: "/api/player/quick-matches",
    selectData: (response) => response.data?.data || [],
    errorMessage: "Unable to load available tournaments.",
  },
);

export const fetchPlayerQuickMatchOfferingById = createApiThunk(
  "quickMatchOfferings/fetchPlayerDetail",
  {
    path: ({ arg }) => `/api/player/quick-matches/${arg}`,
    selectData: (response) =>
      response.data?.data?.offering || response.data?.data,
    errorMessage: "Unable to load this tournament.",
  },
);

export const fetchPlayerQuickMatchLeaderboard = createApiThunk(
  "quickMatchOfferings/fetchPlayerLeaderboard",
  {
    path: ({ arg }) => `/api/player/quick-matches/${arg}/leaderboard`,
    selectData: (response) => response.data?.data?.room || null,
    errorMessage: "Unable to load this tournament leaderboard.",
  },
);

export const createQuickMatchOffering = createApiThunk(
  "quickMatchOfferings/create",
  {
    method: "post",
    path: "/api/staff/tournaments/offerings",
    selectData: (response) => response.data?.data?.offering,
    errorMessage: "Unable to create this Quick Match offering.",
    toast: { success: true, error: true },
  },
);

export const updateQuickMatchOffering = createApiThunk(
  "quickMatchOfferings/update",
  {
    method: "patch",
    path: ({ arg }) => `/api/staff/tournaments/offerings/${arg.offeringId}`,
    getBody: (payload) => {
      const changes = { ...payload };
      delete changes.offeringId;
      return changes;
    },
    selectData: (response) => response.data?.data?.offering,
    errorMessage: "Unable to update this Quick Match offering.",
    toast: { success: true, error: true },
  },
);

const upsertOffering = (offerings, offering) => {
  const index = offerings.findIndex((item) => item._id === offering?._id);
  if (index >= 0) offerings[index] = offering;
  else if (offering) offerings.unshift(offering);
};

const quickMatchOfferingSlice = createSlice({
  name: "quickMatchOfferings",
  initialState: {
    error: null,
    games: [],
    gamesStatus: "idle",
    offerings: [],
    playerError: null,
    playerDetails: {},
    playerDetailErrorsById: {},
    playerDetailRequestIdsById: {},
    playerDetailStatusById: {},
    playerOfferings: [],
    playerLeaderboards: {},
    playerLeaderboardStatusById: {},
    playerLeaderboardErrorsById: {},
    playerStatus: "idle",
    requestId: null,
    status: "idle",
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuickMatchOfferings.pending, (state, action) => {
        state.error = null;
        state.requestId = action.meta.requestId;
        state.status = "loading";
      })
      .addCase(fetchQuickMatchOfferings.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.offerings = action.payload;
        state.requestId = null;
        state.status = "succeeded";
      })
      .addCase(fetchQuickMatchOfferings.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.error = action.meta.aborted
          ? null
          : action.payload || action.error.message;
        state.requestId = null;
        state.status = action.meta.aborted ? "idle" : "failed";
      })
      .addCase(fetchTournamentManagerGames.pending, (state) => {
        state.gamesStatus = "loading";
      })
      .addCase(fetchTournamentManagerGames.fulfilled, (state, action) => {
        state.games = Array.isArray(action.payload) ? action.payload : [];
        state.gamesStatus = "succeeded";
      })
      .addCase(fetchTournamentManagerGames.rejected, (state, action) => {
        state.gamesStatus = action.meta.aborted ? "idle" : "failed";
      })
      .addCase(fetchPlayerQuickMatchOfferings.pending, (state) => {
        state.playerError = null;
        state.playerStatus = "loading";
      })
      .addCase(fetchPlayerQuickMatchOfferings.fulfilled, (state, action) => {
        state.playerOfferings = Array.isArray(action.payload)
          ? action.payload
          : [];
        state.playerStatus = "succeeded";
      })
      .addCase(fetchPlayerQuickMatchOfferings.rejected, (state, action) => {
        state.playerError = action.payload || action.error.message;
        state.playerStatus = action.meta.aborted ? "idle" : "failed";
      })
      .addCase(fetchPlayerQuickMatchOfferingById.pending, (state, action) => {
        state.playerDetailErrorsById[action.meta.arg] = null;
        state.playerDetailRequestIdsById[action.meta.arg] =
          action.meta.requestId;
        state.playerDetailStatusById[action.meta.arg] = "loading";
      })
      .addCase(fetchPlayerQuickMatchOfferingById.fulfilled, (state, action) => {
        if (
          state.playerDetailRequestIdsById[action.meta.arg] !==
          action.meta.requestId
        ) {
          return;
        }
        state.playerDetailRequestIdsById[action.meta.arg] = null;
        if (action.payload?._id) {
          state.playerDetails[action.meta.arg] = action.payload;
          state.playerDetailStatusById[action.meta.arg] = "succeeded";
        } else {
          state.playerDetailStatusById[action.meta.arg] = "failed";
          state.playerDetailErrorsById[action.meta.arg] = {
            message: "Tournament detail response is invalid.",
          };
        }
      })
      .addCase(fetchPlayerQuickMatchOfferingById.rejected, (state, action) => {
        if (
          state.playerDetailRequestIdsById[action.meta.arg] !==
          action.meta.requestId
        ) {
          return;
        }
        state.playerDetailRequestIdsById[action.meta.arg] = null;
        state.playerDetailStatusById[action.meta.arg] = action.meta.aborted
          ? "idle"
          : "failed";
        state.playerDetailErrorsById[action.meta.arg] = action.meta.aborted
          ? null
          : action.payload || action.error;
      })
      .addCase(fetchPlayerQuickMatchLeaderboard.pending, (state, action) => {
        state.playerLeaderboardErrorsById[action.meta.arg] = null;
        state.playerLeaderboardStatusById[action.meta.arg] = "loading";
      })
      .addCase(fetchPlayerQuickMatchLeaderboard.fulfilled, (state, action) => {
        state.playerLeaderboards[action.meta.arg] = action.payload;
        state.playerLeaderboardStatusById[action.meta.arg] = "succeeded";
      })
      .addCase(fetchPlayerQuickMatchLeaderboard.rejected, (state, action) => {
        state.playerLeaderboardErrorsById[action.meta.arg] = action.meta.aborted ? null : action.payload || action.error;
        state.playerLeaderboardStatusById[action.meta.arg] = action.meta.aborted ? "idle" : "failed";
      })
      .addCase(createQuickMatchOffering.fulfilled, (state, action) => {
        upsertOffering(state.offerings, action.payload);
      })
      .addCase(updateQuickMatchOffering.fulfilled, (state, action) => {
        upsertOffering(state.offerings, action.payload);
      });
  },
});

export default quickMatchOfferingSlice;
