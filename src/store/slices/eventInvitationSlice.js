import { createSlice } from "@reduxjs/toolkit";
import createApiThunk from "../thunks/createApiThunk.js";

export const fetchInvitationRuns = createApiThunk(
  "eventInvitation/fetchRuns",
  {
    path: "/api/staff/events/invitation-runs",
    getParams: ({ cursor } = {}) => ({
      limit: 25,
      ...(cursor ? { cursor } : {}),
    }),
    selectData: (response) => response.data?.data || { nextCursor: null, runs: [] },
    errorMessage: "Unable to load invitation-only Events.",
    toast: { error: true },
  },
);

export const fetchEventInvitations = createApiThunk(
  "eventInvitation/fetch",
  {
    path: ({ arg }) => `/api/staff/events/runs/${arg.runId}/invitations`,
    getParams: ({ cursor }) => ({
      limit: 50,
      ...(cursor ? { cursor } : {}),
    }),
    selectData: (response) =>
      response.data?.data || { invitations: [], nextCursor: null },
    errorMessage: "Unable to load Event invitations.",
    toast: { error: true },
  },
);

export const searchInvitationCandidates = createApiThunk(
  "eventInvitation/searchCandidates",
  {
    path: ({ arg }) =>
      `/api/staff/events/runs/${arg.runId}/invitation-candidates`,
    getParams: ({ search }) => ({ limit: 20, search: search.trim() }),
    selectData: (response) => response.data?.data?.players || [],
    errorMessage: "Unable to search eligible Event players.",
    toast: { error: true },
  },
);

export const inviteEventPlayers = createApiThunk(
  "eventInvitation/invite",
  {
    method: "post",
    path: ({ arg }) => `/api/staff/events/runs/${arg.runId}/invitations`,
    getBody: ({ playerIds }) => ({ playerIds }),
    selectData: (response) => response.data?.data?.invitations || [],
    errorMessage: "Unable to save these Event invitations.",
    toast: { success: true, error: true },
  },
);

export const revokeEventInvitation = createApiThunk(
  "eventInvitation/revoke",
  {
    method: "delete",
    path: ({ arg }) =>
      `/api/staff/events/runs/${arg.runId}/invitations/${arg.invitationId}`,
    getBody: () => undefined,
    selectData: (response) => response.data?.data?.invitation,
    errorMessage: "Unable to revoke this Event invitation.",
    toast: { success: true, error: true },
  },
);

const getId = (record) => record?.id || record?._id;
const appendUnique = (current = [], additions = []) => {
  const byId = new Map(current.map((record) => [getId(record), record]));
  additions.forEach((record) => byId.set(getId(record), record));
  return [...byId.values()];
};

const eventInvitationSlice = createSlice({
  name: "eventInvitation",
  initialState: {
    actionByRunId: {},
    candidateErrorByRunId: {},
    candidateRequestByRunId: {},
    candidateStatusByRunId: {},
    candidatesByRunId: {},
    errorByRunId: {},
    invitationRuns: [],
    invitationsByRunId: {},
    latestRequestByRunId: {},
    nextInvitationCursorByRunId: {},
    nextRunCursor: null,
    runError: null,
    runRequestId: null,
    runStatus: "idle",
    statusByRunId: {},
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvitationRuns.pending, (state, action) => {
        state.runError = null;
        state.runRequestId = action.meta.requestId;
        state.runStatus = "loading";
      })
      .addCase(fetchInvitationRuns.fulfilled, (state, action) => {
        if (state.runRequestId !== action.meta.requestId) return;
        state.invitationRuns = action.meta.arg?.cursor
          ? appendUnique(state.invitationRuns, action.payload.runs)
          : action.payload.runs;
        state.nextRunCursor = action.payload.nextCursor || null;
        state.runRequestId = null;
        state.runStatus = "succeeded";
      })
      .addCase(fetchInvitationRuns.rejected, (state, action) => {
        if (state.runRequestId !== action.meta.requestId) return;
        state.runError = action.meta.aborted
          ? null
          : action.payload?.message || action.error.message;
        state.runRequestId = null;
        state.runStatus = action.meta.aborted ? "idle" : "failed";
      })
      .addCase(fetchEventInvitations.pending, (state, action) => {
        const { runId } = action.meta.arg;
        state.errorByRunId[runId] = null;
        state.latestRequestByRunId[runId] = action.meta.requestId;
        state.statusByRunId[runId] = "loading";
      })
      .addCase(fetchEventInvitations.fulfilled, (state, action) => {
        const { cursor, runId } = action.meta.arg;
        if (state.latestRequestByRunId[runId] !== action.meta.requestId) return;
        state.invitationsByRunId[runId] = cursor
          ? appendUnique(
              state.invitationsByRunId[runId],
              action.payload.invitations,
            )
          : action.payload.invitations;
        state.nextInvitationCursorByRunId[runId] =
          action.payload.nextCursor || null;
        state.latestRequestByRunId[runId] = null;
        state.statusByRunId[runId] = "succeeded";
      })
      .addCase(fetchEventInvitations.rejected, (state, action) => {
        const { runId } = action.meta.arg;
        if (state.latestRequestByRunId[runId] !== action.meta.requestId) return;
        state.latestRequestByRunId[runId] = null;
        state.statusByRunId[runId] = action.meta.aborted ? "idle" : "failed";
        if (!action.meta.aborted) {
          state.errorByRunId[runId] =
            action.payload?.message || action.error.message;
        }
      })
      .addCase(searchInvitationCandidates.pending, (state, action) => {
        const { runId } = action.meta.arg;
        state.candidateErrorByRunId[runId] = null;
        state.candidateRequestByRunId[runId] = action.meta.requestId;
        state.candidateStatusByRunId[runId] = "loading";
      })
      .addCase(searchInvitationCandidates.fulfilled, (state, action) => {
        const { runId } = action.meta.arg;
        if (state.candidateRequestByRunId[runId] !== action.meta.requestId) return;
        state.candidatesByRunId[runId] = action.payload;
        state.candidateRequestByRunId[runId] = null;
        state.candidateStatusByRunId[runId] = "succeeded";
      })
      .addCase(searchInvitationCandidates.rejected, (state, action) => {
        const { runId } = action.meta.arg;
        if (state.candidateRequestByRunId[runId] !== action.meta.requestId) return;
        state.candidateRequestByRunId[runId] = null;
        state.candidateStatusByRunId[runId] = action.meta.aborted
          ? "idle"
          : "failed";
        if (!action.meta.aborted) {
          state.candidateErrorByRunId[runId] =
            action.payload?.message || action.error.message;
        }
      })
      .addCase(inviteEventPlayers.pending, (state, action) => {
        state.actionByRunId[action.meta.arg.runId] = "saving";
      })
      .addCase(inviteEventPlayers.fulfilled, (state, action) => {
        const runId = action.meta.arg.runId;
        state.invitationsByRunId[runId] = appendUnique(
          state.invitationsByRunId[runId],
          action.payload,
        );
        const invitedIds = new Set(action.payload.map((item) => getId(item.player)));
        state.candidatesByRunId[runId] = (
          state.candidatesByRunId[runId] || []
        ).filter((player) => !invitedIds.has(getId(player)));
        state.actionByRunId[runId] = "idle";
      })
      .addCase(inviteEventPlayers.rejected, (state, action) => {
        state.actionByRunId[action.meta.arg.runId] = "idle";
      })
      .addCase(revokeEventInvitation.pending, (state, action) => {
        state.actionByRunId[action.meta.arg.runId] =
          action.meta.arg.invitationId;
      })
      .addCase(revokeEventInvitation.fulfilled, (state, action) => {
        const { invitationId, runId } = action.meta.arg;
        const invitations = state.invitationsByRunId[runId] || [];
        const index = invitations.findIndex(
          (item) => getId(item) === invitationId,
        );
        if (index >= 0) {
          invitations[index] = { ...invitations[index], ...action.payload };
        }
        state.actionByRunId[runId] = "idle";
      })
      .addCase(revokeEventInvitation.rejected, (state, action) => {
        state.actionByRunId[action.meta.arg.runId] = "idle";
      });
  },
});

export default eventInvitationSlice;
