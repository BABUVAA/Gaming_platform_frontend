import { createSlice } from "@reduxjs/toolkit";
import createApiThunk from "../thunks/createApiThunk.js";

const normalizePage = (page) => ({
  hasMore: page?.hasMore === true,
  limit: Number(page?.limit) || 25,
  nextCursor: page?.nextCursor || null,
});

const playerParticipationCondition = {
  condition: (_, { getState }) =>
    getState().player?.summary?.role !== "staff",
};

export const fetchPlayerMatchActivity = createApiThunk(
  "matchActivity/fetchActivity",
  {
    request: async ({ api, signal }) => {
      const [queuesResponse, matchesResponse] = await Promise.all([
        api.get("/api/matches/queues", { signal }),
        api.get("/api/matches", { signal }),
      ]);
      return {
        data: {
          matches: matchesResponse.data?.data || [],
          matchPage: normalizePage(matchesResponse.data?.page),
          queues: queuesResponse.data?.data || [],
          queuePage: normalizePage(queuesResponse.data?.page),
        },
      };
    },
    selectData: (response) => response.data,
    errorMessage: "Unable to load your match activity.",
    toast: { error: true },
  },
);

export const fetchMorePlayerMatchActivity = createApiThunk(
  "matchActivity/fetchMoreActivity",
  {
    request: async ({ api, arg, signal }) => {
      const requests = [];
      if (arg?.queueCursor) {
        requests.push(api.get("/api/matches/queues", {
          params: { cursor: arg.queueCursor },
          signal,
        }).then((result) => ({ kind: "queues", result })));
      }
      if (arg?.matchCursor) {
        requests.push(api.get("/api/matches", {
          params: { cursor: arg.matchCursor },
          signal,
        }).then((result) => ({ kind: "matches", result })));
      }
      const pages = await Promise.all(requests);
      return {
        data: pages.reduce((loaded, { kind, result }) => ({
          ...loaded,
          [kind]: result.data?.data || [],
          [kind === "matches" ? "matchPage" : "queuePage"]: normalizePage(result.data?.page),
        }), {}),
      };
    },
    selectData: (response) => response.data,
    errorMessage: "Unable to load more match activity.",
    toast: { error: true },
  },
  {
    condition: (arg, { getState }) => {
      const state = getState().matchActivity;
      return state.moreStatus !== "loading" && Boolean(arg?.matchCursor || arg?.queueCursor);
    },
  },
);

export const fetchPlayerMatch = createApiThunk(
  "matchActivity/fetchMatch",
  {
    path: ({ arg }) => `/api/matches/${arg}`,
    selectData: (response) => response.data?.data || null,
    errorMessage: "Unable to load this match room.",
    toast: { error: true },
  },
);

export const raisePlayerMatchDispute = createApiThunk(
  "matchActivity/raiseDispute",
  {
    path: ({ arg }) => `/api/matches/${arg.matchId}/dispute`,
    method: "patch",
    getBody: ({ reason }) => ({ reason }),
    selectData: (response) => response.data?.data || null,
    errorMessage: "Unable to raise this match dispute.",
    toast: { success: true, error: true },
  },
  playerParticipationCondition,
);

const initialState = {
  actionStatus: "idle",
  activity: [],
  activityError: null,
  activityRequestId: null,
  activityStatus: "idle",
  matchPage: { hasMore: false, nextCursor: null },
  moreError: null,
  moreRequestId: null,
  moreStatus: "idle",
  queuePage: { hasMore: false, nextCursor: null },
  selectedError: null,
  selectedMatch: null,
  selectedStatus: "idle",
};

const getActivityTime = (activity) =>
  new Date(activity.createdAt || activity.scheduledFor || 0).getTime();

const mergeActivity = (current, queues = [], matches = []) => {
  const byIdentity = new Map(
    current.map((item) => [`${item.kind || "match"}:${item._id}`, item]),
  );
  [...queues, ...matches].forEach((item) => {
    byIdentity.set(`${item.kind || "match"}:${item._id}`, item);
  });
  return [...byIdentity.values()].sort(
    (first, second) => getActivityTime(second) - getActivityTime(first),
  );
};

const matchCommands = [raisePlayerMatchDispute];

const matchActivitySlice = createSlice({
  name: "matchActivity",
  initialState,
  reducers: {
    clearSelectedMatch(state) {
      state.selectedError = null;
      state.selectedMatch = null;
      state.selectedStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlayerMatchActivity.pending, (state, action) => {
        state.activityError = null;
        state.activityRequestId = action.meta.requestId;
        state.activityStatus = "loading";
        state.moreError = null;
        state.moreRequestId = null;
        state.moreStatus = "idle";
      })
      .addCase(fetchPlayerMatchActivity.fulfilled, (state, action) => {
        if (state.activityRequestId !== action.meta.requestId) return;
        const queues = Array.isArray(action.payload?.queues)
          ? action.payload.queues
          : [];
        const matches = Array.isArray(action.payload?.matches)
          ? action.payload.matches
          : [];
        state.activity = mergeActivity([], queues, matches);
        state.matchPage = action.payload?.matchPage || { hasMore: false, nextCursor: null };
        state.queuePage = action.payload?.queuePage || { hasMore: false, nextCursor: null };
        state.activityRequestId = null;
        state.activityStatus = "succeeded";
      })
      .addCase(fetchPlayerMatchActivity.rejected, (state, action) => {
        if (state.activityRequestId !== action.meta.requestId) return;
        state.activityRequestId = null;
        if (action.meta.aborted) {
          state.activityStatus = "idle";
          return;
        }
        state.activityError = action.payload;
        state.activityStatus = "failed";
      })
      .addCase(fetchMorePlayerMatchActivity.pending, (state, action) => {
        state.moreError = null;
        state.moreRequestId = action.meta.requestId;
        state.moreStatus = "loading";
      })
      .addCase(fetchMorePlayerMatchActivity.fulfilled, (state, action) => {
        if (state.moreRequestId !== action.meta.requestId) return;
        state.activity = mergeActivity(
          state.activity,
          Array.isArray(action.payload?.queues) ? action.payload.queues : [],
          Array.isArray(action.payload?.matches) ? action.payload.matches : [],
        );
        if (action.payload?.matchPage) state.matchPage = action.payload.matchPage;
        if (action.payload?.queuePage) state.queuePage = action.payload.queuePage;
        state.moreRequestId = null;
        state.moreStatus = "succeeded";
      })
      .addCase(fetchMorePlayerMatchActivity.rejected, (state, action) => {
        if (state.moreRequestId !== action.meta.requestId) return;
        state.moreRequestId = null;
        if (action.meta.condition || action.meta.aborted) {
          state.moreStatus = "idle";
          return;
        }
        state.moreError = action.payload;
        state.moreStatus = "failed";
      })
      .addCase(fetchPlayerMatch.pending, (state) => {
        state.selectedError = null;
        state.selectedStatus = "loading";
      })
      .addCase(fetchPlayerMatch.fulfilled, (state, action) => {
        state.selectedMatch = action.payload;
        state.selectedStatus = "succeeded";
      })
      .addCase(fetchPlayerMatch.rejected, (state, action) => {
        if (action.meta.aborted) {
          state.selectedStatus = "idle";
          return;
        }
        state.selectedError = action.payload;
        state.selectedMatch = null;
        state.selectedStatus = "failed";
      });

    matchCommands.forEach((command) => {
      builder
        .addCase(command.pending, (state) => {
          state.actionStatus = "loading";
        })
        .addCase(command.fulfilled, (state, action) => {
          state.actionStatus = "succeeded";
          if (action.payload) state.selectedMatch = action.payload;
        })
        .addCase(command.rejected, (state, action) => {
          if (action.meta.condition) return;
          state.actionStatus = action.meta.aborted ? "idle" : "failed";
        });
    });
  },
});

export default matchActivitySlice;
