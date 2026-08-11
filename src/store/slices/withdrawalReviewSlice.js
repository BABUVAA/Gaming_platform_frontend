import { createSlice } from "@reduxjs/toolkit";
import createApiThunk from "../thunks/createApiThunk.js";

export const WITHDRAWAL_REVIEW_PAGE_LIMIT = 20;

const selectQueue = (response) => {
  const data = response.data?.data;
  if (!Array.isArray(data?.withdrawals) || !data?.page) {
    throw new Error("Withdrawal review queue response is invalid.");
  }
  return data;
};

export const fetchWithdrawalReviewQueue = createApiThunk(
  "admin/fetchWithdrawalReviewQueue",
  {
    path: "/api/admin/withdrawals",
    getParams: ({ cursor = null } = {}) => ({
      limit: WITHDRAWAL_REVIEW_PAGE_LIMIT,
      ...(cursor ? { cursor } : {}),
    }),
    selectData: selectQueue,
    errorMessage: "Unable to load the withdrawal review queue.",
  },
);

const reviewAction = ({ action, errorMessage, getBody = () => ({}), toast }) =>
  createApiThunk(
    `admin/withdrawal/${action}`,
    {
      method: "post",
      path: ({ arg }) =>
        `/api/admin/withdrawals/${arg.withdrawalId}/${action}`,
      getBody,
      selectData: (response) => response.data?.data?.withdrawal,
      errorMessage,
      toast: { success: toast, error: true },
    },
    {
      condition: ({ withdrawalId }, { getState }) => {
        const state = getState().withdrawalReview;
        const item = state?.items.find((candidate) => candidate.id === withdrawalId);
        const allowed =
          action === "start-review"
            ? item?.actions?.canStartReview
            : item?.actions?.canDecide;
        return Boolean(
          allowed && state?.actionRequests?.[withdrawalId]?.status !== "loading",
        );
      },
    },
  );

export const startWithdrawalReview = reviewAction({
  action: "start-review",
  errorMessage: "Unable to start this withdrawal review.",
  toast: "Withdrawal review assigned to you.",
});

export const decideWithdrawal = reviewAction({
  action: "decision",
  errorMessage: "Unable to record this withdrawal decision.",
  getBody: ({ decision, note = "" }) => ({ decision, note }),
  toast: ({ arg }) =>
    arg.decision === "approve"
      ? "Withdrawal approved for provider processing."
      : "Withdrawal rejected and funds released by the server.",
});

const actionThunks = [
  startWithdrawalReview,
  decideWithdrawal,
];

const initialState = {
  actionRequests: {},
  items: [],
  page: {
    hasMore: false,
    limit: WITHDRAWAL_REVIEW_PAGE_LIMIT,
    nextCursor: null,
  },
  queueError: null,
  queueRequestId: null,
  queueStatus: "idle",
};

const withdrawalReviewSlice = createSlice({
  name: "withdrawalReview",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWithdrawalReviewQueue.pending, (state, action) => {
        state.queueError = null;
        state.queueRequestId = action.meta.requestId;
        state.queueStatus = action.meta.arg?.cursor ? "loadingMore" : "loading";
      })
      .addCase(fetchWithdrawalReviewQueue.fulfilled, (state, action) => {
        if (state.queueRequestId !== action.meta.requestId) return;
        if (action.meta.arg?.cursor) {
          const knownIds = new Set(state.items.map((item) => item.id));
          action.payload.withdrawals.forEach((item) => {
            if (knownIds.has(item.id)) return;
            state.items.push(item);
            knownIds.add(item.id);
          });
        } else {
          state.items = action.payload.withdrawals;
        }
        state.page = {
          hasMore: Boolean(action.payload.page.hasMore),
          limit: action.payload.page.limit || WITHDRAWAL_REVIEW_PAGE_LIMIT,
          nextCursor: action.payload.page.nextCursor || null,
        };
        state.queueError = null;
        state.queueRequestId = null;
        state.queueStatus = "succeeded";
      })
      .addCase(fetchWithdrawalReviewQueue.rejected, (state, action) => {
        if (state.queueRequestId !== action.meta.requestId) return;
        state.queueRequestId = null;
        if (action.meta.aborted || action.meta.condition) {
          state.queueStatus = state.items.length ? "succeeded" : "idle";
          return;
        }
        state.queueError = action.payload || action.error?.message;
        state.queueStatus = "failed";
      });

    actionThunks.forEach((thunk) => {
      builder
        .addCase(thunk.pending, (state, action) => {
          state.actionRequests[action.meta.arg.withdrawalId] = {
            error: null,
            requestId: action.meta.requestId,
            status: "loading",
          };
        })
        .addCase(thunk.fulfilled, (state, action) => {
          const id = action.meta.arg.withdrawalId;
          const request = state.actionRequests[id];
          if (request?.requestId !== action.meta.requestId) return;
          const index = state.items.findIndex((item) => item.id === id);
          if (index >= 0 && action.payload) state.items[index] = action.payload;
          state.actionRequests[id] = {
            error: null,
            requestId: null,
            status: "succeeded",
          };
        })
        .addCase(thunk.rejected, (state, action) => {
          const id = action.meta.arg.withdrawalId;
          const request = state.actionRequests[id];
          if (request?.requestId !== action.meta.requestId) return;
          state.actionRequests[id] = {
            error:
              action.meta.aborted || action.meta.condition
                ? null
                : action.payload || action.error?.message,
            requestId: null,
            status:
              action.meta.aborted || action.meta.condition ? "idle" : "failed",
          };
        });
    });
  },
});

export default withdrawalReviewSlice;
