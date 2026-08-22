import { createSlice } from "@reduxjs/toolkit";
import createApiThunk from "../thunks/createApiThunk.js";

const selectEnvelopeData = (response) => response.data?.data;
const OPERATOR_MATCH_PAGE_LIMIT = 25;
const emptyPage = () => ({
  hasMore: false,
  limit: OPERATOR_MATCH_PAGE_LIMIT,
  nextCursor: null,
});
const normalizeMatchPage = (response) => {
  const data = selectEnvelopeData(response);
  return Array.isArray(data)
    ? { items: data, page: emptyPage() }
    : {
        items: Array.isArray(data?.items) ? data.items : [],
        page: {
          hasMore: Boolean(data?.page?.hasMore),
          limit: data?.page?.limit || OPERATOR_MATCH_PAGE_LIMIT,
          nextCursor: data?.page?.nextCursor || null,
        },
      };
};

export const fetchOperatorWorkspace = createApiThunk(
  "operatorOperations/fetchWorkspace",
  {
    request: async ({ api, signal }) => {
      const [dashboard, matches, rooms, unassigned] = await Promise.all([
        api.get("/api/operator/dashboard", { signal }),
        api.get("/api/operator/matches", {
          params: { limit: OPERATOR_MATCH_PAGE_LIMIT },
          signal,
        }),
        api.get("/api/operator/rooms", { params: { limit: 50 }, signal }),
        api.get("/api/operator/matches/unassigned", {
          params: { limit: OPERATOR_MATCH_PAGE_LIMIT },
          signal,
        }),
      ]);

      return { dashboard, matches, rooms, unassigned };
    },
    selectData: ({ dashboard, matches, rooms, unassigned }) => ({
      dashboard: selectEnvelopeData(dashboard) || null,
      assignedPage: normalizeMatchPage(matches),
      rooms: selectEnvelopeData(rooms)?.rooms || [],
      unassignedPage: normalizeMatchPage(unassigned),
    }),
    errorMessage: "Unable to load operator activity.",
    toast: { error: true },
  },
);

export const fetchMoreOperatorMatches = createApiThunk(
  "operatorOperations/fetchMoreMatches",
  {
    path: ({ arg }) =>
      arg.kind === "unassigned"
        ? "/api/operator/matches/unassigned"
        : "/api/operator/matches",
    getParams: ({ cursor }) => ({
      cursor,
      limit: OPERATOR_MATCH_PAGE_LIMIT,
    }),
    selectData: (response) => normalizeMatchPage(response),
    errorMessage: "Unable to load more operator matches.",
  },
  {
    condition: ({ cursor, kind }, { getState }) => {
      const state = getState().operatorOperations;
      return Boolean(
        cursor &&
        ["assigned", "unassigned"].includes(kind) &&
        state.pageStatus[kind] !== "loading" &&
        state.pages[kind].nextCursor === cursor,
      );
    },
  },
);

export const claimOperatorMatch = createApiThunk(
  "operatorOperations/claimMatch",
  {
    method: "patch",
    path: ({ arg }) => `/api/operator/matches/${arg}/claim`,
    selectData: selectEnvelopeData,
    errorMessage: "Unable to take this match.",
    toast: { success: "Match added to your shift.", error: true },
  },
  {
    condition: (_, { getState }) =>
      getState().operatorOperations.actionStatus !== "loading",
  },
);

export const executeOperatorMatchCommand = createApiThunk(
  "operatorOperations/executeCommand",
  {
    method: "patch",
    path: ({ arg }) =>
      `/api/operator/matches/${arg.matchId}/commands/${arg.command}`,
    getBody: ({ body }) => body,
    selectData: selectEnvelopeData,
    errorMessage: "Unable to complete this match action.",
    toast: { success: true, error: true },
  },
  {
    condition: (_, { getState }) =>
      getState().operatorOperations.actionStatus !== "loading",
  },
);

const upsertAssignedMatch = (state, match) => {
  if (!match?._id) return;
  const index = state.matches.findIndex((item) => item._id === match._id);
  if (index >= 0) state.matches[index] = match;
  else state.matches.unshift(match);
};

const operatorOperationsSlice = createSlice({
  name: "operatorOperations",
  initialState: {
    actionError: null,
    actionStatus: "idle",
    activeAction: "",
    dashboard: null,
    error: null,
    matches: [],
    rooms: [],
    pageError: { assigned: null, unassigned: null },
    pageRequestId: { assigned: null, unassigned: null },
    pages: { assigned: emptyPage(), unassigned: emptyPage() },
    pageStatus: { assigned: "idle", unassigned: "idle" },
    status: "idle",
    unassigned: [],
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOperatorWorkspace.pending, (state) => {
        state.error = null;
        state.pageRequestId = { assigned: null, unassigned: null };
        state.status = "loading";
      })
      .addCase(fetchOperatorWorkspace.fulfilled, (state, action) => {
        state.dashboard = action.payload.dashboard;
        state.matches = action.payload.assignedPage.items;
        state.rooms = action.payload.rooms;
        state.pages.assigned = action.payload.assignedPage.page;
        state.unassigned = action.payload.unassignedPage.items;
        state.pages.unassigned = action.payload.unassignedPage.page;
        state.status = "succeeded";
      })
      .addCase(fetchOperatorWorkspace.rejected, (state, action) => {
        state.error = action.meta.aborted
          ? null
          : action.payload || action.error.message;
        state.status = action.meta.aborted ? "idle" : "failed";
      })
      .addCase(fetchMoreOperatorMatches.pending, (state, action) => {
        const { kind } = action.meta.arg;
        state.pageError[kind] = null;
        state.pageRequestId[kind] = action.meta.requestId;
        state.pageStatus[kind] = "loading";
      })
      .addCase(fetchMoreOperatorMatches.fulfilled, (state, action) => {
        const { kind } = action.meta.arg;
        if (state.pageRequestId[kind] !== action.meta.requestId) return;
        const target = kind === "assigned" ? state.matches : state.unassigned;
        const ids = new Set(target.map((match) => match._id));
        action.payload.items.forEach((match) => {
          if (!ids.has(match._id)) target.push(match);
        });
        state.pages[kind] = action.payload.page;
        state.pageRequestId[kind] = null;
        state.pageStatus[kind] = "succeeded";
      })
      .addCase(fetchMoreOperatorMatches.rejected, (state, action) => {
        if (action.meta.condition) return;
        const { kind } = action.meta.arg;
        if (state.pageRequestId[kind] !== action.meta.requestId) return;
        state.pageRequestId[kind] = null;
        state.pageStatus[kind] = action.meta.aborted ? "idle" : "failed";
        state.pageError[kind] = action.meta.aborted
          ? null
          : action.payload || action.error;
      });

    [
      [claimOperatorMatch, "claim"],
      [executeOperatorMatchCommand, "command"],
    ].forEach(([thunk, actionName]) => {
      builder
        .addCase(thunk.pending, (state, action) => {
          const matchId = action.meta.arg?.matchId || action.meta.arg;
          state.actionError = null;
          state.actionStatus = "loading";
          state.activeAction = `${matchId}:${actionName}`;
        })
        .addCase(thunk.fulfilled, (state, action) => {
          upsertAssignedMatch(state, action.payload);
          state.unassigned = state.unassigned.filter(
            (match) => match._id !== action.payload?._id,
          );
          state.actionStatus = "succeeded";
          state.activeAction = "";
        })
        .addCase(thunk.rejected, (state, action) => {
          if (!action.meta.condition) {
            state.actionError = action.meta.aborted
              ? null
              : action.payload || action.error.message;
            state.actionStatus = action.meta.aborted ? "idle" : "failed";
            state.activeAction = "";
          }
        });
    });
  },
});

export default operatorOperationsSlice;
