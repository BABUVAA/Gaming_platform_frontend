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

// ✅ Update Tournaments (Existing)
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
    tournaments: {
      activeTournaments: [],
      upcomingTournaments: [],
      pastTournaments: [],
      featuredTournaments: [],
      tournament: [],
    },
    tournamentId: null,
    error: null,
    loading: false,
  },
  reducers: {
    // Add tournament to a category
    addTournament(state, action) {
      const { category, tournament } = action.payload;
      console.log(state.tournaments[category]);

      if (!state.tournaments[category]) {
        console.warn(`Category ${category} does not exist in tournaments.`);
        return;
      }

      const exists = state.tournaments[category].some(
        (t) => t._id === tournament._id
      );

      if (!exists) {
        state.tournaments[category].push(tournament);
      } else {
        const index = state.tournaments[category].findIndex(
          (t) => t._id === tournament._id
        );
        if (index !== -1) {
          state.tournaments[category][index] = {
            ...state.tournaments[category][index],
            ...tournament,
          };
        }
      }
    },

    // Update tournament in all categories
    updateTournament(state, action) {
      const updatedTournament = action.payload;
      const categories = Object.keys(state.tournaments);

      categories.forEach((category) => {
        const index = state.tournaments[category].findIndex(
          (t) => t._id === updatedTournament._id
        );
        if (index !== -1) {
          state.tournaments[category][index] = {
            ...state.tournaments[category][index],
            ...updatedTournament,
          };
        }
      });
    },

    // Remove tournament from a specific category
    removeTournament(state, action) {
      const { category, tournamentId } = action.payload;

      if (state.tournaments[category]) {
        state.tournaments[category] = state.tournaments[category].filter(
          (t) => t._id !== tournamentId
        );
      }
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
