import { createSlice } from "@reduxjs/toolkit";
import { isCacheFresh, PUBLIC_CACHE_TTL } from "../cachePolicy";
import createApiThunk from "../thunks/createApiThunk";

export const fetchGames = createApiThunk(
  "games/fetchGames",
  {
    path: "/api/games",
    selectData: (response) => {
      if (!Array.isArray(response.data)) {
        throw new Error("Games response must be an array.");
      }

      // The timestamp travels with the fulfilled action so reducers remain
      // deterministic and never call Date.now() themselves.
      return {
        data: response.data,
        fetchedAt: Date.now(),
      };
    },
    errorMessage: "Failed to fetch games.",
  },
  {
    condition: ({ force = false } = {}, { getState }) => {
      const gamesState = getState().games;

      // A caller can force a refresh after a known mutation; normal bootstrap
      // requests reuse fresh persisted data and refuse overlapping requests.
      if (gamesState.status === "loading") return false;
      if (force) return true;

      return !isCacheFresh(
        gamesState.lastFetchedAt,
        PUBLIC_CACHE_TTL.GAMES,
      );
    },
  },
);

// Slice for game data
const gameSlice = createSlice({
  name: "games",
  initialState: {
    data: [],
    status: "idle",
    lastFetchedAt: null,
    error: null,
  },
  reducers: {
    invalidateGamesCache(state) {
      // Mutations can expire freshness without discarding still-renderable data.
      // The next normal fetch will refresh the catalog from the backend.
      state.lastFetchedAt = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGames.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchGames.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload.data;
        state.lastFetchedAt = action.payload.fetchedAt;
      })
      .addCase(fetchGames.rejected, (state, action) => {
        // Cancelling navigation is not a failed cache refresh.
        if (action.meta.aborted || action.meta.condition) {
          state.status = "idle";
          return;
        }

        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const gameActions = gameSlice.actions;
export default gameSlice;
