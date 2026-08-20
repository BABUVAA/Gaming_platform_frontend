import { createSlice } from "@reduxjs/toolkit";
import createApiThunk from "../thunks/createApiThunk.js";

export const fetchManagedEvents = createApiThunk(
  "eventManagement/fetchManagedEvents",
  {
    path: "/api/staff/events",
    selectData: (response) =>
      response.data?.data || {
        pagination: {},
        runs: [],
        templates: [],
      },
    errorMessage: "Unable to load your Events.",
    toast: { error: true },
  },
);

export const fetchScopedEventGames = createApiThunk(
  "eventManagement/fetchScopedGames",
  {
    path: "/api/staff/events/games",
    selectData: (response) => response.data?.data?.games || [],
    errorMessage: "Unable to load your assigned games.",
    toast: { error: true },
  },
);

export const fetchManagedEventOperations = createApiThunk(
  "eventManagement/fetchOperations",
  {
    path: ({ arg: runId }) => `/api/staff/events/runs/${runId}/operations`,
    selectData: (response) => response.data?.data,
    errorMessage: "Unable to load Event operations.",
    toast: { error: true },
  },
);

export const fetchManagedEventRegistrations = createApiThunk(
  "eventManagement/fetchRegistrations",
  {
    path: ({ arg }) => `/api/staff/events/runs/${arg.runId}/registrations`,
    getParams: ({ cursor, status } = {}) => ({
      limit: 25,
      ...(cursor ? { cursor } : {}),
      ...(status && status !== "all" ? { status } : {}),
    }),
    selectData: (response) => response.data?.data || { items: [], page: {} },
    errorMessage: "Unable to load Event registrations.",
    toast: { error: true },
  },
);

export const fetchManagedEventMatches = createApiThunk(
  "eventManagement/fetchMatches",
  {
    path: ({ arg }) => `/api/staff/events/runs/${arg.runId}/matches`,
    getParams: ({ cursor } = {}) => ({
      limit: 25,
      ...(cursor ? { cursor } : {}),
    }),
    selectData: (response) => response.data?.data || { items: [], page: {} },
    errorMessage: "Unable to load Event Matches.",
    toast: { error: true },
  },
);

export const fetchManagedEventStandings = createApiThunk(
  "eventManagement/fetchStandings",
  {
    path: ({ arg }) => `/api/staff/events/runs/${arg.runId}/standings`,
    getParams: ({ cursor } = {}) => ({ limit: 25, ...(cursor ? { cursor } : {}) }),
    selectData: (response) => response.data?.data || { standings: [] },
    errorMessage: "Unable to load Event standings.",
    toast: { error: true },
  },
);

export const fetchEligibleEventOperators = createApiThunk(
  "eventManagement/fetchEligibleOperators",
  { path: ({ arg: runId }) => `/api/staff/events/runs/${runId}/operators`, selectData: (response) => response.data?.data?.operators || [], errorMessage: "Unable to load Match Operators." },
);

export const assignManagedEventOperator = createApiThunk(
  "eventManagement/assignOperator",
  { method: "patch", path: ({ arg }) => `/api/staff/events/runs/${arg.runId}/matches/${arg.matchId}/operator`, getBody: ({ operatorId }) => ({ operatorId }), selectData: (response) => response.data?.data?.assignment, errorMessage: "Unable to assign this Match Operator.", toast: { success: true, error: true } },
);

export const createManagedEventTemplate = createApiThunk(
  "eventManagement/createTemplate",
  {
    method: "post",
    path: "/api/staff/events/templates",
    selectData: (response) => response.data?.data?.template,
    errorMessage: "Unable to save this Event template draft.",
    toast: { success: true, error: true },
  },
);

export const createManagedEventRun = createApiThunk(
  "eventManagement/createRun",
  {
    method: "post",
    path: "/api/staff/events/runs",
    selectData: (response) => response.data?.data?.run,
    errorMessage: "Unable to save this Event run draft.",
    toast: { success: true, error: true },
  },
);

export const updateManagedEventTemplate = createApiThunk(
  "eventManagement/updateTemplate",
  {
    getBody: ({ changes }) => changes,
    method: "patch",
    path: ({ arg }) => `/api/staff/events/templates/${arg.templateId}`,
    selectData: (response) => response.data?.data?.template,
    errorMessage: "Unable to update this Event template draft.",
    toast: { success: true, error: true },
  },
);

export const updateManagedEventRun = createApiThunk(
  "eventManagement/updateRun",
  {
    getBody: ({ changes }) => changes,
    method: "patch",
    path: ({ arg }) => `/api/staff/events/runs/${arg.runId}`,
    selectData: (response) => response.data?.data?.run,
    errorMessage: "Unable to update this Event run draft.",
    toast: { success: true, error: true },
  },
);

export const submitManagedEventTemplate = createApiThunk(
  "eventManagement/submitTemplate",
  {
    getBody: () => ({}),
    method: "post",
    path: ({ arg: templateId }) =>
      `/api/staff/events/templates/${templateId}/submit`,
    selectData: (response) => response.data?.data?.template,
    errorMessage: "Unable to submit this Event template.",
    toast: { success: true, error: true },
  },
);

export const submitManagedEventRun = createApiThunk(
  "eventManagement/submitRun",
  {
    getBody: () => ({}),
    method: "post",
    path: ({ arg: runId }) => `/api/staff/events/runs/${runId}/submit`,
    selectData: (response) => response.data?.data?.run,
    errorMessage: "Unable to submit this Event run.",
    toast: { success: true, error: true },
  },
);

const replaceRecord = (records, replacement) => {
  const index = records.findIndex((record) => record._id === replacement._id);
  if (index === -1) {
    records.unshift(replacement);
    return;
  }
  records[index] = replacement;
};

const appendUnique = (current = [], additions = []) => {
  const records = new Map(current.map((item) => [item.id, item]));
  additions.forEach((item) => records.set(item.id, item));
  return [...records.values()];
};

const eventManagementSlice = createSlice({
  name: "eventManagement",
  initialState: {
    error: null,
    eligibleOperatorsByRunId: {},
    games: [],
    matchesByRunId: {},
    operationsByRunId: {},
    operationsErrorByRunId: {},
    operationsRequestByRunId: {},
    operationsStatusByRunId: {},
    pagination: {},
    registrationsByRunId: {},
    standingsByRunId: {},
    runs: [],
    status: "idle",
    templates: [],
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchManagedEvents.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchManagedEvents.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.pagination = action.payload.pagination || {};
        state.templates = action.payload.templates;
        state.runs = action.payload.runs;
      })
      .addCase(fetchManagedEvents.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchScopedEventGames.fulfilled, (state, action) => {
        state.games = action.payload;
      })
      .addCase(fetchManagedEventOperations.pending, (state, action) => {
        const runId = action.meta.arg;
        state.operationsErrorByRunId[runId] = null;
        state.operationsRequestByRunId[runId] = action.meta.requestId;
        state.operationsStatusByRunId[runId] = "loading";
      })
      .addCase(fetchManagedEventOperations.fulfilled, (state, action) => {
        const runId = action.meta.arg;
        if (state.operationsRequestByRunId[runId] !== action.meta.requestId) return;
        state.operationsByRunId[runId] = action.payload;
        state.operationsRequestByRunId[runId] = null;
        state.operationsStatusByRunId[runId] = "succeeded";
      })
      .addCase(fetchManagedEventOperations.rejected, (state, action) => {
        const runId = action.meta.arg;
        if (state.operationsRequestByRunId[runId] !== action.meta.requestId) return;
        state.operationsRequestByRunId[runId] = null;
        state.operationsStatusByRunId[runId] = action.meta.aborted ? "idle" : "failed";
        if (!action.meta.aborted) state.operationsErrorByRunId[runId] = action.payload?.message || action.error.message;
      })
      .addCase(fetchManagedEventRegistrations.pending, (state, action) => {
        const { runId } = action.meta.arg;
        const current = state.registrationsByRunId[runId] || {};
        state.registrationsByRunId[runId] = { ...current, error: null, requestId: action.meta.requestId, status: "loading" };
      })
      .addCase(fetchManagedEventRegistrations.fulfilled, (state, action) => {
        const { cursor, runId, status = "all" } = action.meta.arg;
        const current = state.registrationsByRunId[runId] || {};
        if (current.requestId !== action.meta.requestId) return;
        state.registrationsByRunId[runId] = {
          error: null,
          filter: status,
          items: cursor ? appendUnique(current.items, action.payload.items) : action.payload.items,
          nextCursor: action.payload.page?.nextCursor || null,
          requestId: null,
          status: "succeeded",
        };
      })
      .addCase(fetchManagedEventRegistrations.rejected, (state, action) => {
        const { runId } = action.meta.arg;
        const current = state.registrationsByRunId[runId] || {};
        if (current.requestId !== action.meta.requestId) return;
        state.registrationsByRunId[runId] = {
          ...current,
          error: action.meta.aborted ? null : action.payload?.message || action.error.message,
          requestId: null,
          status: action.meta.aborted ? "idle" : "failed",
        };
      })
      .addCase(fetchManagedEventMatches.pending, (state, action) => {
        const { runId } = action.meta.arg;
        const current = state.matchesByRunId[runId] || {};
        state.matchesByRunId[runId] = { ...current, error: null, requestId: action.meta.requestId, status: "loading" };
      })
      .addCase(fetchManagedEventMatches.fulfilled, (state, action) => {
        const { cursor, runId } = action.meta.arg;
        const current = state.matchesByRunId[runId] || {};
        if (current.requestId !== action.meta.requestId) return;
        state.matchesByRunId[runId] = {
          error: null,
          items: cursor ? appendUnique(current.items, action.payload.items) : action.payload.items,
          nextCursor: action.payload.page?.nextCursor || null,
          requestId: null,
          status: "succeeded",
        };
      })
      .addCase(fetchManagedEventMatches.rejected, (state, action) => {
        const { runId } = action.meta.arg;
        const current = state.matchesByRunId[runId] || {};
        if (current.requestId !== action.meta.requestId) return;
        state.matchesByRunId[runId] = {
          ...current,
          error: action.meta.aborted ? null : action.payload?.message || action.error.message,
          requestId: null,
          status: action.meta.aborted ? "idle" : "failed",
        };
      })
      .addCase(fetchManagedEventStandings.fulfilled, (state, action) => {
        const { cursor, runId } = action.meta.arg;
        const current = state.standingsByRunId[runId];
        const keyed = new Map((cursor ? current?.standings || [] : []).map((row) => [`${row.placement}:${row.player?.profileTag}`, row]));
        action.payload.standings.forEach((row) => keyed.set(`${row.placement}:${row.player?.profileTag}`, row));
        state.standingsByRunId[runId] = { ...action.payload, standings: [...keyed.values()] };
      })
      .addCase(fetchEligibleEventOperators.fulfilled, (state, action) => {
        state.eligibleOperatorsByRunId[action.meta.arg] = action.payload;
      })
      .addCase(assignManagedEventOperator.fulfilled, (state, action) => {
        const { matchId, runId } = action.meta.arg;
        const item = state.matchesByRunId[runId]?.items?.find((row) => row.match?.id === matchId);
        if (item?.match) { item.match.assignedOperator = action.payload.operator; item.match.status = action.payload.status; }
      })
      .addCase(createManagedEventTemplate.fulfilled, (state, action) => {
        state.templates.unshift(action.payload);
      })
      .addCase(createManagedEventRun.fulfilled, (state, action) => {
        state.runs.unshift(action.payload);
      })
      .addCase(updateManagedEventTemplate.fulfilled, (state, action) => {
        replaceRecord(state.templates, action.payload);
      })
      .addCase(updateManagedEventRun.fulfilled, (state, action) => {
        replaceRecord(state.runs, action.payload);
      })
      .addCase(submitManagedEventTemplate.fulfilled, (state, action) => {
        replaceRecord(state.templates, action.payload);
      })
      .addCase(submitManagedEventRun.fulfilled, (state, action) => {
        replaceRecord(state.runs, action.payload);
      });
  },
});

export default eventManagementSlice;
