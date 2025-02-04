import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios-api";
import { showToast, types } from "./toastSlice";

// Async thunk for fetching tournaments from the server
export const fetchTournaments = createAsyncThunk(
  "tournament/fetchTournaments",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/api/tournaments/searchBattleCOC", {
        withCredentials: true,
      });
      thunkAPI.dispatch(
        showToast({
          message: response.data.message,
          type: types.SUCCESS,
          position: "bottom-right",
        })
      );
      return response.data; // Return the tournament data from the API
    } catch (error) {
      thunkAPI.dispatch(
        showToast({
          message: error.response.data.error,
          type: types.DANGER,
          position: "bottom-right",
        })
      );
      e;
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
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
