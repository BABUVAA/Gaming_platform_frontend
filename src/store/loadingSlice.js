import { createSlice } from "@reduxjs/toolkit";
import { verifySession, login, logout, register } from "./authSlice";

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
      });
  },
});

export const loadingActions = loadingSlice.actions;
export default loadingSlice;
