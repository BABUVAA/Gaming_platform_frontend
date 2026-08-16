import { createSlice } from "@reduxjs/toolkit";
import createApiThunk from "../thunks/createApiThunk.js";

const data = (response) => response.data?.data;

export const fetchManagedStageAdjustments = createApiThunk("eventStageAdjustments/fetchManaged", {
  path: ({ arg: runId }) => `/api/staff/events/runs/${runId}/stage-adjustments`,
  selectData: (response) => data(response)?.adjustments || [],
  errorMessage: "Unable to load future-round proposals.",
  toast: { error: true },
});

export const proposeManagedStageAdjustment = createApiThunk("eventStageAdjustments/propose", {
  method: "post",
  path: ({ arg }) => `/api/staff/events/runs/${arg.runId}/stage-adjustments`,
  getBody: ({ definition, stageNumber }) => ({ definition, stageNumber }),
  selectData: (response) => data(response)?.adjustment,
  errorMessage: "Unable to submit the future-round proposal.",
  toast: { success: true, error: true },
}, {
  condition: ({ runId }, { getState }) => getState().eventStageAdjustments.actionByRunId[runId] !== "loading",
});

export const fetchStageAdjustmentReviewQueue = createApiThunk("eventStageAdjustments/fetchQueue", {
  path: "/api/admin/events/stage-adjustments",
  getParams: ({ cursor } = {}) => ({ limit: 25, ...(cursor ? { cursor } : {}) }),
  selectData: (response) => ({
    adjustments: data(response)?.adjustments || [],
    nextCursor: data(response)?.nextCursor || null,
  }),
  errorMessage: "Unable to load future-round reviews.",
  toast: { error: true },
});

export const reviewStageAdjustment = createApiThunk("eventStageAdjustments/review", {
  method: "patch",
  path: ({ arg }) => `/api/admin/events/stage-adjustments/${arg.adjustmentId}/review`,
  getBody: ({ action, note }) => ({ action, note }),
  selectData: (response) => data(response)?.adjustment,
  errorMessage: "Unable to review the future-round proposal.",
  toast: { success: true, error: true },
}, {
  condition: ({ adjustmentId }, { getState }) => getState().eventStageAdjustments.reviewById[adjustmentId] !== "loading",
});

const slice = createSlice({
  name: "eventStageAdjustments",
  initialState: {
    actionByRunId: {}, errorByRunId: {}, managedByRunId: {},
    queue: [], queueError: null, queueNextCursor: null, queueStatus: "idle", reviewById: {}, statusByRunId: {},
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchManagedStageAdjustments.pending, (state, action) => { state.statusByRunId[action.meta.arg] = "loading"; state.errorByRunId[action.meta.arg] = null; })
      .addCase(fetchManagedStageAdjustments.fulfilled, (state, action) => { state.statusByRunId[action.meta.arg] = "succeeded"; state.managedByRunId[action.meta.arg] = action.payload; })
      .addCase(fetchManagedStageAdjustments.rejected, (state, action) => { state.statusByRunId[action.meta.arg] = action.meta.aborted ? "idle" : "failed"; if (!action.meta.aborted) state.errorByRunId[action.meta.arg] = action.payload?.message || action.error.message; })
      .addCase(proposeManagedStageAdjustment.pending, (state, action) => { state.actionByRunId[action.meta.arg.runId] = "loading"; })
      .addCase(proposeManagedStageAdjustment.fulfilled, (state, action) => { const runId = action.meta.arg.runId; state.actionByRunId[runId] = "idle"; state.managedByRunId[runId] = [action.payload, ...(state.managedByRunId[runId] || [])]; })
      .addCase(proposeManagedStageAdjustment.rejected, (state, action) => { if (!action.meta.condition) state.actionByRunId[action.meta.arg.runId] = "idle"; })
      .addCase(fetchStageAdjustmentReviewQueue.pending, (state) => { state.queueError = null; state.queueStatus = "loading"; })
      .addCase(fetchStageAdjustmentReviewQueue.fulfilled, (state, action) => {
        const append = Boolean(action.meta.arg?.cursor);
        const rows = append ? [...state.queue, ...action.payload.adjustments] : action.payload.adjustments;
        state.queue = [...new Map(rows.map((item) => [item.id, item])).values()];
        state.queueNextCursor = action.payload.nextCursor;
        state.queueStatus = "succeeded";
      })
      .addCase(fetchStageAdjustmentReviewQueue.rejected, (state, action) => { state.queueError = action.meta.aborted ? null : action.payload?.message || action.error.message; state.queueStatus = action.meta.aborted ? "idle" : "failed"; })
      .addCase(reviewStageAdjustment.pending, (state, action) => { state.reviewById[action.meta.arg.adjustmentId] = "loading"; })
      .addCase(reviewStageAdjustment.fulfilled, (state, action) => { const id = action.meta.arg.adjustmentId; state.reviewById[id] = "idle"; state.queue = state.queue.filter((item) => item.id !== id); })
      .addCase(reviewStageAdjustment.rejected, (state, action) => { if (!action.meta.condition) state.reviewById[action.meta.arg.adjustmentId] = "idle"; });
  },
});

export default slice;
