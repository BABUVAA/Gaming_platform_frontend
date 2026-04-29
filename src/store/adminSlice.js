import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios-api";
import { showToast, types } from "./toastSlice";

// 🔄 Async thunk to fetch users
export const findUsers = createAsyncThunk(
  "admin/findUsers", // Better naming
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/api/admin/findUsers");

      thunkAPI.dispatch(
        showToast({
          message: "Users fetched successfully",
          type: types.SUCCESS,
          position: "bottom-right",
        })
      );

      return response.data.data;
    } catch (error) {
      thunkAPI.dispatch(
        showToast({
          message: error.response?.data?.message || "Failed to fetch users",
          type: types.DANGER,
          position: "bottom-right",
        })
      );

      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const findTransactions = createAsyncThunk(
  "admin/findTransactions",
  async (data, thunkAPI) => {
    try {
      const response = await api.post("/api/admin/findTransactions", data);

      thunkAPI.dispatch(
        showToast({
          message: "Transactions fetched successfully",
          type: types.SUCCESS,
          position: "bottom-right",
        })
      );

      return response.data.data; // Assuming response.data.data is an array of transactions
    } catch (error) {
      thunkAPI.dispatch(
        showToast({
          message:
            error.response?.data?.message || "Failed to fetch transactions",
          type: types.DANGER,
          position: "bottom-right",
        })
      );

      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const findTournaments = createAsyncThunk(
  "admin/findTournaments",
  async (data, thunkAPI) => {
    try {
      const response = await api.post("/api/admin/findTournaments", data);

      thunkAPI.dispatch(
        showToast({
          message: "Tournament fetched successfully",
          type: types.SUCCESS,
          position: "bottom-right",
        })
      );

      return response.data.data; // Assuming response.data.data is an array of transactions
    } catch (error) {
      thunkAPI.dispatch(
        showToast({
          message:
            error.response?.data?.message || "Failed to fetch Tournament",
          type: types.DANGER,
          position: "bottom-right",
        })
      );

      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const findVerificationRequests = createAsyncThunk(
  "admin/findVerificationRequests",
  async (status = "pending", thunkAPI) => {
    try {
      const response = await api.get("/api/admin/verification-requests", {
        params: { status },
      });

      return response.data.data;
    } catch (error) {
      thunkAPI.dispatch(
        showToast({
          message:
            error.response?.data?.message ||
            "Failed to fetch verification requests",
          type: types.DANGER,
          position: "bottom-right",
        })
      );

      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const reviewVerificationRequest = createAsyncThunk(
  "admin/reviewVerificationRequest",
  async ({ requestId, status, reviewNote }, thunkAPI) => {
    try {
      const response = await api.patch(
        `/api/admin/verification-requests/${requestId}`,
        {
          status,
          reviewNote,
        }
      );

      thunkAPI.dispatch(
        showToast({
          message: `Verification request ${status}.`,
          type: types.SUCCESS,
          position: "bottom-right",
        })
      );

      return response.data.data;
    } catch (error) {
      thunkAPI.dispatch(
        showToast({
          message:
            error.response?.data?.message ||
            "Failed to update verification request",
          type: types.DANGER,
          position: "bottom-right",
        })
      );

      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

const adminSlice = createSlice({
  name: "admin",
  initialState: {
    users: [],
    transactions: [],
    tournaments: [],
    verificationRequests: [],
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(findUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(findUsers.fulfilled, (state, action) => {
        state.users = action.payload;
        state.isLoading = false;
      })
      .addCase(findUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Something went wrong";
      })
      .addCase(findTransactions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(findTransactions.fulfilled, (state, action) => {
        state.transactions = action.payload;
        state.isLoading = false;
      })
      .addCase(findTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch transactions";
      })
      .addCase(findTournaments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(findTournaments.fulfilled, (state, action) => {
        state.tournaments = action.payload;
        state.isLoading = false;
      })
      .addCase(findTournaments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch transactions";
      })
      .addCase(findVerificationRequests.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(findVerificationRequests.fulfilled, (state, action) => {
        state.verificationRequests = action.payload;
        state.isLoading = false;
      })
      .addCase(findVerificationRequests.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch verification requests";
      })
      .addCase(reviewVerificationRequest.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(reviewVerificationRequest.fulfilled, (state, action) => {
        state.verificationRequests = state.verificationRequests.map((request) =>
          request._id === action.payload._id ? action.payload : request
        );
        state.isLoading = false;
      })
      .addCase(reviewVerificationRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to update verification request";
      });
  },
});

export default adminSlice;
