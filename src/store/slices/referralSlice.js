import { createSlice } from "@reduxjs/toolkit";
import createApiThunk from "../thunks/createApiThunk.js";

export const fetchMyReferrals = createApiThunk("referrals/fetchMine", {
  path: "/api/users/referrals",
  selectData: (response) => response.data?.data,
  errorMessage: "Unable to load referral rewards.",
});

const initialState = {
  data: null,
  error: null,
  requestId: null,
  status: "idle",
};

const referralSlice = createSlice({
  name: "referrals",
  initialState,
  reducers: {},
  extraReducers: (builder) =>
    builder
      .addCase(fetchMyReferrals.pending, (state, action) => {
        state.error = null;
        state.requestId = action.meta.requestId;
        state.status = "loading";
      })
      .addCase(fetchMyReferrals.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.data = action.payload;
        state.requestId = null;
        state.status = "succeeded";
      })
      .addCase(fetchMyReferrals.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.error = action.payload || action.error.message;
        state.requestId = null;
        state.status = "failed";
      }),
});

export default referralSlice;
