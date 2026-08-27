import { createSlice } from "@reduxjs/toolkit";
import createApiThunk from "../thunks/createApiThunk.js";

export const fetchSecurityAttention = createApiThunk("securityAttention/fetch", {
  path: "/api/admin/security-events",
  getParams: ({ cursor = null } = {}) => ({ ...(cursor ? { cursor } : {}), limit: 25 }),
  selectData: (response) => response.data?.data || {},
  errorMessage: "Unable to load security attention.",
  toast: { error: true },
});

export const fetchGameAccountFraudCases = createApiThunk("securityAttention/fetchFraudCases", {
  path: "/api/admin/security-events/game-account-fraud-cases",
  getParams: ({ status = "open" } = {}) => ({ status }),
  selectData: (response) => response.data?.data || { cases: [] },
  errorMessage: "Unable to load game-account fraud cases.",
  toast: { error: true },
});

export const resolveGameAccountFraudCase = createApiThunk("securityAttention/resolveFraudCase", {
  method: "patch",
  path: ({ arg }) => `/api/admin/security-events/game-account-fraud-cases/${arg.caseId}`,
  getBody: ({ decision, note }) => ({ decision, note }),
  selectData: (response) => response.data?.data?.case,
  errorMessage: "Unable to record the fraud decision.",
  toast: { success: true, error: true },
});

const slice = createSlice({
  name: "securityAttention",
  initialState: { error: null, events: [], fraudCases: [], fraudError: null, fraudStatus: "idle", page: { hasMore: false, nextCursor: null }, status: "idle", summary: { highSeverityLast24Hours: 0, last24Hours: 0, retentionDays: 90 } },
  reducers: {},
  extraReducers: (builder) => builder
    .addCase(fetchSecurityAttention.pending, (state, action) => {
      state.error = null;
      state.status = action.meta.arg?.cursor ? "loading_more" : "loading";
    })
    .addCase(fetchSecurityAttention.fulfilled, (state, action) => {
      const incoming = action.payload.events || [];
      if (action.meta.arg?.cursor) {
        const known = new Set(state.events.map((item) => item.id));
        state.events.push(...incoming.filter((item) => !known.has(item.id)));
      } else state.events = incoming;
      state.page = action.payload.page || { hasMore: false, nextCursor: null };
      state.summary = action.payload.summary || state.summary;
      state.status = "succeeded";
    })
    .addCase(fetchSecurityAttention.rejected, (state, action) => {
      state.error = action.payload || action.error.message;
      state.status = "failed";
    })
    .addCase(fetchGameAccountFraudCases.pending, (state) => { state.fraudStatus = "loading"; state.fraudError = null; })
    .addCase(fetchGameAccountFraudCases.fulfilled, (state, action) => { state.fraudCases = action.payload.cases || []; state.fraudStatus = "succeeded"; })
    .addCase(fetchGameAccountFraudCases.rejected, (state, action) => { state.fraudError = action.payload || action.error.message; state.fraudStatus = "failed"; })
    .addCase(resolveGameAccountFraudCase.pending, (state) => { state.fraudStatus = "deciding"; state.fraudError = null; })
    .addCase(resolveGameAccountFraudCase.fulfilled, (state, action) => { state.fraudCases = state.fraudCases.filter((item) => item.id !== action.payload.id); state.fraudStatus = "succeeded"; })
    .addCase(resolveGameAccountFraudCase.rejected, (state, action) => { state.fraudError = action.payload || action.error.message; state.fraudStatus = "failed"; }),
});

export default slice;
