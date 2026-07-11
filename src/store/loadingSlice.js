import { createSlice } from "@reduxjs/toolkit";
import {
  verifySession,
  login,
  logout,
  register,
  user_profile,
  profile_data_update,
  profile_file_update,
} from "./authSlice";
import { fetchGames } from "./gameSlice";
import { createClan, fetchUserClan } from "./clanSlice";

// Loading slice
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
    const beginRequest = (state) => {
      // A counter is safer than a boolean when multiple thunks overlap.
      state.pendingRequests += 1;
      state.globalLoading = true;
    };

    const finishRequest = (state) => {
      // Clamp at zero so rejected/duplicate completions cannot make the
      // counter negative and break the spinner state.
      state.pendingRequests = Math.max(0, state.pendingRequests - 1);
      state.globalLoading = state.pendingRequests > 0;
    };

    builder
      .addCase(verifySession.pending, beginRequest)
      .addCase(verifySession.fulfilled, finishRequest)
      .addCase(verifySession.rejected, finishRequest)
      .addCase(login.pending, beginRequest)
      .addCase(login.fulfilled, finishRequest)
      .addCase(login.rejected, finishRequest)
      .addCase(logout.pending, beginRequest)
      .addCase(logout.fulfilled, finishRequest)
      .addCase(logout.rejected, finishRequest)
      .addCase(register.pending, beginRequest)
      .addCase(register.fulfilled, finishRequest)
      .addCase(register.rejected, finishRequest)
      .addCase(user_profile.pending, beginRequest)
      .addCase(user_profile.fulfilled, finishRequest)
      .addCase(user_profile.rejected, finishRequest)
      .addCase(profile_data_update.pending, beginRequest)
      .addCase(profile_data_update.fulfilled, finishRequest)
      .addCase(profile_data_update.rejected, finishRequest)
      .addCase(profile_file_update.pending, beginRequest)
      .addCase(profile_file_update.fulfilled, finishRequest)
      .addCase(profile_file_update.rejected, finishRequest)
      .addCase(fetchGames.pending, beginRequest)
      .addCase(fetchGames.fulfilled, finishRequest)
      .addCase(fetchGames.rejected, finishRequest)
      .addCase(createClan.pending, beginRequest)
      .addCase(createClan.fulfilled, finishRequest)
      .addCase(createClan.rejected, finishRequest)
      .addCase(fetchUserClan.pending, beginRequest)
      .addCase(fetchUserClan.fulfilled, finishRequest)
      .addCase(fetchUserClan.rejected, finishRequest);
  },
});

export const loadingActions = loadingSlice.actions;
export default loadingSlice;
