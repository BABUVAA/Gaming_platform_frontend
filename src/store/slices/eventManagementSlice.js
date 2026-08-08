import { createSlice } from "@reduxjs/toolkit";
import createApiThunk from "../thunks/createApiThunk";

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

const eventManagementSlice = createSlice({
  name: "eventManagement",
  initialState: {
    error: null,
    games: [],
    pagination: {},
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
