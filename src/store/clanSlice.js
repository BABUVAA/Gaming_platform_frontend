import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios-api"; // Ensure you have the correct axios instance
import { logout } from "./authSlice";

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

// Async thunk to fetch clan data
export const fetchUserClan = createAsyncThunk(
  "clan/fetchUserClan", // action type
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/api/clan/fetchClan");
      if (!response) {
        throw new Error("Failed to fetch clan data");
      }
      return response.data; // return data to be used in the reducer
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message); // return error message in case of failure
    }
  }
);

// Slice for game data
const clanSlice = createSlice({
  name: "clan",
  initialState: {
    createClanData: {},
    userClanData: null,
    searchClanData: {},
    loading: false, // Tracks loading state
    error: null, // Tracks any error
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createClan.fulfilled, (state, action) => {
        state.createClanData = "clan created";
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
      })
      .addCase(logout.fulfilled, (state, action) => {
        state.userClanData = {};
        state.searchClanData = {};
        state.createClanData = {};
        state.error = "";
      });
  },
});

// Exporting actions and reducer
export const clanAction = clanSlice.actions;

export default clanSlice;
