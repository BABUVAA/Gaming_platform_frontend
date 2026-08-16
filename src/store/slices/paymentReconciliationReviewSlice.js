import { createSlice } from "@reduxjs/toolkit";
import createApiThunk from "../thunks/createApiThunk.js";

const selectData = (response) => response.data?.data;

export const fetchPaymentReconciliationQueue = createApiThunk(
  "paymentReconciliationReview/fetchQueue",
  {
    path: "/api/admin/payment-reconciliation",
    getParams: ({ cursor, status } = {}) => ({
      limit: 25,
      ...(cursor ? { cursor } : {}),
      ...(status ? { status } : {}),
    }),
    selectData,
    errorMessage: "Unable to load sandbox payment monitoring.",
  },
);

export const verifySandboxPayment = createApiThunk(
  "paymentReconciliationReview/verifyPayment",
  {
    method: "post",
    path: ({ arg }) =>
      `/api/admin/payment-reconciliation/${arg.jobId}/verify`,
    getBody: () => ({}),
    selectData: (response) => selectData(response)?.job || null,
    errorMessage: "Unable to verify this PhonePe sandbox payment.",
    toast: { success: true, error: true },
  },
  {
    condition: ({ jobId }, { getState }) =>
      !getState().paymentReconciliationReview.requests[jobId],
  },
);

const initialState = {
  error: null,
  items: [],
  page: { hasMore: false, limit: 25, nextCursor: null },
  requestId: null,
  requests: {},
  status: "idle",
};

const slice = createSlice({
  name: "paymentReconciliationReview",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPaymentReconciliationQueue.pending, (state, action) => {
        state.error = null;
        state.requestId = action.meta.requestId;
        state.status = action.meta.arg?.cursor ? "loadingMore" : "loading";
      })
      .addCase(fetchPaymentReconciliationQueue.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        const incoming = Array.isArray(action.payload?.items)
          ? action.payload.items
          : [];
        if (action.meta.arg?.cursor) {
          const ids = new Set(state.items.map((item) => item.id));
          incoming.forEach((item) => {
            if (!ids.has(item.id)) state.items.push(item);
          });
        } else {
          state.items = incoming;
        }
        state.page = {
          hasMore: Boolean(action.payload?.page?.hasMore),
          limit: action.payload?.page?.limit || 25,
          nextCursor: action.payload?.page?.nextCursor || null,
        };
        state.requestId = null;
        state.status = "succeeded";
      })
      .addCase(fetchPaymentReconciliationQueue.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.requestId = null;
        state.status = action.meta.aborted ? "idle" : "failed";
        state.error = action.meta.aborted ? null : action.payload || action.error;
      })
      .addCase(verifySandboxPayment.pending, (state, action) => {
        state.requests[action.meta.arg.jobId] = true;
      })
      .addCase(verifySandboxPayment.fulfilled, (state, action) => {
        delete state.requests[action.meta.arg.jobId];
        if (!action.payload?.id) return;
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index >= 0) state.items[index] = action.payload;
      })
      .addCase(verifySandboxPayment.rejected, (state, action) => {
        if (!action.meta.condition) delete state.requests[action.meta.arg.jobId];
      });
  },
});

export default slice;
