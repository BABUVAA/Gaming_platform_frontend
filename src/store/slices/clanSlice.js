import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios-api";
import { getApiErrorMessage, rejectApiError } from "../../api/apiError";
import addThunkLifecycleMatchers from "../reducers/addThunkLifecycleMatchers";
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
      const message = getApiErrorMessage(error, "Unable to create clan.");
      thunkAPI.dispatch(
        showToast({
          message,
          type: types.DANGER,
          position: "bottom-right",
        })
      );
      return rejectApiError(thunkAPI, error, message);
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
      return rejectApiError(thunkAPI, error, "Unable to load your clan.");
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
      const message = getApiErrorMessage(
        error,
        "Unable to find that clan tag.",
      );
      thunkAPI.dispatch(
        showToast({
          message,
          type: types.DANGER,
          position: "bottom-right",
        })
      );
      return rejectApiError(thunkAPI, error, message);
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
      const message = getApiErrorMessage(error, "Unable to join clan.");
      thunkAPI.dispatch(
        showToast({
          message,
          type: types.DANGER,
          position: "bottom-right",
        })
      );
      return rejectApiError(thunkAPI, error, message);
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
      return rejectApiError(thunkAPI, error, "Unable to leave clan.");
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
      const message = getApiErrorMessage(error, "Failed to update clan data");
      thunkAPI.dispatch(
        showToast({
          message,
          type: types.DANGER,
          position: "bottom-right",
        })
      );

      // Reducers and callers receive the same normalized error shown above.
      return rejectApiError(thunkAPI, error, message);
    }
  }
);

// Every clan request writes failures to the same slice-level error field.
// Individual reducers below still own operation-specific data cleanup.
const clanThunks = [
  createClan,
  fetchUserClan,
  searchClan,
  joinClan,
  leaveClan,
  clan_data_update,
];

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
    setSearchClanData: (state) => {
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
      .addCase(createClan.rejected, (state) => {
        state.createClanData = null;
      })

      .addCase(joinClan.fulfilled, (state, action) => {
        state.userClanData = action.payload.clan;
      })
      .addCase(leaveClan.fulfilled, (state) => {
        state.userClanData = null;
      })
      .addCase(fetchUserClan.fulfilled, (state, action) => {
        state.userClanData = action.payload;
        state.loading = false;
      })
      .addCase(fetchUserClan.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserClan.rejected, (state) => {
        state.loading = false;
        state.userClanData = null;
      })
      .addCase(searchClan.fulfilled, (state, action) => {
        state.searchClanData = action.payload;
      })
      .addCase(searchClan.rejected, (state) => {
        state.searchClanData = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.userClanData = null;
        state.searchClanData = null;
        state.createClanData = null;
        state.error = "";
      });

    addThunkLifecycleMatchers(builder, clanThunks, {
      pending: (state) => {
        state.error = null;
      },
      rejected: (state, action) => {
        // Navigation can abort a request after its local UI has closed.
        if (!action.meta.aborted && !action.meta.condition) {
          state.error = action.payload;
        }
      },
    });
  },
});

// Exporting actions and reducer
export const clanAction = clanSlice.actions;

export default clanSlice;
