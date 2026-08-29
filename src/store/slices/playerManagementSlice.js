import { createSlice } from "@reduxjs/toolkit";
import createApiThunk from "../thunks/createApiThunk.js";

export const fetchManagedPlayers = createApiThunk(
  "playerManagement/fetchPlayers",
  {
    path: "/api/admin/players",
    getParams: ({ cursor = null, search = "", status = "all" } = {}) => ({
      limit: 25,
      status,
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(cursor ? { cursor } : {}),
    }),
    selectData: (response) =>
      response.data?.data || {
        page: { hasMore: false, nextCursor: null },
        players: [],
        summary: {},
      },
    errorMessage: "Unable to load registered players.",
    toast: { error: true },
  },
);

const initialState = {
  error: null,
  latestRequestId: null,
  page: { hasMore: false, limit: 25, nextCursor: null },
  players: [],
  status: "idle",
  summary: {
    banned: 0,
    pendingVerification: 0,
    total: 0,
    underReview: 0,
    verified: 0,
  },
};

const slice = createSlice({
  name: "playerManagement",
  initialState,
  reducers: {},
  extraReducers: (builder) =>
    builder
      .addCase(fetchManagedPlayers.pending, (state, action) => {
        state.error = null;
        state.latestRequestId = action.meta.requestId;
        state.status = action.meta.arg?.cursor ? "loading_more" : "loading";
      })
      .addCase(fetchManagedPlayers.fulfilled, (state, action) => {
        if (state.latestRequestId !== action.meta.requestId) return;
        const incoming = action.payload.players || [];
        if (action.meta.arg?.cursor) {
          const knownIds = new Set(state.players.map((player) => player.id));
          state.players.push(
            ...incoming.filter((player) => !knownIds.has(player.id)),
          );
        } else {
          state.players = incoming;
        }
        state.page = action.payload.page || initialState.page;
        state.summary = { ...initialState.summary, ...action.payload.summary };
        state.latestRequestId = null;
        state.status = "succeeded";
      })
      .addCase(fetchManagedPlayers.rejected, (state, action) => {
        if (state.latestRequestId !== action.meta.requestId) return;
        state.error = action.payload || action.error.message;
        state.latestRequestId = null;
        state.status = "failed";
      }),
});

export default slice;
