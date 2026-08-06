import { createSlice } from "@reduxjs/toolkit";
import createApiThunk from "../thunks/createApiThunk";

// Game Manager requests use their own slice so scoped staff data never leaks
// into the Platform Admin catalog state.
export const fetchManagedGames = createApiThunk("gameManagement/fetchManagedGames", {
  path: "/api/staff/games",
  selectData: (response) => response.data?.data?.games || [],
  errorMessage: "Unable to load your assigned games.",
  toast: { error: true },
});

export const updateManagedGame = createApiThunk("gameManagement/updateManagedGame", {
  method: "patch",
  path: ({ arg }) => `/api/staff/games/${arg.gameId}`,
  // Identity and publishing state are intentionally absent from this payload.
  getBody: (payload) => {
    const configuration = { ...payload };
    delete configuration.gameId;
    return configuration;
  },
  selectData: (response) => response.data?.data?.game,
  errorMessage: "Unable to update this game configuration.",
  toast: { success: true, error: true },
});

const gameManagementSlice = createSlice({
  name: "gameManagement",
  initialState: { error: null, games: [], status: "idle" },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchManagedGames.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchManagedGames.fulfilled, (state, action) => {
        state.games = action.payload;
        state.status = "succeeded";
      })
      .addCase(fetchManagedGames.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
        state.status = "failed";
      })
      .addCase(updateManagedGame.fulfilled, (state, action) => {
        const index = state.games.findIndex((game) => game._id === action.payload?._id);
        if (index >= 0) state.games[index] = action.payload;
      });
  },
});

export default gameManagementSlice;
