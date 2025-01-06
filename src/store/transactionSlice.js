// store/transactionSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Async Thunks to fetch data
export const fetchPlatformTransactions = createAsyncThunk(
  "transactions/fetchPlatformTransactions",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `/api/wallet/platform-transactions?userId=${userId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch platform transactions");
      }
      return response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchWithdrawTransactions = createAsyncThunk(
  "transactions/fetchWithdrawTransactions",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `/api/wallet/withdraw-transactions?userId=${userId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch withdraw transactions");
      }
      return response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async Thunk to handle withdrawal request
export const withdrawRequest = createAsyncThunk(
  "transactions/withdrawRequest",
  async (amount, { getState, rejectWithValue }) => {
    const userId = getState().auth.user.id;
    try {
      const response = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, amount }),
      });

      if (!response.ok) {
        throw new Error("Failed to initiate withdrawal");
      }

      const data = await response.json();
      return data; // Return the data if successful
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const transactionSlice = createSlice({
  name: "transactions",
  initialState: {
    platformTransactions: [],
    withdrawTransactions: [],
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlatformTransactions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPlatformTransactions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.platformTransactions = action.payload;
      })
      .addCase(fetchPlatformTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(fetchWithdrawTransactions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWithdrawTransactions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.withdrawTransactions = action.payload;
      })
      .addCase(fetchWithdrawTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(withdrawRequest.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(withdrawRequest.fulfilled, (state, action) => {
        state.isLoading = false;
        // Handle any specific state change after a successful withdrawal
        // For example, you could update withdrawTransactions or balance
      })
      .addCase(withdrawRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const transactionAction = transactionSlice.actions;
export default transactionSlice;
