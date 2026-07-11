import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../api/axios-api";
import { showToast, types } from "./toastSlice";

const getPaymentErrorMessage = (error, fallback) =>
  error.response?.data?.message ||
  error.response?.data?.error ||
  fallback;

export const initiatePhonePeOrder = createAsyncThunk(
  "payment/initiatePhonePeOrder",
  async (payload, thunkAPI) => {
    try {
      const response = await api.post("/api/payment/order", payload, {
        withCredentials: true,
      });
      return response.data?.data || response.data;
    } catch (error) {
      const message = getPaymentErrorMessage(
        error,
        "Unable to start wallet top-up."
      );
      thunkAPI.dispatch(
        showToast({
          message,
          type: types.DANGER,
          position: "bottom-right",
        })
      );
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchWalletBalance = createAsyncThunk(
  "payment/fetchWalletBalance",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/api/users/wallet", {
        withCredentials: true,
      });
      return response.data?.data || response.data;
    } catch (error) {
      const message = getPaymentErrorMessage(
        error,
        "Unable to fetch wallet balance."
      );
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const withdrawRequest = createAsyncThunk(
  "payment/withdrawRequest",
  async (payload, thunkAPI) => {
    try {
      const response = await api.post("/api/payment/withdraw", payload, {
        withCredentials: true,
      });
      thunkAPI.dispatch(
        showToast({
          message: response.data?.message || "Withdraw request submitted.",
          type: types.SUCCESS,
          position: "bottom-right",
        })
      );
      return response.data?.data || response.data;
    } catch (error) {
      const message = getPaymentErrorMessage(
        error,
        "Unable to request withdrawal."
      );
      thunkAPI.dispatch(
        showToast({
          message,
          type: types.DANGER,
          position: "bottom-right",
        })
      );
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchUserTransactions = createAsyncThunk(
  "payment/fetchUserTransactions",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/api/payment/transactions", {
        withCredentials: true,
      });
      return response.data?.data || response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        getPaymentErrorMessage(error, "Failed to fetch transactions.")
      );
    }
  }
);

export const checkTransactionStatus = createAsyncThunk(
  "payment/checkTransactionStatus",
  async (transactionId, thunkAPI) => {
    try {
      const response = await api.post(
        "/api/payment/status",
        transactionId,
        {
          withCredentials: true,
        }
      );
      return response.data?.data || response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        getPaymentErrorMessage(error, "Failed to check transaction status.")
      );
    }
  }
);

const initialState = {
  wallet: {
    realMoney: 0,
    platformMoney: 0,
    realTransactions: [],
    platformTransactions: [],
  },
  latestOrder: null,
  latestWithdrawal: null,
  statusCheck: null,
  transactions: [],
  isLoading: false,
  pendingRequests: 0,
  error: null,
};

const paymentSlice = createSlice({
  name: "payment",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    const beginRequest = (state) => {
      // Payment requests can overlap, so a counter is safer than a boolean.
      state.pendingRequests += 1;
      state.isLoading = true;
      state.error = null;
    };

    const finishRequest = (state) => {
      state.pendingRequests = Math.max(0, state.pendingRequests - 1);
      state.isLoading = state.pendingRequests > 0;
    };

    builder
      .addCase(initiatePhonePeOrder.fulfilled, (state, action) => {
        state.latestOrder = action.payload;
      })
      .addCase(fetchWalletBalance.fulfilled, (state, action) => {
        state.wallet.realMoney = action.payload?.realMoney || 0;
        state.wallet.platformMoney = action.payload?.platformMoney || 0;
        state.wallet.realTransactions = action.payload?.realTransactions || [];
        state.wallet.platformTransactions =
          action.payload?.platformTransactions || [];
      })
      .addCase(fetchUserTransactions.fulfilled, (state, action) => {
        state.transactions = Array.isArray(action.payload)
          ? action.payload
          : action.payload?.transactions || [];
      })
      .addCase(withdrawRequest.fulfilled, (state, action) => {
        state.latestWithdrawal = action.payload;
      })
      .addCase(checkTransactionStatus.fulfilled, (state, action) => {
        state.statusCheck = action.payload;
      })
      .addMatcher(
        (action) =>
          action.type.startsWith("payment/") && action.type.endsWith("/pending"),
        beginRequest
      )
      .addMatcher(
        (action) =>
          action.type.startsWith("payment/") && action.type.endsWith("/fulfilled"),
        finishRequest
      )
      .addMatcher(
        (action) =>
          action.type.startsWith("payment/") && action.type.endsWith("/rejected"),
        (state, action) => {
          finishRequest(state);
          state.error = action.payload;
        }
      );
  },
});

export default paymentSlice;
