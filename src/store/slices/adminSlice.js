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

export const fetchStaffRoles = createApiThunk("admin/fetchStaffRoles", {
  path: "/api/access-control/roles",
  selectData: (response) => response.data?.data?.roles || [],
  errorMessage: "Unable to load staff roles.",
  toast: { error: true },
});
export const fetchStaffCandidates = createApiThunk(
  "admin/fetchStaffCandidates",
  {
    path: "/api/access-control/candidates",
    // Candidate filtering belongs to the staff-management boundary rather
    // than the broader administrator user directory.
    getParams: (search = "") => ({ limit: 25, search: search.trim() }),
    selectData: (response) => response.data?.data?.candidates || [],
    errorMessage: "Unable to load eligible staff candidates.",
    toast: { error: true },
  },
);


export const fetchStaffAssignments = createApiThunk(
  "admin/fetchStaffAssignments",
  {
    path: "/api/access-control/assignments",
    selectData: (response) => response.data?.data?.assignments || [],
    errorMessage: "Unable to load staff assignments.",
    toast: { error: true },
  },
);

export const fetchStaffReports = createApiThunk("admin/fetchStaffReports", {
  path: "/api/access-control/reports",
  selectData: (response) => response.data?.data?.reports || [],
  errorMessage: "Unable to load staff reports.",
  toast: { error: true },
});

export const fetchStaffActivity = createApiThunk("admin/fetchStaffActivity", {
  path: "/api/access-control/activity",
  selectData: (response) => response.data?.data?.activity || [],
  errorMessage: "Unable to load staff service history.",
  toast: { error: true },
});

export const createStaffAssignment = createApiThunk(
  "admin/createStaffAssignment",
  {
    method: "post",
    path: "/api/access-control/assignments",
    selectData: (response) => response.data?.data?.assignment,
    errorMessage: "Unable to assign this staff role.",
    toast: { success: true, error: true },
  },
);

export const createCatalogGame = createApiThunk("admin/createCatalogGame", {
  method: "post",
  path: "/api/admin/game-catalog",
  selectData: (response) => response.data?.data?.game,
  errorMessage: "Unable to create this game.",
  toast: { success: true, error: true },
});

// Administrators receive every lifecycle state. Player-facing catalog routes
// remain responsible for exposing active games only.
export const fetchCatalogGames = createApiThunk("admin/fetchCatalogGames", {
  path: "/api/admin/game-catalog",
  selectData: (response) => response.data?.data?.games || [],
  errorMessage: "Unable to load the game catalog.",
  toast: { error: true },
});

export const fetchCatalogActivity = createApiThunk(
  "admin/fetchCatalogActivity",
  {
    path: "/api/admin/game-catalog/activity",
    selectData: (response) => response.data?.data?.activity || [],
    errorMessage: "Unable to load game-management history.",
    toast: { error: true },
  },
);

export const updateCatalogGame = createApiThunk("admin/updateCatalogGame", {
  method: "patch",
  path: ({ arg }) => `/api/admin/game-catalog/${arg.gameId}`,
  // The game ID belongs in the route; the API receives only mutable fields.
  getBody: (payload) => {
    const changes = { ...payload };
    delete changes.gameId;
    return changes;
  },
  selectData: (response) => response.data?.data?.game,
  errorMessage: "Unable to update this game.",
  toast: { success: true, error: true },
});

export const updateStaffAssignmentStatus = createApiThunk(
  "admin/updateStaffAssignmentStatus",
  {
    method: "patch",
    // createApiThunk provides the dispatched payload under `arg`.
    path: ({ arg }) =>
      `/api/access-control/assignments/${arg.assignmentId}/status`,
    getBody: ({ status }) => ({ status }),
    selectData: (response) => response.data?.data?.assignment,
    errorMessage: "Unable to update staff access.",
    toast: { success: true, error: true },
  },
);
export const updateStaffAssignmentScopes = createApiThunk(
  "admin/updateStaffAssignmentScopes",
  {
    method: "patch",
    path: ({ arg }) =>
      `/api/access-control/assignments/${arg.assignmentId}/scopes`,
    // The assignment ID identifies the resource and only the selected games
    // are mutable through this operation.
    getBody: ({ gameIds }) => ({ gameIds }),
    selectData: (response) => response.data?.data?.assignment,
    errorMessage: "Unable to update staff game scope.",
    toast: { success: true, error: true },
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
  fetchStaffRoles,
  fetchStaffCandidates,
  fetchStaffAssignments,
  fetchStaffReports,
  fetchStaffActivity,
  createStaffAssignment,
  createCatalogGame,
  fetchCatalogActivity,
  fetchCatalogGames,
  updateCatalogGame,
  updateStaffAssignmentStatus,
  updateStaffAssignmentScopes,
];

const adminRequestKeyByPrefix = Object.freeze({
  [findUsers.typePrefix]: "users",
  [findTransactions.typePrefix]: "transactions",
  [findTournaments.typePrefix]: "tournaments",
  [findVerificationRequests.typePrefix]: "verificationRequests",
  [reviewVerificationRequest.typePrefix]: "verificationReview",
  [fetchStaffRoles.typePrefix]: "staffRoles",
  [fetchStaffCandidates.typePrefix]: "staffCandidates",
  [fetchStaffAssignments.typePrefix]: "staffAssignments",
  [fetchStaffReports.typePrefix]: "staffReports",
  [fetchStaffActivity.typePrefix]: "staffActivity",
  [createStaffAssignment.typePrefix]: "staffAssignmentMutation",
  [createCatalogGame.typePrefix]: "gameCatalogMutation",
  [fetchCatalogActivity.typePrefix]: "catalogActivity",
  [fetchCatalogGames.typePrefix]: "catalogGames",
  [updateCatalogGame.typePrefix]: "gameCatalogMutation",
  [updateStaffAssignmentStatus.typePrefix]: "staffAssignmentMutation",
  [updateStaffAssignmentScopes.typePrefix]: "staffAssignmentMutation",
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
    staffRoles: [],
    staffCandidates: [],
    staffAssignments: [],
    staffReports: [],
    staffActivity: [],
    catalogGames: [],
    catalogActivity: [],
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
      staffRoles: null,
      staffCandidates: null,
      staffAssignments: null,
      staffReports: null,
      staffActivity: null,
      staffAssignmentMutation: null,
      gameCatalogMutation: null,
      catalogGames: null,
      catalogActivity: null,
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
      })
      .addCase(fetchStaffRoles.fulfilled, (state, action) => {
        if (!isLatestAdminRequest(state, "staffRoles", action)) return;
        state.staffRoles = action.payload;
        state.latestRequestIds.staffRoles = null;
      })
      .addCase(fetchStaffCandidates.fulfilled, (state, action) => {
        if (!isLatestAdminRequest(state, "staffCandidates", action)) return;
        state.staffCandidates = action.payload;
        state.latestRequestIds.staffCandidates = null;
      })
      .addCase(fetchStaffAssignments.fulfilled, (state, action) => {
        if (!isLatestAdminRequest(state, "staffAssignments", action)) return;
        state.staffAssignments = action.payload;
        state.latestRequestIds.staffAssignments = null;
      })
      .addCase(fetchStaffReports.fulfilled, (state, action) => {
        if (!isLatestAdminRequest(state, "staffReports", action)) return;
        state.staffReports = action.payload;
        state.latestRequestIds.staffReports = null;
      })
      .addCase(fetchStaffActivity.fulfilled, (state, action) => {
        if (!isLatestAdminRequest(state, "staffActivity", action)) return;
        state.staffActivity = action.payload;
        state.latestRequestIds.staffActivity = null;
      })
      .addCase(createStaffAssignment.fulfilled, (state, action) => {
        if (!isLatestAdminRequest(state, "staffAssignmentMutation", action)) return;
        const existingIndex = state.staffAssignments.findIndex(
          (assignment) => assignment._id === action.payload?._id,
        );
        if (existingIndex >= 0) state.staffAssignments[existingIndex] = action.payload;
        else state.staffAssignments.unshift(action.payload);
        state.latestRequestIds.staffAssignmentMutation = null;
      })
      .addCase(fetchCatalogGames.fulfilled, (state, action) => {
        if (!isLatestAdminRequest(state, "catalogGames", action)) return;
        state.catalogGames = action.payload;
        state.latestRequestIds.catalogGames = null;
      })
      .addCase(fetchCatalogActivity.fulfilled, (state, action) => {
        if (!isLatestAdminRequest(state, "catalogActivity", action)) return;
        state.catalogActivity = action.payload;
        state.latestRequestIds.catalogActivity = null;
      })
      .addCase(createCatalogGame.fulfilled, (state, action) => {
        if (!isLatestAdminRequest(state, "gameCatalogMutation", action)) return;
        state.catalogGames.unshift(action.payload);
        state.latestRequestIds.gameCatalogMutation = null;
      })
      .addCase(updateCatalogGame.fulfilled, (state, action) => {
        if (!isLatestAdminRequest(state, "gameCatalogMutation", action)) return;
        const index = state.catalogGames.findIndex(
          (game) => game._id === action.payload?._id,
        );
        if (index >= 0) state.catalogGames[index] = action.payload;
        state.latestRequestIds.gameCatalogMutation = null;
      })
      .addCase(updateStaffAssignmentStatus.fulfilled, (state, action) => {
        if (!isLatestAdminRequest(state, "staffAssignmentMutation", action)) return;
        const index = state.staffAssignments.findIndex(
          (assignment) => assignment._id === action.payload?._id,
        );
        if (index >= 0) state.staffAssignments[index] = action.payload;
        state.latestRequestIds.staffAssignmentMutation = null;
      })
      .addCase(updateStaffAssignmentScopes.fulfilled, (state, action) => {
        if (!isLatestAdminRequest(state, "staffAssignmentMutation", action)) return;
        const index = state.staffAssignments.findIndex(
          (assignment) => assignment._id === action.payload?._id,
        );
        if (index >= 0) state.staffAssignments[index] = action.payload;
        state.latestRequestIds.staffAssignmentMutation = null;
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
