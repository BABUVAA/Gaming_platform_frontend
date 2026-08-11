import { createSlice } from "@reduxjs/toolkit";
import createApiThunk from "../thunks/createApiThunk.js";

export const WITHDRAWAL_PAGE_LIMIT = 20;

const selectDestinations = (response) => {
  const data = response.data?.data;
  if (!Array.isArray(data?.destinations) || !data?.availability) {
    throw new Error("Payout destination response is invalid.");
  }
  return data;
};

const selectHistory = (response) => {
  const data = response.data?.data;
  if (!Array.isArray(data?.withdrawals) || !data?.page) {
    throw new Error("Withdrawal history response is invalid.");
  }
  return data;
};

export const fetchPayoutDestinations = createApiThunk(
  "withdrawals/fetchPayoutDestinations",
  {
    path: "/api/payment/payout-destinations",
    selectData: selectDestinations,
    errorMessage: "Unable to load saved payout destinations.",
  },
  {
    condition: (_, { getState }) =>
      getState().player?.summary?.role === "player",
  },
);

export const fetchWithdrawalHistory = createApiThunk(
  "withdrawals/fetchHistory",
  {
    path: "/api/payment/withdrawals",
    getParams: ({ cursor = null } = {}) => ({
      limit: WITHDRAWAL_PAGE_LIMIT,
      ...(cursor ? { cursor } : {}),
    }),
    selectData: selectHistory,
    errorMessage: "Unable to load withdrawal history.",
  },
  {
    condition: (_, { getState }) =>
      getState().player?.summary?.role === "player",
  },
);

export const requestWithdrawal = createApiThunk(
  "withdrawals/request",
  {
    method: "post",
    path: "/api/payment/withdrawals",
    getBody: ({ amountMinor, idempotencyKey, payoutDestinationId }) => ({
      amountMinor,
      idempotencyKey,
      payoutDestinationId,
    }),
    selectData: (response) => response.data?.data?.withdrawal,
    errorMessage: "Unable to submit this withdrawal request.",
    toast: {
      success: "Withdrawal request submitted for review.",
      error: true,
    },
  },
  {
    condition: (_, { getState }) => {
      const state = getState();
      return (
        state.player?.summary?.role === "player" &&
        state.withdrawals?.request?.status !== "loading"
      );
    },
  },
);

const pageState = () => ({
  hasMore: false,
  limit: WITHDRAWAL_PAGE_LIMIT,
  nextCursor: null,
});

const initialState = {
  destinations: {
    availability: { blocker: "PAYOUT_PROCESSING_UNAVAILABLE", canRequest: false },
    error: null,
    items: [],
    requestId: null,
    status: "idle",
  },
  history: {
    error: null,
    items: [],
    page: pageState(),
    requestId: null,
    status: "idle",
  },
  request: {
    error: null,
    latest: null,
    requestId: null,
    status: "idle",
  },
};

const storeListRequest = (branch, action, loadingStatus = "loading") => {
  branch.error = null;
  branch.requestId = action.meta.requestId;
  branch.status = loadingStatus;
};

const storeListFailure = (branch, action) => {
  if (branch.requestId !== action.meta.requestId) return;
  branch.requestId = null;
  if (action.meta.aborted || action.meta.condition) {
    branch.status = branch.items.length ? "succeeded" : "idle";
    return;
  }
  branch.error = action.payload || action.error?.message;
  branch.status = "failed";
};

const withdrawalSlice = createSlice({
  name: "withdrawals",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayoutDestinations.pending, (state, action) => {
        storeListRequest(state.destinations, action);
      })
      .addCase(fetchPayoutDestinations.fulfilled, (state, action) => {
        if (state.destinations.requestId !== action.meta.requestId) return;
        state.destinations.items = action.payload.destinations;
        state.destinations.availability = action.payload.availability;
        state.destinations.error = null;
        state.destinations.requestId = null;
        state.destinations.status = "succeeded";
      })
      .addCase(fetchPayoutDestinations.rejected, (state, action) => {
        storeListFailure(state.destinations, action);
      })
      .addCase(fetchWithdrawalHistory.pending, (state, action) => {
        storeListRequest(
          state.history,
          action,
          action.meta.arg?.cursor ? "loadingMore" : "loading",
        );
      })
      .addCase(fetchWithdrawalHistory.fulfilled, (state, action) => {
        if (state.history.requestId !== action.meta.requestId) return;
        const isNextPage = Boolean(action.meta.arg?.cursor);
        if (isNextPage) {
          const knownIds = new Set(state.history.items.map((item) => item.id));
          action.payload.withdrawals.forEach((item) => {
            if (knownIds.has(item.id)) return;
            state.history.items.push(item);
            knownIds.add(item.id);
          });
        } else {
          state.history.items = action.payload.withdrawals;
        }
        state.history.page = {
          hasMore: Boolean(action.payload.page.hasMore),
          limit: action.payload.page.limit || WITHDRAWAL_PAGE_LIMIT,
          nextCursor: action.payload.page.nextCursor || null,
        };
        state.history.error = null;
        state.history.requestId = null;
        state.history.status = "succeeded";
      })
      .addCase(fetchWithdrawalHistory.rejected, (state, action) => {
        storeListFailure(state.history, action);
      })
      .addCase(requestWithdrawal.pending, (state, action) => {
        state.request.error = null;
        state.request.requestId = action.meta.requestId;
        state.request.status = "loading";
      })
      .addCase(requestWithdrawal.fulfilled, (state, action) => {
        if (state.request.requestId !== action.meta.requestId) return;
        state.request.latest = action.payload;
        state.request.requestId = null;
        state.request.status = "succeeded";
        if (action.payload?.id) {
          state.history.items = [
            action.payload,
            ...state.history.items.filter((item) => item.id !== action.payload.id),
          ];
        }
      })
      .addCase(requestWithdrawal.rejected, (state, action) => {
        if (state.request.requestId !== action.meta.requestId) return;
        state.request.requestId = null;
        if (action.meta.aborted || action.meta.condition) {
          state.request.status = "idle";
          return;
        }
        state.request.error = action.payload || action.error?.message;
        state.request.status = "failed";
      });
  },
});

export default withdrawalSlice;
