import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios-api";
import {
  getApiErrorToast,
  normalizeApiError,
} from "../../api/apiError";
import addThunkLifecycleMatchers from "../reducers/addThunkLifecycleMatchers";
import { showToast, types } from "./toastSlice";

const rejectPaymentError = (
  thunkAPI,
  error,
  fallbackMessage,
  { notify = false } = {},
) => {
  // Normalize once so the toast and rejected Redux action always describe the
  // same backend failure, including stable codes such as email verification.
  const normalizedError = normalizeApiError(error, fallbackMessage);

  if (notify) {
    // The shared classifier chooses an appropriate title and severity instead
    // of presenting expected 403 verification blocks as generic danger errors.
    thunkAPI.dispatch(
      showToast({
        ...getApiErrorToast(normalizedError),
        position: "bottom-right",
      }),
    );
  }

  // rejectWithValue keeps the structured error serializable for Redux state
  // and lets components inspect its status, code, message, and field errors.
  return thunkAPI.rejectWithValue(normalizedError);
};

export const initiatePhonePeOrder = createAsyncThunk(
  "payment/initiatePhonePeOrder",
  async (payload, thunkAPI) => {
    try {
      const response = await api.post("/api/payment/order", payload, {
        withCredentials: true,
      });
      return response.data?.data || response.data;
    } catch (error) {
      return rejectPaymentError(
        thunkAPI,
        error,
        "Unable to start wallet top-up.",
        { notify: true },
      );
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
      return rejectPaymentError(
        thunkAPI,
        error,
        "Unable to fetch wallet balance.",
      );
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
      return rejectPaymentError(
        thunkAPI,
        error,
        "Unable to request withdrawal.",
        { notify: true },
      );
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
      return rejectPaymentError(
        thunkAPI,
        error,
        "Failed to fetch transactions.",
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
      return rejectPaymentError(
        thunkAPI,
        error,
        "Failed to check transaction status.",
      );
    }
  }
);

// Explicit membership is safer than matching every action whose type happens
// to begin with "payment/". Future synchronous actions cannot affect loading.
const paymentThunks = [
  initiatePhonePeOrder,
  fetchWalletBalance,
  withdrawRequest,
  fetchUserTransactions,
  checkTransactionStatus,
];

const finishPaymentRequest = (state) => {
  const currentCount = Number.isFinite(state.pendingRequests)
    ? state.pendingRequests
    : 1;

  state.pendingRequests = Math.max(0, currentCount - 1);
  state.isLoading = state.pendingRequests > 0;
};

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
      });

    addThunkLifecycleMatchers(builder, paymentThunks, {
      pending: (state) => {
        const currentCount = Number.isFinite(state.pendingRequests)
          ? state.pendingRequests
          : 0;

        state.pendingRequests = currentCount + 1;
        state.isLoading = true;
        state.error = null;
      },
      fulfilled: finishPaymentRequest,
      rejected: (state, action) => {
        finishPaymentRequest(state);

        // An aborted request is an intentional control-flow event, not a
        // payment failure that should replace the current screen error.
        if (!action.meta.aborted && !action.meta.condition) {
          state.error = action.payload;
        }
      },
    });
  },
});

export default paymentSlice;
