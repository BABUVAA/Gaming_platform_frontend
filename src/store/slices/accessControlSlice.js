import { createSlice } from "@reduxjs/toolkit";
import addThunkLifecycleMatchers from "../reducers/addThunkLifecycleMatchers";
import createApiThunk from "../thunks/createApiThunk";

const field = (name) => (response) => response.data?.data?.[name] ?? null;
const query = (path, name, errorMessage, getParams) => createApiThunk(name, {
  path,
  getParams,
  selectData: field(name.split("/").at(-1)),
  errorMessage,
  toast: { error: true },
});

export const fetchAccessPolicy = createApiThunk("accessControl/policy", {
  path: "/api/access-control/roles",
  selectData: (response) => response.data?.data || {},
  errorMessage: "Unable to load staff access policy.",
  toast: { error: true },
});
export const fetchScopeGames = createApiThunk("accessControl/games", {
  path: "/api/access-control/scope-games",
  selectData: field("games"),
  errorMessage: "Unable to load available game scopes.",
  toast: { error: true },
});
export const findAccessCandidate = createApiThunk("accessControl/candidate", {
  path: "/api/access-control/candidates",
  getParams: (email) => ({ email: String(email || "").trim() }),
  selectData: field("candidate"),
  errorMessage: "Unable to find this candidate.",
  toast: { error: true },
});
export const fetchAccessAssignments = createApiThunk("accessControl/assignments", {
  path: "/api/access-control/assignments",
  selectData: field("assignments"),
  errorMessage: "Unable to load staff assignments.",
  toast: { error: true },
});
export const fetchStaffRecommendations = createApiThunk("accessControl/recommendations", {
  path: "/api/access-control/recommendations",
  getParams: (status = "") => (status ? { status } : {}),
  selectData: field("recommendations"),
  errorMessage: "Unable to load hiring recommendations.",
  toast: { error: true },
});
export const fetchAccessReports = createApiThunk("accessControl/reports", {
  path: "/api/access-control/reports",
  selectData: field("reports"),
  errorMessage: "Unable to load role reports.",
  toast: { error: true },
});
export const fetchAccessActivity = createApiThunk("accessControl/activity", {
  path: "/api/access-control/activity",
  getParams: (filters = {}) => filters,
  selectData: field("activity"),
  errorMessage: "Unable to load staff history.",
  toast: { error: true },
});

const mutation = (type, method, path, dataField, errorMessage, getBody) =>
  createApiThunk(type, {
    method,
    path,
    getBody,
    selectData: field(dataField),
    errorMessage,
    toast: { success: true, error: true },
  });

export const createAccessAssignment = mutation(
  "accessControl/createAssignment", "post", "/api/access-control/assignments",
  "assignment", "Unable to assign this role.",
);
export const createStaffRecommendation = mutation(
  "accessControl/createRecommendation", "post", "/api/access-control/recommendations",
  "recommendation", "Unable to send this recommendation.",
);
export const reviewStaffRecommendation = mutation(
  "accessControl/reviewRecommendation", "patch",
  ({ arg }) => "/api/access-control/recommendations/" + arg.recommendationId + "/decision",
  "recommendation", "Unable to review this recommendation.",
  ({ decision, reviewNote }) => ({ decision, reviewNote }),
);
export const withdrawStaffRecommendation = mutation(
  "accessControl/withdrawRecommendation", "patch",
  ({ arg }) => "/api/access-control/recommendations/" + arg.recommendationId + "/withdraw",
  "recommendation", "Unable to withdraw this recommendation.", () => ({}),
);
export const changeAccessAssignmentStatus = mutation(
  "accessControl/changeStatus", "patch",
  ({ arg }) => "/api/access-control/assignments/" + arg.assignmentId + "/status",
  "assignment", "Unable to update staff access.", ({ status }) => ({ status }),
);
export const changeAccessAssignmentScopes = mutation(
  "accessControl/changeScopes", "patch",
  ({ arg }) => "/api/access-control/assignments/" + arg.assignmentId + "/scopes",
  "assignment", "Unable to update staff game scope.", ({ gameIds }) => ({ gameIds }),
);

const thunks = [
  fetchAccessPolicy, fetchScopeGames, findAccessCandidate,
  fetchAccessAssignments, fetchStaffRecommendations, fetchAccessReports,
  fetchAccessActivity, createAccessAssignment, createStaffRecommendation,
  reviewStaffRecommendation, withdrawStaffRecommendation,
  changeAccessAssignmentStatus, changeAccessAssignmentScopes,
];
const replaceById = (items, value) => {
  const index = items.findIndex((item) => item._id === value?._id);
  if (index >= 0) items[index] = value;
  else if (value) items.unshift(value);
};

const accessControlSlice = createSlice({
  name: "accessControl",
  initialState: {
    roles: [], manageableRoles: [], recommendableRoles: [], scopeGames: [],
    candidate: null, assignments: [], recommendations: [], reports: [], activity: [],
    pendingRequests: 0, isLoading: false, error: null,
  },
  reducers: {
    clearAccessCandidate: (state) => { state.candidate = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccessPolicy.fulfilled, (state, action) => {
        state.roles = action.payload.roles || [];
        state.manageableRoles = action.payload.manageableRoles || [];
        state.recommendableRoles = action.payload.recommendableRoles || [];
      })
      .addCase(fetchScopeGames.fulfilled, (state, action) => { state.scopeGames = action.payload || []; })
      .addCase(findAccessCandidate.fulfilled, (state, action) => { state.candidate = action.payload; })
      .addCase(fetchAccessAssignments.fulfilled, (state, action) => { state.assignments = action.payload || []; })
      .addCase(fetchStaffRecommendations.fulfilled, (state, action) => { state.recommendations = action.payload || []; })
      .addCase(fetchAccessReports.fulfilled, (state, action) => { state.reports = action.payload || []; })
      .addCase(fetchAccessActivity.fulfilled, (state, action) => { state.activity = action.payload || []; });

    [createAccessAssignment, changeAccessAssignmentStatus, changeAccessAssignmentScopes]
      .forEach((thunk) => builder.addCase(thunk.fulfilled, (state, action) => {
        replaceById(state.assignments, action.payload);
      }));
    [reviewStaffRecommendation, withdrawStaffRecommendation]
      .forEach((thunk) => builder.addCase(thunk.fulfilled, (state, action) => {
        replaceById(state.recommendations, action.payload);
      }));

    addThunkLifecycleMatchers(builder, thunks, {
      pending: (state) => {
        state.pendingRequests += 1;
        state.isLoading = true;
        state.error = null;
      },
      fulfilled: (state) => {
        state.pendingRequests = Math.max(0, state.pendingRequests - 1);
        state.isLoading = state.pendingRequests > 0;
      },
      rejected: (state, action) => {
        state.pendingRequests = Math.max(0, state.pendingRequests - 1);
        state.isLoading = state.pendingRequests > 0;
        if (!action.meta.aborted && !action.meta.condition) {
          state.error = action.payload || action.error?.message || "Access-control request failed.";
        }
      },
    });
  },
});

export const { clearAccessCandidate } = accessControlSlice.actions;
export default accessControlSlice;
