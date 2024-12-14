import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios-api";

// Async thunk for fetching tournaments from the server
export const fetchTournaments = createAsyncThunk(
  "tournament/fetchTournaments",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/tournaments", {
        withCredentials: true,
      });
      return response.data; // Return the tournament data from the API
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Tournament slice
const tournamentSlice = createSlice({
  name: "tournament",
  initialState: {
    tournaments: [], // No default data
    error: null,
    loading: false,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTournaments.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTournaments.fulfilled, (state, action) => {
        state.loading = false;
        state.tournaments = action.payload; // The API will return the tournament data
      })
      .addCase(fetchTournaments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload; // Handle errors if the fetch fails
      });
  },
});

export const tournamentAction = tournamentSlice.actions;
export default tournamentSlice;
