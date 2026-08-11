import { createSlice } from "@reduxjs/toolkit";
import createApiThunk from "../thunks/createApiThunk.js";

const HOST_DRAFT_FIELDS = Object.freeze([
  "currency",
  "entryFeeMinor",
  "entryPolicy",
  "gameId",
  "map",
  "maxParticipants",
  "mode",
  "operatorCoverageRequired",
  "prizePoolMinor",
  "region",
  "schedulePolicy",
  "teamSize",
  "title",
]);

export const proposeHostQuickMatchDraft = createApiThunk(
  "hostQuickMatchProposal/propose",
  {
    method: "post",
    path: "/api/host/tournament-offerings",
    // The host boundary never accepts lifecycle authority from the browser.
    getBody: (payload) =>
      HOST_DRAFT_FIELDS.reduce((body, field) => {
        if (Object.hasOwn(payload, field)) body[field] = payload[field];
        return body;
      }, {}),
    selectData: (response) => response.data?.data,
    errorMessage: "Unable to submit this tournament proposal.",
    toast: { success: true, error: true },
  },
);

const hostQuickMatchProposalSlice = createSlice({
  name: "hostQuickMatchProposal",
  initialState: { error: null, proposal: null, status: "idle" },
  reducers: {
    resetHostProposal(state) {
      state.error = null;
      state.proposal = null;
      state.status = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(proposeHostQuickMatchDraft.pending, (state) => {
        state.error = null;
        state.status = "loading";
      })
      .addCase(proposeHostQuickMatchDraft.fulfilled, (state, action) => {
        state.proposal = action.payload;
        state.status = "succeeded";
      })
      .addCase(proposeHostQuickMatchDraft.rejected, (state, action) => {
        state.error = action.payload || action.error;
        state.status = action.meta.aborted ? "idle" : "failed";
      });
  },
});

export const hostQuickMatchProposalActions = hostQuickMatchProposalSlice.actions;
export default hostQuickMatchProposalSlice;
