import { createSlice } from "@reduxjs/toolkit";
import {
  login,
  logout,
  register,
  profile_data_update,
  profile_file_update,
} from "./authSlice";
import { createClan } from "./clanSlice";
import addThunkLifecycleMatchers from "../reducers/addThunkLifecycleMatchers";

// Only operations that block the whole interface belong in this group.
// Background catalog, notification, and session checks keep local indicators.
const globallyBlockingThunks = [
  login,
  logout,
  register,
  profile_data_update,
  profile_file_update,
  createClan,
];

const beginGlobalRequest = (state) => {
  // A counter is safer than a boolean when multiple blocking requests overlap.
  const currentCount = Number.isFinite(state.pendingRequests)
    ? state.pendingRequests
    : 0;

  state.pendingRequests = currentCount + 1;
  state.globalLoading = true;
};

const finishGlobalRequest = (state) => {
  // Defaulting to one lets a completion recover safely after hot replacement
  // or a future state migration that did not include the counter.
  const currentCount = Number.isFinite(state.pendingRequests)
    ? state.pendingRequests
    : 1;

  state.pendingRequests = Math.max(0, currentCount - 1);
  state.globalLoading = state.pendingRequests > 0;
};

// Global loading slice
const loadingSlice = createSlice({
  name: "loading",
  initialState: {
    globalLoading: false,
    pendingRequests: 0,
  },
  reducers: {
    setLoading: (state, action) => {
      // This escape hatch is kept for local/manual toggles.
      // We also realign the counter so future async completions do not
      // leave the global spinner in a contradictory state.
      state.globalLoading = Boolean(action.payload);
      state.pendingRequests = action.payload ? 1 : 0;
    },
  },
  extraReducers: (builder) => {
    addThunkLifecycleMatchers(builder, globallyBlockingThunks, {
      pending: beginGlobalRequest,
      fulfilled: finishGlobalRequest,
      rejected: finishGlobalRequest,
    });
  },
});

export const loadingActions = loadingSlice.actions;
export default loadingSlice;
