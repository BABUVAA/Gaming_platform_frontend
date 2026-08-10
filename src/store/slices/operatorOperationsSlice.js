import { createSlice } from "@reduxjs/toolkit";
import createApiThunk from "../thunks/createApiThunk.js";

const selectEnvelopeData = (response) => response.data?.data;

export const fetchOperatorWorkspace = createApiThunk(
  "operatorOperations/fetchWorkspace",
  {
    request: async ({ api, signal }) => {
      const [dashboard, matches, unassigned] = await Promise.all([
        api.get("/api/operator/dashboard", { signal }),
        api.get("/api/operator/matches", { signal }),
        api.get("/api/operator/matches/unassigned", { signal }),
      ]);

      return { dashboard, matches, unassigned };
    },
    selectData: ({ dashboard, matches, unassigned }) => ({
      dashboard: selectEnvelopeData(dashboard) || null,
      matches: selectEnvelopeData(matches) || [],
      unassigned: selectEnvelopeData(unassigned) || [],
    }),
    errorMessage: "Unable to load operator activity.",
    toast: { error: true },
  },
);

export const claimOperatorMatch = createApiThunk(
  "operatorOperations/claimMatch",
  {
    method: "patch",
    path: ({ arg }) => `/api/operator/matches/${arg}/claim`,
    selectData: selectEnvelopeData,
    errorMessage: "Unable to take this match.",
    toast: { success: "Match added to your shift.", error: true },
  },
  {
    condition: (_, { getState }) =>
      getState().operatorOperations.actionStatus !== "loading",
  },
);

export const publishOperatorLobby = createApiThunk(
  "operatorOperations/publishLobby",
  {
    method: "patch",
    path: ({ arg }) => `/api/operator/matches/${arg.matchId}/lobby`,
    getBody: ({ lobby }) => lobby,
    selectData: selectEnvelopeData,
    errorMessage: "Unable to publish lobby details.",
    toast: { success: "Lobby shared with players.", error: true },
  },
  {
    condition: (_, { getState }) =>
      getState().operatorOperations.actionStatus !== "loading",
  },
);

export const executeOperatorMatchCommand = createApiThunk(
  "operatorOperations/executeCommand",
  {
    method: "patch",
    path: ({ arg }) =>
      `/api/operator/matches/${arg.matchId}/commands/${arg.command}`,
    getBody: ({ body }) => body,
    selectData: selectEnvelopeData,
    errorMessage: "Unable to complete this match action.",
    toast: { success: true, error: true },
  },
  {
    condition: (_, { getState }) =>
      getState().operatorOperations.actionStatus !== "loading",
  },
);

const upsertAssignedMatch = (state, match) => {
  if (!match?._id) return;
  const index = state.matches.findIndex((item) => item._id === match._id);
  if (index >= 0) state.matches[index] = match;
  else state.matches.unshift(match);
};

const operatorOperationsSlice = createSlice({
  name: "operatorOperations",
  initialState: {
    actionError: null,
    actionStatus: "idle",
    activeAction: "",
    dashboard: null,
    error: null,
    matches: [],
    status: "idle",
    unassigned: [],
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOperatorWorkspace.pending, (state) => {
        state.error = null;
        state.status = "loading";
      })
      .addCase(fetchOperatorWorkspace.fulfilled, (state, action) => {
        state.dashboard = action.payload.dashboard;
        state.matches = action.payload.matches;
        state.unassigned = action.payload.unassigned;
        state.status = "succeeded";
      })
      .addCase(fetchOperatorWorkspace.rejected, (state, action) => {
        state.error = action.meta.aborted
          ? null
          : action.payload || action.error.message;
        state.status = action.meta.aborted ? "idle" : "failed";
      });

    [
      [claimOperatorMatch, "claim"],
      [publishOperatorLobby, "lobby"],
      [executeOperatorMatchCommand, "command"],
    ].forEach(([thunk, actionName]) => {
      builder
        .addCase(thunk.pending, (state, action) => {
          const matchId = action.meta.arg?.matchId || action.meta.arg;
          state.actionError = null;
          state.actionStatus = "loading";
          state.activeAction = `${matchId}:${actionName}`;
        })
        .addCase(thunk.fulfilled, (state, action) => {
          upsertAssignedMatch(state, action.payload);
          state.unassigned = state.unassigned.filter(
            (match) => match._id !== action.payload?._id,
          );
          state.actionStatus = "succeeded";
          state.activeAction = "";
        })
        .addCase(thunk.rejected, (state, action) => {
          if (!action.meta.condition) {
            state.actionError = action.meta.aborted
              ? null
              : action.payload || action.error.message;
            state.actionStatus = action.meta.aborted ? "idle" : "failed";
            state.activeAction = "";
          }
        });
    });
  },
});

export default operatorOperationsSlice;
