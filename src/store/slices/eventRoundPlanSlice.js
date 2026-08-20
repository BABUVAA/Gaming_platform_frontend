import { createSlice } from "@reduxjs/toolkit";
import createApiThunk from "../thunks/createApiThunk.js";

const data = (response) => response.data?.data;

export const proposeEventRoundPlan = createApiThunk("eventRoundPlans/propose", {
  method: "post",
  path: ({ arg }) => `/api/staff/events/runs/${arg.runId}/round-plans`,
  getBody: ({ executionPlan }) => ({ executionPlan }),
  selectData: (response) => data(response)?.proposal,
  errorMessage: "Unable to submit the round plan.",
  toast: { success: true, error: true },
}, {
  condition: ({ runId }, { getState }) => getState().eventRoundPlans.actionByRunId[runId] !== "loading",
});

export const fetchEventRoundPlanQueue = createApiThunk("eventRoundPlans/fetchQueue", {
  path: "/api/admin/events/round-plans",
  getParams: ({ cursor } = {}) => ({ limit: 25, ...(cursor ? { cursor } : {}) }),
  selectData: (response) => ({ proposals: data(response)?.proposals || [], nextCursor: data(response)?.nextCursor || null }),
  errorMessage: "Unable to load round-plan reviews.",
  toast: { error: true },
});

export const reviewEventRoundPlan = createApiThunk("eventRoundPlans/review", {
  method: "patch",
  path: ({ arg }) => `/api/admin/events/round-plans/${arg.proposalId}/review`,
  getBody: ({ action, note }) => ({ action, note }),
  selectData: (response) => data(response)?.proposal,
  errorMessage: "Unable to review the round plan.",
  toast: { success: true, error: true },
}, {
  condition: ({ proposalId }, { getState }) => getState().eventRoundPlans.reviewById[proposalId] !== "loading",
});

const slice = createSlice({
  name: "eventRoundPlans",
  initialState: { actionByRunId: {}, queue: [], queueError: null, queueNextCursor: null, queueStatus: "idle", reviewById: {} },
  reducers: {},
  extraReducers: (builder) => builder
    .addCase(proposeEventRoundPlan.pending, (state, action) => { state.actionByRunId[action.meta.arg.runId] = "loading"; })
    .addCase(proposeEventRoundPlan.fulfilled, (state, action) => { state.actionByRunId[action.meta.arg.runId] = "idle"; })
    .addCase(proposeEventRoundPlan.rejected, (state, action) => { if (!action.meta.condition) state.actionByRunId[action.meta.arg.runId] = "idle"; })
    .addCase(fetchEventRoundPlanQueue.pending, (state) => { state.queueStatus = "loading"; state.queueError = null; })
    .addCase(fetchEventRoundPlanQueue.fulfilled, (state, action) => {
      const rows = action.meta.arg?.cursor ? [...state.queue, ...action.payload.proposals] : action.payload.proposals;
      state.queue = [...new Map(rows.map((item) => [item.id, item])).values()];
      state.queueNextCursor = action.payload.nextCursor;
      state.queueStatus = "succeeded";
    })
    .addCase(fetchEventRoundPlanQueue.rejected, (state, action) => { state.queueStatus = action.meta.aborted ? "idle" : "failed"; state.queueError = action.meta.aborted ? null : action.payload?.message || action.error.message; })
    .addCase(reviewEventRoundPlan.pending, (state, action) => { state.reviewById[action.meta.arg.proposalId] = "loading"; })
    .addCase(reviewEventRoundPlan.fulfilled, (state, action) => { const id = action.meta.arg.proposalId; state.reviewById[id] = "idle"; state.queue = state.queue.filter((item) => item.id !== id); })
    .addCase(reviewEventRoundPlan.rejected, (state, action) => { if (!action.meta.condition) state.reviewById[action.meta.arg.proposalId] = "idle"; }),
});

export default slice;
