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

export const fetchManagedVerificationRequests = createApiThunk(
  "gameManagement/fetchManagedVerificationRequests",
  {
    path: "/api/staff/games/verification-requests",
    getParams: ({ cursor, limit = 25, status = "pending" } = {}) => ({ status, limit, ...(cursor ? { cursor } : {}) }),
    selectData: (response) => response.data?.data || { items: [], page: {} },
    errorMessage: "Unable to load game-account verification requests.",
    toast: { error: true },
  },
);

export const reviewManagedVerificationRequest = createApiThunk(
  "gameManagement/reviewManagedVerificationRequest",
  {
    method: "patch",
    path: ({ arg }) => `/api/staff/games/verification-requests/${arg.requestId}`,
    getBody: ({ reviewNote, status }) => ({ status, reviewNote }),
    selectData: (response) => response.data?.data?.request,
    errorMessage: "Unable to record this verification decision.",
    toast: { success: "Verification decision recorded.", error: true },
  },
);

export const fetchManagedVerificationEvidence = createApiThunk(
  "gameManagement/fetchManagedVerificationEvidence",
  {
    path: ({ arg }) => `/api/staff/games/verification-requests/${arg.requestId}/evidence`,
    getRequestConfig: () => ({ responseType: "blob" }),
    // Keep the fulfilled Redux action serializable. Evidence bytes never enter
    // application state; the browser owns and later revokes this private URL.
    selectData: (response) => URL.createObjectURL(response.data),
    errorMessage: "Unable to open the private verification evidence.",
    toast: { error: true },
  },
);

export const scheduleManagedMatch = createApiThunk(
  "gameManagement/scheduleManagedMatch",
  {
    method: "patch",
    path: ({ arg }) => `/api/staff/games/matches/${arg.matchId}/schedule`,
    getBody: ({ instructions, roomCode, roomPassword, scheduledFor }) => ({
      instructions,
      roomCode,
      roomPassword,
      scheduledFor,
    }),
    selectData: (response) => response.data?.data?.match,
    errorMessage: "Unable to schedule this Match.",
    toast: { success: "Match schedule saved.", error: true },
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
export const fetchManagedRoom = createApiThunk("gameManagement/fetchManagedRoom", {
  path: ({ arg }) => `/api/staff/games/rooms/${arg.roomId}`,
  selectData: (response) => response.data?.data?.room,
  errorMessage: "Unable to load room details.",
});
const roomCommand = (type, command, success) => createApiThunk(`gameManagement/${type}`, {
  method: "post",
  path: ({ arg }) => `/api/staff/games/rooms/${arg.roomId}/${command}`,
  getBody: ({ reason }) => ({ reason }),
  selectData: (response) => response.data?.data?.room,
  errorMessage: "Unable to update this room. Refresh its current status and try again.",
  toast: { success, error: true },
}, { condition: ({ roomId }, { getState }) => getState().gameManagement.roomDetails?.[roomId]?.actionStatus !== "loading" });
export const closeManagedRoomEarly = roomCommand("closeManagedRoomEarly", "close-early", "Room entry closed. Assign an operator and schedule the match next.");
export const cancelManagedRoom = roomCommand("cancelManagedRoom", "cancel", "Room cancelled.");
export const fetchManagedMatch = createApiThunk("gameManagement/fetchManagedMatch", {
  path: ({ arg }) => `/api/staff/games/matches/${arg.matchId}`,
  selectData: (response) => response.data?.data?.match,
  errorMessage: "Unable to load Match details.",
});
export const fetchManagedMatchOperators = createApiThunk("gameManagement/fetchManagedMatchOperators", {
  path: ({ arg }) => `/api/staff/games/matches/${arg.matchId}/operators`,
  getParams: ({ cursor }) => cursor ? { cursor } : {},
  selectData: (response) => response.data?.data?.operators,
  errorMessage: "Unable to load eligible operators.",
});
export const assignManagedMatchOperator = createApiThunk("gameManagement/assignManagedMatchOperator", {
  method: "patch",
  path: ({ arg }) => `/api/staff/games/matches/${arg.matchId}/operator`,
  getBody: ({ operatorId }) => ({ operatorId }),
  selectData: (response) => response.data?.data?.match,
  errorMessage: "Unable to assign this operator.",
  toast: { success: "Match Operator assigned.", error: true },
}, { condition: ({ matchId }, { getState }) => getState().gameManagement.matchDetails?.[matchId]?.assignStatus !== "loading" });
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
  initialState: { roomDetails: {}, matchDetails: {}, error: null, eventMatches: {}, eventOperations: {}, eventRegistrations: {}, eventStandings: {}, operations: [], schedule: { error: null, matchId: null, status: "idle" }, status: "idle", verification: { actionError: null, actionStatus: "idle", error: null, items: [], page: {}, status: "idle" } },
  reducers: {},
  extraReducers: (builder) => {
    for (const thunk of [fetchManagedRoom, closeManagedRoomEarly, cancelManagedRoom]) {
      const prefix = thunk === fetchManagedRoom ? "detail" : "action";
      builder.addCase(thunk.pending, (state, action) => {
        const entry = state.roomDetails[action.meta.arg.roomId] ||= {};
        entry[`${prefix}RequestId`] = action.meta.requestId;
        entry[`${prefix}Status`] = "loading";
        entry[`${prefix}Error`] = null;
        // An earlier read must not restore an actionable state after a command.
        if (prefix === "action") entry.detailRequestId = null;
      }).addCase(thunk.fulfilled, (state, action) => {
        const entry = state.roomDetails[action.meta.arg.roomId];
        if (entry?.[`${prefix}RequestId`] !== action.meta.requestId) return;
        entry.room = action.payload;
        // Reopened panels can start a read while this write is in flight.
        // Its pre-commit snapshot must not restore the old room controls.
        if (prefix === "action") entry.detailRequestId = null;
        entry[`${prefix}Status`] = "succeeded";
        entry.detailStatus = "succeeded";
      }).addCase(thunk.rejected, (state, action) => {
        const entry = state.roomDetails[action.meta.arg.roomId];
        if (entry?.[`${prefix}RequestId`] !== action.meta.requestId) return;
        entry[`${prefix}Status`] = action.meta.aborted ? "idle" : "failed";
        entry[`${prefix}Error`] = action.meta.aborted ? null : action.payload || action.error.message;
      });
    }
    for (const [thunk, prefix, field] of [[fetchManagedMatch, "detail", "match"], [fetchManagedMatchOperators, "operators", "operators"], [assignManagedMatchOperator, "assign", "assignment"]]) {
      builder.addCase(thunk.pending, (state, action) => {
        const id = action.meta.arg.matchId;
        const entry = state.matchDetails[id] ||= {};
        entry[`${prefix}RequestId`] = action.meta.requestId;
        entry[`${prefix}Status`] = "loading";
        entry[`${prefix}Error`] = null;
      }).addCase(thunk.fulfilled, (state, action) => {
        const entry = state.matchDetails[action.meta.arg.matchId];
        if (entry?.[`${prefix}RequestId`] !== action.meta.requestId) return;
        entry[field] = prefix === "operators" && action.meta.arg.cursor
          ? { ...action.payload, items: appendUnique(entry.operators?.items, action.payload.items) }
          : action.payload;
        entry[`${prefix}Status`] = "succeeded";
      }).addCase(thunk.rejected, (state, action) => {
        const entry = state.matchDetails[action.meta.arg.matchId];
        if (entry?.[`${prefix}RequestId`] !== action.meta.requestId) return;
        entry[`${prefix}Status`] = action.meta.aborted ? "idle" : "failed";
        entry[`${prefix}Error`] = action.meta.aborted ? null : action.payload || action.error.message;
      });
    }
    builder
      .addCase(fetchManagedGameOperations.pending, (state, action) => {
        state.operationsRequestId = action.meta.requestId;
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchManagedGameOperations.fulfilled, (state, action) => {
        if (state.operationsRequestId !== action.meta.requestId) return;
        state.operations = action.payload;
        state.status = "succeeded";
      })
      .addCase(fetchManagedGameOperations.rejected, (state, action) => {
        if (state.operationsRequestId !== action.meta.requestId) return;
        state.error = action.meta.aborted ? null : action.payload || action.error.message;
        state.status = action.meta.aborted ? "idle" : "failed";
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
      })
      .addCase(fetchManagedVerificationRequests.pending, (state) => {
        state.verification.status = "loading";
        state.verification.error = null;
      })
      .addCase(fetchManagedVerificationRequests.fulfilled, (state, action) => {
        state.verification.items = action.meta.arg?.cursor ? appendUnique(state.verification.items, action.payload.items) : action.payload.items;
        state.verification.page = action.payload.page || {};
        state.verification.status = "succeeded";
      })
      .addCase(fetchManagedVerificationRequests.rejected, (state, action) => {
        state.verification.error = action.payload || action.error.message;
        state.verification.status = "failed";
      })
      .addCase(reviewManagedVerificationRequest.pending, (state) => {
        state.verification.actionStatus = "loading";
        state.verification.actionError = null;
      })
      .addCase(reviewManagedVerificationRequest.fulfilled, (state, action) => {
        state.verification.items = state.verification.items.filter((item) => item.id !== action.payload.id);
        state.verification.actionStatus = "succeeded";
      })
      .addCase(reviewManagedVerificationRequest.rejected, (state, action) => {
        state.verification.actionError = action.payload || action.error.message;
        state.verification.actionStatus = "failed";
      })
      .addCase(scheduleManagedMatch.pending, (state, action) => {
        state.schedule.error = null;
        state.schedule.matchId = action.meta.arg.matchId;
        state.schedule.status = "loading";
      })
      .addCase(scheduleManagedMatch.fulfilled, (state) => {
        state.schedule.matchId = null;
        state.schedule.status = "succeeded";
      })
      .addCase(scheduleManagedMatch.rejected, (state, action) => {
        state.schedule.error = action.payload || action.error;
        state.schedule.matchId = null;
        state.schedule.status = action.meta.aborted ? "idle" : "failed";
      });
  },
});

export default gameManagementSlice;
