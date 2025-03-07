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
  },
  reducers: {
    setLoading: (state) => {
      state.globalLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(verifySession.pending, (state) => {
        state.globalLoading = true;
      })
      .addCase(verifySession.fulfilled, (state) => {
        state.globalLoading = false;
      })
      .addCase(verifySession.rejected, (state) => {
        state.globalLoading = false;
      })
      .addCase(login.pending, (state) => {
        state.globalLoading = true;
      })
      .addCase(login.fulfilled, (state) => {
        state.globalLoading = false;
      })
      .addCase(login.rejected, (state) => {
        state.globalLoading = false;
      })
      .addCase(logout.pending, (state) => {
        state.globalLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.globalLoading = false;
      })
      .addCase(logout.rejected, (state) => {
        state.globalLoading = false;
      })
      .addCase(register.pending, (state) => {
        state.globalLoading = true;
      })
      .addCase(register.fulfilled, (state) => {
        state.globalLoading = false;
      })
      .addCase(register.rejected, (state) => {
        state.globalLoading = false;
      })
      .addCase(user_profile.pending, (state) => {
        state.globalLoading = true;
      })
      .addCase(user_profile.fulfilled, (state) => {
        state.globalLoading = false;
      })
      .addCase(user_profile.rejected, (state) => {
        state.globalLoading = false;
      })
      .addCase(profile_data_update.pending, (state) => {
        state.globalLoading = true;
      })
      .addCase(profile_data_update.fulfilled, (state) => {
        state.globalLoading = false;
      })
      .addCase(profile_data_update.rejected, (state) => {
        state.globalLoading = false;
      })
      .addCase(profile_file_update.pending, (state) => {
        state.globalLoading = true;
      })
      .addCase(profile_file_update.fulfilled, (state) => {
        state.globalLoading = false;
      })
      .addCase(profile_file_update.rejected, (state) => {
        state.globalLoading = false;
      })
      .addCase(fetchGames.pending, (state) => {
        state.globalLoading = true;
      })
      .addCase(fetchGames.fulfilled, (state) => {
        state.globalLoading = false;
      })
      .addCase(fetchGames.rejected, (state) => {
        state.globalLoading = false;
      })
      .addCase(createClan.pending, (state) => {
        state.globalLoading = true;
      })
      .addCase(createClan.fulfilled, (state) => {
        state.globalLoading = false;
      })
      .addCase(createClan.rejected, (state) => {
        state.globalLoading = false;
      })
      .addCase(fetchUserClan.pending, (state) => {
        state.globalLoading = true;
      })
      .addCase(fetchUserClan.fulfilled, (state) => {
        state.globalLoading = false;
      })
      .addCase(fetchUserClan.rejected, (state) => {
        state.globalLoading = false;
      });
  },
});

export const loadingActions = loadingSlice.actions;
export default loadingSlice;
