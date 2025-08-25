import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios-api";
import { showToast, types } from "./toastSlice";

// ✅ Fetch All Tournaments (Updated for the new structure)
export const fetchTournaments = createAsyncThunk(
  "tournament/fetchTournaments",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/api/tournaments/fetchAllTournament", {
        withCredentials: true,
      });
      return response.data.tournaments; // New structure: { tournamentId: tournamentData }
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ✅ Update Tournament
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

// ✅ Fetch Single Tournament by ID
export const fetchTournamentById = createAsyncThunk(
  "tournament/fetchTournamentById",
  async (tournamentId, thunkAPI) => {
    try {
      const response = await api.get(`/api/tournaments/${tournamentId}`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ✅ Tournament Slice
const tournamentSlice = createSlice({
  name: "tournament",
  initialState: {
    tournaments: {}, // Store tournaments as { tournament.id: tournamentData }
    tournamentId: null,
    error: null,
    loading: false,
  },
  reducers: {
    // Add tournament to a category (new structure)
    addTournament(state, action) {
      const { tournament } = action.payload;

      if (!state.tournaments[tournament._id]) {
        state.tournaments[tournament._id] = tournament;
      } else {
        state.tournaments[tournament._id] = {
          ...state.tournaments[tournament._id],
          ...tournament,
        };
      }
    },

    // Update tournament in all categories (new structure)
    updateTournament(state, action) {
      const updatedTournament = action.payload;

      if (state.tournaments[updatedTournament._id]) {
        state.tournaments[updatedTournament._id] = {
          ...state.tournaments[updatedTournament._id],
          ...updatedTournament,
        };
      }
    },

    // Remove tournament (new structure)
    removeTournament(state, action) {
      const { tournamentId } = action.payload;
      delete state.tournaments[tournamentId];
    },

    //update tournamentById
    updateTournamentById(state, action) {
      console.log(action.payload);
      console.log("current", state.tournamentId);
      state.tournamentId = action.payload;
      console.log("updated", state.tournamentId);
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchTournaments.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTournaments.fulfilled, (state, action) => {
        state.loading = false;
        state.tournaments = action.payload; // Update tournaments with the new structure
      })
      .addCase(fetchTournaments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateTournament.fulfilled, (state, action) => {
        const updatedTournament = action.payload;
        state.tournaments[updatedTournament._id] = updatedTournament;
      })
      .addCase(updateTournament.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(fetchTournamentById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTournamentById.fulfilled, (state, action) => {
        state.loading = false;
        state.tournamentId = action.payload;
      })
      .addCase(fetchTournamentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const tournamentAction = tournamentSlice.actions;
export default tournamentSlice;
