import { createSlice } from "@reduxjs/toolkit";
import { sessionInvalidated } from "../actions/sessionActions";

const privateActionPrefixes = [
  "admin/",
  "clan/",
  "notifications/",
  "payment/",
  "player/",
  "social/",
  "users/",
  "/auth/clan/",
];

export const isPrivateRequestAction = (action) =>
  Boolean(
    action?.meta?.requestId &&
      privateActionPrefixes.some((prefix) => action.type.startsWith(prefix)),
  );

const hasLifecycle = (action, lifecycle) =>
  isPrivateRequestAction(action) && action.type.endsWith(`/${lifecycle}`);

const requestScopeSlice = createSlice({
  name: "requestScope",
  initialState: {
    // Request IDs are serializable and let the root reducer reject completions
    // that belong to a session cleared while network work was still running.
    activeRequestIds: {},
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(sessionInvalidated, (state) => {
        state.activeRequestIds = {};
      })
      .addMatcher(
        (action) => action.type === "auth/logout/pending",
        (state) => {
          state.activeRequestIds = {};
        },
      )
      .addMatcher(
        (action) => hasLifecycle(action, "pending"),
        (state, action) => {
          state.activeRequestIds[action.meta.requestId] = true;
        },
      )
      .addMatcher(
        (action) =>
          hasLifecycle(action, "fulfilled") ||
          hasLifecycle(action, "rejected"),
        (state, action) => {
          delete state.activeRequestIds[action.meta.requestId];
        },
      );
  },
});

export default requestScopeSlice;
