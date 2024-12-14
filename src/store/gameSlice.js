import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios-api"; // Ensure you have the correct axios instance

// Async thunk to fetch all games from the server
export const fetchGames = createAsyncThunk("/", async (_, thunkAPI) => {
  try {
    const response = await api.get("/"); // Replace with your API endpoint
    return response.data; // Expected array of games
  } catch (error) {
    return thunkAPI.rejectWithValue(
      error.response?.data || "Failed to fetch games"
    );
  }
});

// Slice for game data
const gameSlice = createSlice({
  name: "games",
  initialState: {
    data: [], // Initially, no games are loaded
    loading: false, // Tracks loading state
    error: null, // Tracks any error
  },
  reducers: {
    // Reducer to load games from localStorage
    loadGamesFromLocalStorage(state) {
      const storedGames = localStorage.getItem("games");
      if (storedGames) {
        state.data = JSON.parse(storedGames);
      }
    },
    // Reducer to save games to localStorage (optional, for completeness)
    saveGamesToLocalStorage(state) {
      localStorage.setItem("games", JSON.stringify(state.data));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGames.pending, (state) => {
        state.loading = true;
        state.error = null; // Clear any previous errors when fetching starts
      })
      .addCase(fetchGames.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload; // Set the games data to the state
        localStorage.setItem("games", JSON.stringify(action.payload)); // Persist to localStorage
      })
      .addCase(fetchGames.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Error fetching game data"; // Handle errors
      });
  },
});

// Exporting actions and reducer
export const { loadGamesFromLocalStorage, saveGamesToLocalStorage } =
  gameSlice.actions;

export default gameSlice;
