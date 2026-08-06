import { createSlice } from "@reduxjs/toolkit";
import createApiThunk from "../thunks/createApiThunk";

export const fetchManagedEvents = createApiThunk("eventManagement/fetchManagedEvents", {
  path: "/api/staff/events",
  selectData: (response) => response.data?.data || { runs: [], templates: [] },
  errorMessage: "Unable to load your Events.",
  toast: { error: true },
});

export const fetchScopedEventGames = createApiThunk("eventManagement/fetchScopedGames", {
  path: "/api/staff/events/games",
  selectData: (response) => response.data?.data?.games || [],
  errorMessage: "Unable to load your assigned games.",
  toast: { error: true },
});

export const createManagedEventTemplate = createApiThunk(
  "eventManagement/createTemplate",
  {
    method: "post",
    path: "/api/staff/events/templates",
    selectData: (response) => response.data?.data?.template,
    errorMessage: "Unable to create this Event template.",
    toast: { success: true, error: true },
  },
);

export const createManagedEventRun = createApiThunk("eventManagement/createRun", {
  method: "post",
  path: "/api/staff/events/runs",
  selectData: (response) => response.data?.data?.run,
  errorMessage: "Unable to schedule this Event.",
  toast: { success: true, error: true },
});

const eventManagementSlice = createSlice({
  name: "eventManagement",
  initialState: { error: null, games: [], runs: [], status: "idle", templates: [] },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchManagedEvents.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchManagedEvents.fulfilled, (state, action) => {
        state.status = "succeeded";
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
      });
  },
});

export default eventManagementSlice;
