import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios-api";
import { showToast, types } from "./toastSlice";

// ✅ Fetch Tournaments (Existing)
export const fetchTournaments = createAsyncThunk(
  "tournament/fetchTournaments",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/api/tournaments/fetchAllTournament", {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ✅ Update Tournament (New)
export const updateTournament = createAsyncThunk(
  "tournament/updateTournament",
  async ({ tournamentId, updatedData }, thunkAPI) => {
    try {
      const response = await api.put(
        `/api/tournaments/update/${tournamentId}`,
        updatedData,
        { withCredentials: true }
      );

      thunkAPI.dispatch(
        showToast({
          message: "Tournament updated successfully!",
          type: types.SUCCESS,
          position: "bottom-right",
        })
      );

      return response.data; // Return updated tournament
    } catch (error) {
      thunkAPI.dispatch(
        showToast({
          message: "Failed to update tournament.",
          type: types.DANGER,
          position: "bottom-right",
        })
      );
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ✅ Tournament Slice
const tournamentSlice = createSlice({
  name: "tournament",
  initialState: {
    tournaments: [],
    error: null,
    loading: false,
  },
  reducers: {
    // ✅ WebSocket Update Handler
    updateTournamentState: (state, action) => {
      const updatedTournament = action.payload;
      state.tournaments = state.tournaments.map((tournament) =>
        tournament.id === updatedTournament.id ? updatedTournament : tournament
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTournaments.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTournaments.fulfilled, (state, action) => {
        state.loading = false;
        state.tournaments = action.payload;
      })
      .addCase(fetchTournaments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateTournament.fulfilled, (state, action) => {
        state.tournaments = state.tournaments.map((tournament) =>
          tournament.id === action.payload.id ? action.payload : tournament
        );
      })
      .addCase(updateTournament.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const tournamentAction = tournamentSlice.actions;
export default tournamentSlice;
