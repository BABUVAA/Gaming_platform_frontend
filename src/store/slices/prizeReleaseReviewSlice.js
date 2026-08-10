import { createSlice } from "@reduxjs/toolkit";
import createApiThunk from "../thunks/createApiThunk.js";

export const PRIZE_RELEASE_PAGE_LIMIT = 20;

const selectQueueData = (response) => {
  const data = response.data?.data;
  if (!Array.isArray(data?.items) || !data?.page) {
    throw new Error("Prize release queue response is invalid.");
  }
  return data;
};

export const fetchPrizeReleaseQueue = createApiThunk(
  "admin/fetchPrizeReleaseQueue",
  {
    path: "/api/admin/prize-releases",
    getParams: ({ cursor = null } = {}) => ({
      limit: PRIZE_RELEASE_PAGE_LIMIT,
      ...(cursor ? { cursor } : {}),
    }),
    selectData: selectQueueData,
    errorMessage: "Unable to load the prize release queue.",
  },
);

export const releaseMatchPrize = createApiThunk(
  "admin/releaseMatchPrize",
  {
    method: "post",
    path: ({ arg }) =>
      `/api/admin/prize-releases/${arg.matchId}/release`,
    // The match is path-owned. No winner, allocation, or amount is accepted
    // from browser state for this irreversible financial command.
    getBody: () => ({}),
    selectData: (response) => response.data?.data?.release,
    errorMessage: "Unable to release this prize.",
    toast: {
      success: "Prize released to the recorded winner wallet or wallets.",
      error: true,
    },
  },
  {
    condition: ({ matchId }, { getState }) => {
      const state = getState().prizeReleaseReview;
      const item = state?.items.find((candidate) => candidate.matchId === matchId);
      return Boolean(
        item?.review?.canRelease &&
          state?.releaseRequests?.[matchId]?.status !== "loading",
      );
    },
  },
);

const initialState = {
  items: [],
  latestRelease: null,
  page: {
    hasMore: false,
    limit: PRIZE_RELEASE_PAGE_LIMIT,
    nextCursor: null,
  },
  queueError: null,
  queueRequestId: null,
  queueStatus: "idle",
  releaseRequests: {},
};

const prizeReleaseReviewSlice = createSlice({
  name: "prizeReleaseReview",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPrizeReleaseQueue.pending, (state, action) => {
        state.queueError = null;
        state.queueRequestId = action.meta.requestId;
        state.queueStatus = action.meta.arg?.cursor ? "loadingMore" : "loading";
      })
      .addCase(fetchPrizeReleaseQueue.fulfilled, (state, action) => {
        if (state.queueRequestId !== action.meta.requestId) return;

        const isNextPage = Boolean(action.meta.arg?.cursor);
        if (isNextPage) {
          const knownMatchIds = new Set(
            state.items.map((item) => item.matchId),
          );
          action.payload.items.forEach((item) => {
            if (knownMatchIds.has(item.matchId)) return;
            state.items.push(item);
            knownMatchIds.add(item.matchId);
          });
        } else {
          state.items = action.payload.items;
        }

        state.page = {
          hasMore: Boolean(action.payload.page.hasMore),
          limit: action.payload.page.limit || PRIZE_RELEASE_PAGE_LIMIT,
          nextCursor: action.payload.page.nextCursor || null,
        };
        state.queueError = null;
        state.queueRequestId = null;
        state.queueStatus = "succeeded";
      })
      .addCase(fetchPrizeReleaseQueue.rejected, (state, action) => {
        if (state.queueRequestId !== action.meta.requestId) return;

        state.queueRequestId = null;
        if (action.meta.aborted || action.meta.condition) {
          state.queueStatus = state.items.length ? "succeeded" : "idle";
          return;
        }
        state.queueError = action.payload || action.error?.message;
        state.queueStatus = "failed";
      })
      .addCase(releaseMatchPrize.pending, (state, action) => {
        state.releaseRequests[action.meta.arg.matchId] = {
          error: null,
          requestId: action.meta.requestId,
          status: "loading",
        };
      })
      .addCase(releaseMatchPrize.fulfilled, (state, action) => {
        const matchId = action.meta.arg.matchId;
        const request = state.releaseRequests[matchId];
        if (request?.requestId !== action.meta.requestId) return;

        state.items = state.items.filter((item) => item.matchId !== matchId);
        state.latestRelease = action.payload;
        state.releaseRequests[matchId] = {
          error: null,
          requestId: null,
          status: "succeeded",
        };
      })
      .addCase(releaseMatchPrize.rejected, (state, action) => {
        const matchId = action.meta.arg.matchId;
        const request = state.releaseRequests[matchId];
        if (request?.requestId !== action.meta.requestId) return;

        state.releaseRequests[matchId] = {
          error:
            action.meta.aborted || action.meta.condition
              ? null
              : action.payload || action.error?.message,
          requestId: null,
          status:
            action.meta.aborted || action.meta.condition ? "idle" : "failed",
        };
      });
  },
});

export default prizeReleaseReviewSlice;
