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
  initialState: { error: null, eventMatches: {}, eventOperations: {}, eventRegistrations: {}, eventStandings: {}, operations: [], status: "idle" },
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
      });
  },
});

export default gameManagementSlice;
