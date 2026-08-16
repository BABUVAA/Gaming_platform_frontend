import { createSlice } from "@reduxjs/toolkit";
import createApiThunk from "../thunks/createApiThunk.js";

const DEFAULT_PAGE = { limit: 25, hasMore: false, nextCursor: null };

export const fetchMyVerificationRequests = createApiThunk(
  "verificationRequests/fetchMine",
  {
    path: "/api/users/verification-requests",
    getParams: ({ cursor = null, limit = 25 } = {}) => ({
      limit,
      ...(cursor ? { cursor } : {}),
    }),
    selectData: (response) => {
      const items = response.data?.data;
      if (!Array.isArray(items)) {
        throw new Error("Verification history response must contain an array.");
      }
      return { items, page: response.data?.page || DEFAULT_PAGE };
    },
    errorMessage: "Unable to load verification history.",
    toast: { error: true },
  },
);

const appendUnique = (current, incoming) => {
  const known = new Set(current.map((item) => item._id));
  return [...current, ...incoming.filter((item) => !known.has(item._id))];
};

const verificationRequestSlice = createSlice({
  name: "verificationRequests",
  initialState: {
    items: [],
    page: DEFAULT_PAGE,
    status: "idle",
    error: null,
    latestRequestId: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyVerificationRequests.pending, (state, action) => {
        state.status = action.meta.arg?.cursor ? "loading_more" : "loading";
        state.error = null;
        state.latestRequestId = action.meta.requestId;
      })
      .addCase(fetchMyVerificationRequests.fulfilled, (state, action) => {
        if (state.latestRequestId !== action.meta.requestId) return;
        state.items = action.meta.arg?.cursor
          ? appendUnique(state.items, action.payload.items)
          : action.payload.items;
        state.page = action.payload.page;
        state.status = "succeeded";
        state.latestRequestId = null;
      })
      .addCase(fetchMyVerificationRequests.rejected, (state, action) => {
        if (state.latestRequestId !== action.meta.requestId) return;
        state.status = "failed";
        state.latestRequestId = null;
        if (!action.meta.aborted && !action.meta.condition) {
          state.error = action.payload || action.error?.message || "Unable to load verification history.";
        }
      });
  },
});

export default verificationRequestSlice.reducer;
