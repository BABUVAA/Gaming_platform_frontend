import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios-api"; // Ensure you have the correct axios instance
import { logout } from "./authSlice";
import { showToast, types } from "./toastSlice";

// Async thunk to fetch all games from the server
export const createClan = createAsyncThunk(
  "/auth/clan/create",
  async (clanData, thunkAPI) => {
    try {
      const response = await api.post("/api/clan/createClan", clanData);
      thunkAPI.dispatch(
        showToast({
          message: response.data.message,
          type: types.SUCCESS,
          position: "bottom-right",
        })
      );
      return response.data;
    } catch (error) {
      thunkAPI.dispatch(
        showToast({
          message: error.response.data.message,
          type: types.SUCCESS,
          position: "bottom-right",
        })
      );
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
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

//Async thunk to Search Clan
export const searchClan = createAsyncThunk(
  "clan/searchClan", // action type
  async (clanTag, thunkAPI) => {
    try {
      const response = await api.post("/api/clan/searchClan", clanTag);
      if (!response) {
        throw new Error("Failed to fetch clan data");
      }
      return response.data; // return data to be used in the reducer
    } catch (error) {
      return response.data; // return error message in case of failure
    }
  }
);

//Async thunk to Join Clan
export const joinClan = createAsyncThunk(
  "clan/joinClan", //action type a
  async (clanTag, thunkAPI) => {
    try {
      const response = await api.post("/api/clan/joinClan", clanTag);

      thunkAPI.dispatch(
        showToast({
          message: response.data.message,
          type: types.SUCCESS,
          position: "bottom-right",
        })
      );
      return response.data; // return data to be used in the reducer
    } catch (error) {
      thunkAPI.dispatch(
        showToast({
          message: error.response.data.message,
          type: types.SUCCESS,
          position: "bottom-right",
        })
      );
      return thunkAPI.rejectWithValue(error.message); // return error message in case of failure
    }
  }
);

//Async thunk to Leave Clan
export const leaveClan = createAsyncThunk(
  "clan/leaveClan", //action type a
  async (_, thunkAPI) => {
    try {
      const response = await api.post("/api/clan/leaveClan");
      if (!response) {
        throw new Error("Failed to fetch clan data");
      }
      return response.data; // return data to be used in the reducer
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message); // return error message in case of failure
    }
  }
);

// Async thunk for updating profile data
export const clan_data_update = createAsyncThunk(
  "clan/clan_data_update",
  async (data, thunkAPI) => {
    try {
      // Send POST request with form data
      const response = await api.post("/api/clan/clan_data_update", data);

      // Show success toast notification
      thunkAPI.dispatch(
        showToast({
          message: "Clan Data Updated",
          type: types.SUCCESS,
          position: "bottom-right",
        })
      );

      return response.data;
    } catch (error) {
      // Show error toast notification
      thunkAPI.dispatch(
        showToast({
          message: error.response?.data?.error || "Failed to update Clan Data",
          type: types.DANGER,
          position: "bottom-right",
        })
      );

      // Reject action with error message
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);
// Slice for game data
const clanSlice = createSlice({
  name: "clan",
  initialState: {
    createClanData: null,
    userClanData: null,
    searchClanData: null,
    loading: false, // Tracks loading state
    error: null, // Tracks any error
  },
  reducers: {
    setSearchClanData: (state, action) => {
      state.searchClanData = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createClan.fulfilled, (state) => {
        state.createClanData = "clan created";
      })
      .addCase(createClan.pending, (state) => {
        state.createClanData = "Creating Clan....";
      })
      .addCase(createClan.rejected, (state, action) => {
        state.error = action.payload;
        state.createClanData = null;
      })

      .addCase(joinClan.fulfilled, (state, action) => {
        state.userClanData = action.payload.clan;
      })
      .addCase(joinClan.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(leaveClan.fulfilled, (state, action) => {
        state.userClanData = null;
      })
      .addCase(leaveClan.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(fetchUserClan.fulfilled, (state, action) => {
        state.userClanData = action.payload;
      })
      .addCase(fetchUserClan.pending, (state) => {
        state.userClanData = "Fetching Clan....";
      })
      .addCase(fetchUserClan.rejected, (state, action) => {
        state.error = action.payload;
        state.userClanData = null;
      })
      .addCase(searchClan.fulfilled, (state, action) => {
        state.searchClanData = action.payload;
      })
      .addCase(searchClan.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(logout.fulfilled, (state) => {
        state.userClanData = null;
        state.searchClanData = null;
        state.createClanData = null;
        state.error = "";
      });
  },
});

// Exporting actions and reducer
export const clanAction = clanSlice.actions;

export default clanSlice;
