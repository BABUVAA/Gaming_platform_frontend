import { createSlice } from "@reduxjs/toolkit";
import createApiThunk from "../thunks/createApiThunk.js";

export const fetchSecurityAttention = createApiThunk("securityAttention/fetch", {
  path: "/api/admin/security-events",
  getParams: ({ cursor = null } = {}) => ({ ...(cursor ? { cursor } : {}), limit: 25 }),
  selectData: (response) => response.data?.data || {},
  errorMessage: "Unable to load security attention.",
  toast: { error: true },
});

const slice = createSlice({
  name: "securityAttention",
  initialState: { error: null, events: [], page: { hasMore: false, nextCursor: null }, status: "idle", summary: { highSeverityLast24Hours: 0, last24Hours: 0, retentionDays: 90 } },
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
    }),
});

export default slice;
