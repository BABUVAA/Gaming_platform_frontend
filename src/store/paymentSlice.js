// store/transactionSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios-api";

// ✅ Initiate PhonePe payment
export const initiatePhonePeOrder = createAsyncThunk(
  "payment/initiatePhonePeOrder",
  async (amount, thunkAPI) => {
    try {
      const res = await api.post("/api/payment/order", amount);
      return res.data; // { redirectUrl: "..." }
    } catch (err) {
      console.log(err);
      return thunkAPI.rejectWithValue(
        err.response?.data || { error: "Server error" }
      );
    }
  }
);

// ✅ Get wallet balance
export const fetchWalletBalance = createAsyncThunk(
  "transactions/fetchWalletBalance",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/users/wallet", { withCredentials: true });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ✅ Withdraw request
export const withdrawRequest = createAsyncThunk(
  "transactions/withdrawRequest",
  async (amount, thunkAPI) => {
    try {
      const res = await api.post("/api/payment/withdraw", amount);
      return res.data; // { redirectUrl: "..." }
    } catch (err) {
      console.log(err);
      return thunkAPI.rejectWithValue(
        err.response?.data || { error: "Server error" }
      );
    }
  }
);

// ✅ Get user transactions
export const fetchUserTransactions = createAsyncThunk(
  "transactions/fetchUserTransactions",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/payment/transactions", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ✅ Check PhonePe transaction status
export const checkTransactionStatus = createAsyncThunk(
  "transactions/checkTransactionStatus",
  async (transactionId, { rejectWithValue }) => {
    try {
      const res = await api.post(`/api/payment/status`, transactionId);
      if (!res.ok) throw new Error("Failed to check status");
      return res.json();
    } catch (err) {
      return rejectWithValue(err.message);
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
  statusCheck: null,
  isLoading: false,
  error: null,
};

const transactionSlice = createSlice({
  name: "transactions",
  initialState: initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(initiatePhonePeOrder.fulfilled, (state, action) => {
        state.latestOrder = action.payload;
      })
      .addCase(fetchWalletBalance.fulfilled, (state, action) => {
        state.wallet.realMoney = action.payload.realMoney || 0;
        state.wallet.platformMoney = action.payload.platformMoney || 0;
        state.wallet.realTransactions = action.payload.realTransactions || [];
        state.wallet.platformTransactions =
          action.payload.platformTransactions || [];
      })
      .addCase(fetchUserTransactions.fulfilled, (state, action) => {
        state.deposits = action.payload.deposits;
        state.withdrawals = action.payload.withdrawals;
      })
      .addCase(withdrawRequest.fulfilled, (state, action) => {
        state.withdrawals.push({
          amount: action.meta.arg,
          status: "pending",
          date: new Date(),
        });
      })
      .addCase(checkTransactionStatus.fulfilled, (state, action) => {
        state.statusCheck = action.payload;
      })
      .addMatcher(
        (action) => action.type.endsWith("/pending"),
        (state) => {
          state.isLoading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type.endsWith("/fulfilled"),
        (state) => {
          state.isLoading = false;
        }
      )
      .addMatcher(
        (action) => action.type.endsWith("/rejected"),
        (state, action) => {
          state.isLoading = false;
          state.error = action.payload;
        }
      );
  },
});

export default transactionSlice;
