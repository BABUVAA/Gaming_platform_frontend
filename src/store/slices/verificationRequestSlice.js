import { createSlice } from "@reduxjs/toolkit";
import createApiThunk from "../thunks/createApiThunk.js";

const DEFAULT_PAGE = { limit: 25, hasMore: false, nextCursor: null };

const gameAccountEvidenceBody = (arg, { includeGameKey = false } = {}) => {
  const body = new FormData();
  if (includeGameKey) body.append("gameKey", arg.gameKey);
  body.append("accountId", arg.accountId);
  body.append("accountUsername", arg.accountUsername);
  body.append("evidenceNote", arg.evidenceNote || "");
  body.append("fraudAcknowledged", String(arg.fraudAcknowledged === true));
  body.append("evidence", arg.evidence);
  return body;
};

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

export const submitGameAccountReplacement = createApiThunk(
  "verificationRequests/submitReplacement",
  {
    method: "post",
    path: ({ arg }) => `/api/users/game-accounts/${arg.gameKey}/replacement-requests`,
    request: ({ api, arg, path, signal }) => {
      return api.post(path, gameAccountEvidenceBody(arg), { signal });
    },
    selectData: (response) => response.data?.data?.request,
    errorMessage: "Unable to submit the account replacement request.",
    toast: { error: true },
  },
);

export const submitGameAccountVerification = createApiThunk(
  "verificationRequests/submitVerification",
  {
    method: "post",
    path: "/api/users/verification-requests",
    request: ({ api, arg, path, signal }) => api.post(
      path,
      gameAccountEvidenceBody(arg, { includeGameKey: true }),
      { signal },
    ),
    selectData: (response) => response.data?.data,
    errorMessage: "Unable to submit the game-account verification request.",
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
    replacementStatus: "idle",
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
      })
      .addCase(submitGameAccountReplacement.pending, (state) => { state.replacementStatus = "loading"; })
      .addCase(submitGameAccountReplacement.fulfilled, (state) => { state.replacementStatus = "succeeded"; })
      .addCase(submitGameAccountReplacement.rejected, (state) => { state.replacementStatus = "failed"; });
  },
});

export default verificationRequestSlice.reducer;
