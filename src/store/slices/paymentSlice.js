import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios-api.js";
import {
  getApiErrorToast,
  normalizeApiError,
} from "../../api/apiError.js";
import addThunkLifecycleMatchers from "../reducers/addThunkLifecycleMatchers.js";
import { showToast } from "./toastSlice.js";

export const WALLET_LEDGER_PAGE_LIMIT = 20;

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
  },
  {
    condition: (_, { getState }) =>
      getState().player?.summary?.role !== "staff",
  },
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

export const fetchWalletLedger = createAsyncThunk(
  "payment/fetchWalletLedger",
  async ({ cursor = null } = {}, thunkAPI) => {
    try {
      const response = await api.get("/api/payment/ledger", {
        params: {
          limit: WALLET_LEDGER_PAGE_LIMIT,
          ...(cursor ? { cursor } : {}),
        },
        withCredentials: true,
      });
      return response.data?.data || response.data;
    } catch (error) {
      return rejectPaymentError(
        thunkAPI,
        error,
        "Unable to fetch wallet ledger history.",
      );
    }
  },
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
    availableMinor: 0,
    currency: "INR",
    entryHeldMinor: 0,
    prizePendingMinor: 0,
    realMoney: 0,
    platformMoney: 0,
    realTransactions: [],
    platformTransactions: [],
    withdrawableMinor: 0,
    withdrawalPendingMinor: 0,
  },
  latestOrder: null,
  ledger: {
    entries: [],
    error: null,
    isLoading: false,
    isLoadingMore: false,
    page: {
      hasMore: false,
      limit: WALLET_LEDGER_PAGE_LIMIT,
      nextCursor: null,
    },
    requestId: null,
  },
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
        state.wallet.availableMinor = action.payload?.availableMinor || 0;
        state.wallet.currency = action.payload?.currency || "INR";
        state.wallet.entryHeldMinor = action.payload?.entryHeldMinor || 0;
        state.wallet.prizePendingMinor = action.payload?.prizePendingMinor || 0;
        state.wallet.realMoney = action.payload?.realMoney || 0;
        state.wallet.platformMoney = action.payload?.platformMoney || 0;
        state.wallet.realTransactions = action.payload?.realTransactions || [];
        state.wallet.platformTransactions =
          action.payload?.platformTransactions || [];
        state.wallet.withdrawableMinor = action.payload?.withdrawableMinor || 0;
        state.wallet.withdrawalPendingMinor =
          action.payload?.withdrawalPendingMinor || 0;
      })
      .addCase(fetchWalletLedger.pending, (state, action) => {
        const isNextPage = Boolean(action.meta.arg?.cursor);
        state.ledger.error = null;
        state.ledger.isLoading = !isNextPage;
        state.ledger.isLoadingMore = isNextPage;
        state.ledger.requestId = action.meta.requestId;
      })
      .addCase(fetchWalletLedger.fulfilled, (state, action) => {
        if (state.ledger.requestId !== action.meta.requestId) return;

        const incomingEntries = Array.isArray(action.payload?.entries)
          ? action.payload.entries
          : [];
        const isNextPage = Boolean(action.meta.arg?.cursor);
        if (isNextPage) {
          const existingIds = new Set(
            state.ledger.entries.map((entry) => entry.id),
          );
          incomingEntries.forEach((entry) => {
            if (existingIds.has(entry.id)) return;
            state.ledger.entries.push(entry);
            existingIds.add(entry.id);
          });
        } else {
          state.ledger.entries = incomingEntries;
        }

        state.ledger.page = {
          hasMore: Boolean(action.payload?.page?.hasMore),
          limit:
            action.payload?.page?.limit || WALLET_LEDGER_PAGE_LIMIT,
          nextCursor: action.payload?.page?.nextCursor || null,
        };
        state.ledger.error = null;
        state.ledger.isLoading = false;
        state.ledger.isLoadingMore = false;
        state.ledger.requestId = null;
      })
      .addCase(fetchWalletLedger.rejected, (state, action) => {
        if (state.ledger.requestId !== action.meta.requestId) return;

        state.ledger.isLoading = false;
        state.ledger.isLoadingMore = false;
        state.ledger.requestId = null;
        if (!action.meta.aborted && !action.meta.condition) {
          state.ledger.error = action.payload;
        }
      })
      .addCase(fetchUserTransactions.fulfilled, (state, action) => {
        state.transactions = Array.isArray(action.payload)
          ? action.payload
          : action.payload?.transactions || [];
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
