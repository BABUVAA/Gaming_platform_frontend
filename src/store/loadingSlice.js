import { createSlice } from "@reduxjs/toolkit";
import { verifySession, login, logout, register } from "./authSlice";
import { fetchGames } from "./gameSlice";
import { createClan, fetchUserClan } from "./clanSlice";

// Loading slice
const loadingSlice = createSlice({
  name: "loading",
  initialState: {
    globalLoading: false,
  },
  reducers: {
    setLoading: (state, action) => {
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
      .addCase(fetchGames.pending, (state) => {
        state.globalLoading = true;
      })
      .addCase(fetchGames.fulfilled, (state) => {
        state.globalLoading = false;
      })
      .addCase(fetchGames.rejected, (state, action) => {
        state.globalLoading = false;
      })
      .addCase(createClan.pending, (state, action) => {
        state.globalLoading = true;
      })
      .addCase(createClan.fulfilled, (state, action) => {
        state.globalLoading = false;
      })
      .addCase(createClan.rejected, (state, action) => {
        state.globalLoading = false;
      })
      .addCase(fetchUserClan.pending, (state, action) => {
        state.globalLoading = true;
      })
      .addCase(fetchUserClan.fulfilled, (state, action) => {
        state.globalLoading = false;
      })
      .addCase(fetchUserClan.rejected, (state, action) => {
        state.globalLoading = false;
      });
  },
});

export const loadingActions = loadingSlice.actions;
export default loadingSlice;
