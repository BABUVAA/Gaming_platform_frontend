import { createSlice } from "@reduxjs/toolkit";
import createApiThunk from "../thunks/createApiThunk";

export const fetchEventReviewQueue = createApiThunk(
  "eventReview/fetchQueue",
  {
    path: "/api/admin/events",
    selectData: (response) =>
      response.data?.data || { pagination: {}, runs: [], templates: [] },
    errorMessage: "Unable to load the Event review queue.",
    toast: { error: true },
  },
);

const createReviewThunk = ({ name, path, responseKey }) =>
  createApiThunk(`eventReview/${name}`, {
    getBody: ({ action, note }) => ({ action, note }),
    method: "patch",
    path,
    selectData: (response) => response.data?.data?.[responseKey],
    errorMessage: "Unable to record this Event review decision.",
    toast: { success: true, error: true },
  });

export const reviewEventTemplate = createReviewThunk({
  name: "reviewTemplate",
  path: ({ arg }) => `/api/admin/events/templates/${arg.templateId}/review`,
  responseKey: "template",
});

export const reviewEventRun = createReviewThunk({
  name: "reviewRun",
  path: ({ arg }) => `/api/admin/events/runs/${arg.runId}/review`,
  responseKey: "run",
});

const replaceRecord = (records, replacement) => {
  const index = records.findIndex((record) => record._id === replacement._id);
  if (index === -1) return;
  records[index] = replacement;
};

const eventReviewSlice = createSlice({
  name: "eventReview",
  initialState: {
    error: null,
    pagination: {},
    runs: [],
    status: "idle",
    templates: [],
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEventReviewQueue.pending, (state) => {
        state.error = null;
        state.status = "loading";
      })
      .addCase(fetchEventReviewQueue.fulfilled, (state, action) => {
        state.pagination = action.payload.pagination || {};
        state.runs = action.payload.runs;
        state.status = "succeeded";
        state.templates = action.payload.templates;
      })
      .addCase(fetchEventReviewQueue.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
        state.status = "failed";
      })
      .addCase(reviewEventTemplate.fulfilled, (state, action) => {
        replaceRecord(state.templates, action.payload);
      })
      .addCase(reviewEventRun.fulfilled, (state, action) => {
        replaceRecord(state.runs, action.payload);
      });
  },
});

export default eventReviewSlice;
