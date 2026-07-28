import { createSlice } from "@reduxjs/toolkit";
import addThunkLifecycleMatchers from "../reducers/addThunkLifecycleMatchers";
import createApiThunk from "../thunks/createApiThunk";

const selectNestedArrayData = (response) => {
  const data = response.data?.data;
  if (!Array.isArray(data)) {
    throw new Error("Admin list response must contain an array.");
  }
  return data;
};

const selectReviewedVerification = (response) => {
  const data = response.data?.data;
  if (!data?._id) {
    throw new Error("Reviewed verification response is missing its ID.");
  }
  return data;
};

// Read operations stay silent when successful so normal dashboard loading does
// not generate noisy notifications. Their failures still surface consistently.
export const findUsers = createApiThunk("admin/findUsers", {
  path: "/api/admin/findUsers",
  selectData: selectNestedArrayData,
  errorMessage: "Failed to fetch users",
  toast: { error: true },
});

export const findTransactions = createApiThunk("admin/findTransactions", {
  method: "post",
  path: "/api/admin/findTransactions",
  selectData: selectNestedArrayData,
  errorMessage: "Failed to fetch transactions",
  toast: { error: true },
});

export const findTournaments = createApiThunk("admin/findTournaments", {
  method: "post",
  path: "/api/admin/findTournaments",
  selectData: selectNestedArrayData,
  errorMessage: "Failed to fetch tournaments",
  toast: { error: true },
});

export const findVerificationRequests = createApiThunk(
  "admin/findVerificationRequests",
  {
    path: "/api/admin/verification-requests",
    // The thunk argument becomes an explicit query parameter only for this
    // endpoint; createApiThunk never sends GET arguments automatically.
    getParams: (status = "pending") => ({ status }),
    selectData: selectNestedArrayData,
    errorMessage: "Failed to fetch verification requests",
    toast: { error: true },
  },
);

export const reviewVerificationRequest = createApiThunk(
  "admin/reviewVerificationRequest",
  {
    method: "patch",
    path: ({ arg }) => `/api/admin/verification-requests/${arg.requestId}`,
    // Keep the identifier in the URL and send only mutable review fields.
    getBody: ({ status, reviewNote }) => ({ status, reviewNote }),
    selectData: selectReviewedVerification,
    errorMessage: "Failed to update verification request",
    toast: {
      success: ({ arg }) => `Verification request ${arg.status}.`,
      error: true,
    },
  },
);

// These requests share loading and error behavior while keeping their
// successful state updates explicit in extraReducers below.
const adminThunks = [
  findUsers,
  findTransactions,
  findTournaments,
  findVerificationRequests,
  reviewVerificationRequest,
];

const adminRequestKeyByPrefix = Object.freeze({
  [findUsers.typePrefix]: "users",
  [findTransactions.typePrefix]: "transactions",
  [findTournaments.typePrefix]: "tournaments",
  [findVerificationRequests.typePrefix]: "verificationRequests",
  [reviewVerificationRequest.typePrefix]: "verificationReview",
});

const getAdminRequestKey = (action) => {
  const lifecycleSeparatorIndex = action.type.lastIndexOf("/");
  const typePrefix = action.type.slice(0, lifecycleSeparatorIndex);
  return adminRequestKeyByPrefix[typePrefix];
};

const isLatestAdminRequest = (state, requestKey, action) =>
  state.latestRequestIds?.[requestKey] === action.meta.requestId;

// Complete exactly one request without allowing stale or malformed state to
// produce a negative counter. The boolean remains for existing components.
const finishAdminRequest = (state) => {
  const currentCount = Number.isFinite(state.pendingRequests)
    ? state.pendingRequests
    : 1;

  state.pendingRequests = Math.max(0, currentCount - 1);
  state.isLoading = state.pendingRequests > 0;
};

const adminSlice = createSlice({
  name: "admin",
  initialState: {
    users: [],
    transactions: [],
    tournaments: [],
    verificationRequests: [],
    // A counter keeps loading accurate when dashboard requests overlap.
    pendingRequests: 0,
    // Each resource accepts only the newest request so rapid filters cannot
    // be overwritten by a slower response from an older query.
    latestRequestIds: {
      users: null,
      transactions: null,
      tournaments: null,
      verificationRequests: null,
      verificationReview: null,
    },
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(findUsers.fulfilled, (state, action) => {
        if (!isLatestAdminRequest(state, "users", action)) return;

        state.users = action.payload;
        state.latestRequestIds.users = null;
      })
      .addCase(findTransactions.fulfilled, (state, action) => {
        if (!isLatestAdminRequest(state, "transactions", action)) return;

        state.transactions = action.payload;
        state.latestRequestIds.transactions = null;
      })
      .addCase(findTournaments.fulfilled, (state, action) => {
        if (!isLatestAdminRequest(state, "tournaments", action)) return;

        state.tournaments = action.payload;
        state.latestRequestIds.tournaments = null;
      })
      .addCase(findVerificationRequests.fulfilled, (state, action) => {
        if (
          !isLatestAdminRequest(state, "verificationRequests", action)
        ) {
          return;
        }

        state.verificationRequests = action.payload;
        state.latestRequestIds.verificationRequests = null;
      })
      .addCase(reviewVerificationRequest.fulfilled, (state, action) => {
        if (!isLatestAdminRequest(state, "verificationReview", action)) {
          return;
        }

        state.verificationRequests = state.verificationRequests.map(
          (request) =>
            request._id === action.payload._id ? action.payload : request,
        );
        state.latestRequestIds.verificationReview = null;
      });

    addThunkLifecycleMatchers(builder, adminThunks, {
      pending: (state, action) => {
        const requestKey = getAdminRequestKey(action);
        const currentCount = Number.isFinite(state.pendingRequests)
          ? state.pendingRequests
          : 0;

        if (!state.latestRequestIds) {
          state.latestRequestIds = {};
        }
        state.latestRequestIds[requestKey] = action.meta.requestId;
        state.pendingRequests = currentCount + 1;
        state.isLoading = true;
        state.error = null;
      },
      fulfilled: (state) => {
        finishAdminRequest(state);
      },
      rejected: (state, action) => {
        finishAdminRequest(state);
        const requestKey = getAdminRequestKey(action);

        // An older rejected query must not replace the state of the newer
        // request that superseded it.
        if (!isLatestAdminRequest(state, requestKey, action)) return;

        state.latestRequestIds[requestKey] = null;

        // Cancellation is expected during navigation and should not be shown
        // to the user as a failed admin request.
        if (!action.meta.aborted && !action.meta.condition) {
          state.error =
            action.payload ||
            action.error?.message ||
            "The admin request could not be completed.";
        }
      },
    });
  },
});

export default adminSlice;
