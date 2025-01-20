import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios-api"; // Ensure you have the correct axios instance

// Async thunk to fetch all games from the server
export const createClan = createAsyncThunk(
  "/auth/clan/create",
  async (clanData, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/clan/createClan", clanData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Async thunk to fetch all games from the server
export const fetchUserClan = createAsyncThunk(
  "/auth/clan/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/clan/fetchClan");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Slice for game data
const clanSlice = createSlice({
  name: "clan",
  initialState: {
    createClanData: {},
    userClanData: {},
    searchClanData: {},
    loading: false, // Tracks loading state
    error: null, // Tracks any error
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createClan.fulfilled, (state, action) => {
        state.createClanData = action.payload;
      })
      .addCase(createClan.pending, (state, action) => {
        state.createClanData = "Creating Clan....";
      })
      .addCase(createClan.rejected, (state, action) => {
        state.error = action.payload;
        state.createClanData = null;
      })
      .addCase(fetchUserClan.fulfilled, (state, action) => {
        state.userClanData = action.payload;
      })
      .addCase(fetchUserClan.pending, (state, action) => {
        state.userClanData = "Fetching Clan....";
      })
      .addCase(fetchUserClan.rejected, (state, action) => {
        state.error = action.payload;
        state.userClanData = null;
      });
  },
});

// Exporting actions and reducer
export const clanAction = clanSlice.actions;

export default clanSlice;
