import { createSlice } from "@reduxjs/toolkit";
import createApiThunk from "../thunks/createApiThunk.js";

// Game Manager data stays separate from the admin catalog. This endpoint is
// read-only operational visibility, not a path to change game configuration.
export const fetchManagedGameOperations = createApiThunk(
  "gameManagement/fetchManagedGameOperations",
  {
    path: "/api/staff/games/operations",
    selectData: (response) => response.data?.data?.operations || [],
    errorMessage: "Unable to load assigned game operations.",
    toast: { error: true },
  },
);

export const fetchManagedVerificationRequests = createApiThunk(
  "gameManagement/fetchManagedVerificationRequests",
  {
    path: "/api/staff/games/verification-requests",
    getParams: ({ cursor, limit = 25, status = "pending" } = {}) => ({ status, limit, ...(cursor ? { cursor } : {}) }),
    selectData: (response) => response.data?.data || { items: [], page: {} },
    errorMessage: "Unable to load game-account verification requests.",
    toast: { error: true },
  },
);

export const reviewManagedVerificationRequest = createApiThunk(
  "gameManagement/reviewManagedVerificationRequest",
  {
    method: "patch",
    path: ({ arg }) => `/api/staff/games/verification-requests/${arg.requestId}`,
    getBody: ({ reviewNote, status }) => ({ status, reviewNote }),
    selectData: (response) => response.data?.data?.request,
    errorMessage: "Unable to record this verification decision.",
    toast: { success: "Verification decision recorded.", error: true },
  },
);

export const scheduleManagedMatch = createApiThunk(
  "gameManagement/scheduleManagedMatch",
  {
    method: "patch",
    path: ({ arg }) => `/api/staff/games/matches/${arg.matchId}/schedule`,
    getBody: ({ instructions, roomCode, roomPassword, scheduledFor }) => ({
      instructions,
      roomCode,
      roomPassword,
      scheduledFor,
    }),
    selectData: (response) => response.data?.data?.match,
    errorMessage: "Unable to schedule this Match.",
    toast: { success: "Match schedule saved.", error: true },
  },
);

const eventReadThunk = (type, suffix, fallback) => createApiThunk(
  `gameManagement/${type}`,
  {
    path: ({ arg }) => `/api/staff/games/events/${arg.runId}/${suffix}`,
    getParams: ({ cursor, status } = {}) => ({ limit: 25, ...(cursor ? { cursor } : {}), ...(status && status !== "all" ? { status } : {}) }),
    selectData: (response) => response.data?.data || fallback,
    errorMessage: `Unable to load Event ${suffix}.`,
    toast: { error: true },
  },
);

export const fetchGameManagerEventOperations = eventReadThunk("fetchEventOperations", "operations", null);
export const fetchGameManagerEventRegistrations = eventReadThunk("fetchEventRegistrations", "registrations", { items: [], page: {} });
export const fetchGameManagerEventMatches = eventReadThunk("fetchEventMatches", "matches", { items: [], page: {} });
export const fetchGameManagerEventStandings = eventReadThunk("fetchEventStandings", "standings", { standings: [] });

const appendUnique = (current = [], additions = [], getKey = (item) => item.id) => {
  const rows = new Map(current.map((item) => [getKey(item), item]));
  additions.forEach((item) => rows.set(getKey(item), item));
  return [...rows.values()];
};

const gameManagementSlice = createSlice({
  name: "gameManagement",
  initialState: { error: null, eventMatches: {}, eventOperations: {}, eventRegistrations: {}, eventStandings: {}, operations: [], schedule: { error: null, matchId: null, status: "idle" }, status: "idle", verification: { actionError: null, actionStatus: "idle", error: null, items: [], page: {}, status: "idle" } },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchManagedGameOperations.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchManagedGameOperations.fulfilled, (state, action) => {
        state.operations = action.payload;
        state.status = "succeeded";
      })
      .addCase(fetchManagedGameOperations.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
        state.status = "failed";
      })
      .addCase(fetchGameManagerEventOperations.fulfilled, (state, action) => {
        state.eventOperations[action.meta.arg.runId] = action.payload;
      })
      .addCase(fetchGameManagerEventRegistrations.fulfilled, (state, action) => {
        const { cursor, runId } = action.meta.arg;
        const current = state.eventRegistrations[runId];
        state.eventRegistrations[runId] = { ...action.payload, items: cursor ? appendUnique(current?.items, action.payload.items) : action.payload.items };
      })
      .addCase(fetchGameManagerEventMatches.fulfilled, (state, action) => {
        const { cursor, runId } = action.meta.arg;
        const current = state.eventMatches[runId];
        state.eventMatches[runId] = { ...action.payload, items: cursor ? appendUnique(current?.items, action.payload.items, (item) => item.batch.id) : action.payload.items };
      })
      .addCase(fetchGameManagerEventStandings.fulfilled, (state, action) => {
        const { cursor, runId } = action.meta.arg;
        const current = state.eventStandings[runId];
        state.eventStandings[runId] = { ...action.payload, standings: cursor ? appendUnique(current?.standings, action.payload.standings, (item) => `${item.placement}:${item.player?.profileTag}`) : action.payload.standings };
      })
      .addCase(fetchManagedVerificationRequests.pending, (state) => {
        state.verification.status = "loading";
        state.verification.error = null;
      })
      .addCase(fetchManagedVerificationRequests.fulfilled, (state, action) => {
        state.verification.items = action.meta.arg?.cursor ? appendUnique(state.verification.items, action.payload.items) : action.payload.items;
        state.verification.page = action.payload.page || {};
        state.verification.status = "succeeded";
      })
      .addCase(fetchManagedVerificationRequests.rejected, (state, action) => {
        state.verification.error = action.payload || action.error.message;
        state.verification.status = "failed";
      })
      .addCase(reviewManagedVerificationRequest.pending, (state) => {
        state.verification.actionStatus = "loading";
        state.verification.actionError = null;
      })
      .addCase(reviewManagedVerificationRequest.fulfilled, (state, action) => {
        state.verification.items = state.verification.items.filter((item) => item.id !== action.payload.id);
        state.verification.actionStatus = "succeeded";
      })
      .addCase(reviewManagedVerificationRequest.rejected, (state, action) => {
        state.verification.actionError = action.payload || action.error.message;
        state.verification.actionStatus = "failed";
      })
      .addCase(scheduleManagedMatch.pending, (state, action) => {
        state.schedule.error = null;
        state.schedule.matchId = action.meta.arg.matchId;
        state.schedule.status = "loading";
      })
      .addCase(scheduleManagedMatch.fulfilled, (state) => {
        state.schedule.matchId = null;
        state.schedule.status = "succeeded";
      })
      .addCase(scheduleManagedMatch.rejected, (state, action) => {
        state.schedule.error = action.payload || action.error;
        state.schedule.matchId = null;
        state.schedule.status = action.meta.aborted ? "idle" : "failed";
      });
  },
});

export default gameManagementSlice;
