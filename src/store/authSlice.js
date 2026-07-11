import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios-api";
import { showToast, types } from "./toastSlice";

const getApiErrorMessage = (error, fallback) =>
  error.response?.data?.message ||
  error.response?.data?.error ||
  Object.values(error.response?.data?.errors || {}).find(Boolean) ||
  fallback;

// Async thunk for session verification
export const verifySession = createAsyncThunk(
  "auth/verifySession",
  async (_, thunkAPI) => {
    try {
      // Keep the request body empty and pass axios config in the correct slot.
      const response = await api.post(
        "/api/auth/verifySession",
        {},
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      const statusCode = error.response?.status;
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Unable to verify the current session.";

      if (statusCode && statusCode !== 401) {
        thunkAPI.dispatch(
          showToast({
            message,
            type: types.DANGER,
            position: "bottom-right",
          })
        );
      }

      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Async thunk for logout
export const logout = createAsyncThunk("auth/logout", async (_, thunkAPI) => {
  try {
    const response = await api.post(
      "/api/auth/logout",
      {},
      { withCredentials: true }
    );
      thunkAPI.dispatch(
        showToast({
          message: response.data.message,
          type: types.SUCCESS,
          position: "bottom-right",
        })
      );
    return response.data;
  } catch (error) {
    const message = getApiErrorMessage(error, "Unable to logout.");
    thunkAPI.dispatch(
      showToast({
        message,
        type: types.DANGER,
        position: "bottom-right",
      })
    );
    return thunkAPI.rejectWithValue(error.response?.data || error.message);
  }
});

// Async thunk for user login
export const login = createAsyncThunk(
  "auth/login",
  async (credentials, thunkAPI) => {
    try {
      const response = await api.post("/api/auth/login", credentials, {
        withCredentials: true,
      });
      thunkAPI.dispatch(
        showToast({
          message: response.data.message,
          type: types.SUCCESS,
          position: "bottom-right",
        })
      );
      return response.data;
    } catch (error) {
      const message = getApiErrorMessage(error, "Login failed.");
      thunkAPI.dispatch(
        showToast({
          message,
          type: types.DANGER,
          position: "bottom-right",
        })
      );
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Async thunk for user registration
export const register = createAsyncThunk(
  "auth/signup",
  async (userData, thunkAPI) => {
    try {
      const response = await api.post("/api/auth/signup", userData);
      thunkAPI.dispatch(
        showToast({
          message:
            response.data.message ||
            response.data.errors.username ||
            response.data.errors.email ||
            response.data.errors.password ||
            response.data.errors.dob,
          type: types.SUCCESS,
          position: "bottom-right",
        })
      );
      return response.data;
    } catch (error) {
      const message = getApiErrorMessage(error, "Signup failed.");
      thunkAPI.dispatch(
        showToast({
          message,
          type: types.DANGER,
          position: "bottom-right",
        })
      );
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Async thunk for user Profile
export const user_profile = createAsyncThunk(
  "users/profile",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/api/users/profile");
      return response.data;
    } catch (error) {
      thunkAPI.dispatch(
        showToast({
          message:
            error.response?.data?.error || "Unable to load player profile.",
          type: types.DANGER,
          position: "bottom-right",
        })
      );
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

//Async thunk to Search Clan
export const searchPlayer = createAsyncThunk(
  "users/searchPlayer", // action type
  async (playerTag, thunkAPI) => {
    try {
      const response = await api.post("/api/users/searchPlayer", playerTag);
      if (!response) {
        throw new Error("Failed to fetch player data");
      }
      return response.data; // return data to be used in the reducer
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Async thunk for updating profile data
export const profile_file_update = createAsyncThunk(
  "users/profile_file_update",
  async (data, thunkAPI) => {
    try {
      // Send POST request with form data
      const response = await api.post("/api/users/profile_file_update", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Show success toast notification
      thunkAPI.dispatch(
        showToast({
          message: "Profile Updated",
          type: types.SUCCESS,
          position: "bottom-right",
        })
      );

      return response.data;
    } catch (error) {
      // Show error toast notification
      thunkAPI.dispatch(
        showToast({
          message: error.response?.data?.error || "Failed to update profile",
          type: types.DANGER,
          position: "bottom-right",
        })
      );

      // Reject action with error message
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Async thunk for updating profile data
export const profile_data_update = createAsyncThunk(
  "users/profile_data_update",
  async (data, thunkAPI) => {
    try {
      // Send POST request with form data
      const response = await api.post("/api/users/profile_data_update", data);

      // Show success toast notification
      thunkAPI.dispatch(
        showToast({
          message: "Profile Updated",
          type: types.SUCCESS,
          position: "bottom-right",
        })
      );

      return response.data;
    } catch (error) {
      // Show error toast notification
      thunkAPI.dispatch(
        showToast({
          message: error.response?.data?.error || "Failed to update profile",
          type: types.DANGER,
          position: "bottom-right",
        })
      );

      // Reject action with error message
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    isAuthenticated: false,
    profile: null,
    profileStatus: "idle",
    error: null,
  },
  reducers: {
    setAuthenticated: (state, action) => {
      state.isAuthenticated = action.payload;
    },
    resetError: (state) => {
      state.error = null;
    },
    addJoinedTournament: (state, action) => {
      const newTournament = action.payload;

      // Live socket events can arrive before the profile bootstrap finishes.
      // Bail out safely instead of trying to write through a null profile object.
      if (!state.profile?.profile) {
        return;
      }

      // Ensure tournaments array exists before we insert/update the record.
      if (!state.profile.profile.tournaments) {
        state.profile.profile.tournaments = [];
      }

      // Find index of existing tournament by _id
      const index = state.profile.profile.tournaments.findIndex(
        (t) => t._id === newTournament._id
      );

      if (index === -1) {
        // Tournament not found, add new
        state.profile.profile.tournaments.push(newTournament);
      } else {
        // Tournament exists, update it
        state.profile.profile.tournaments[index] = {
          ...state.profile.profile.tournaments[index],
          ...newTournament,
        };
      }
    },
    upsertActiveChat: (state, action) => {
      if (!state.profile) return;

      if (!Array.isArray(state.profile.activeChats)) {
        state.profile.activeChats = [];
      }

      const incomingChat = action.payload;
      if (!incomingChat?.userId) return;

      const existingIndex = state.profile.activeChats.findIndex(
        (chat) =>
          chat?.userId === incomingChat.userId ||
          chat?._id === incomingChat.userId ||
          chat?.id === incomingChat.userId
      );

      if (existingIndex === -1) {
        state.profile.activeChats.unshift(incomingChat);
      } else {
        state.profile.activeChats[existingIndex] = {
          ...state.profile.activeChats[existingIndex],
          ...incomingChat,
        };
      }
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(verifySession.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(verifySession.rejected, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
        state.user = null;
        state.profile = null;
        state.profileStatus = "idle";
        state.error = action.payload;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.profile = null;
        state.profileStatus = "idle";
      })
      .addCase(logout.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.profile = null;
        state.profileStatus = "idle";
        state.error = "";
      })
      .addCase(login.rejected, (state, action) => {
        state.error = action.payload;
      })

      .addCase(register.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.profile = null;
        state.profileStatus = "idle";
      })
      .addCase(register.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(user_profile.pending, (state) => {
        // We track profile bootstrap separately so route guards can tell the
        // difference between "still loading" and "failed, show recovery UI".
        state.profileStatus = "loading";
        state.error = null;
      })
      .addCase(user_profile.fulfilled, (state, action) => {
        state.profile = action.payload;
        state.profileStatus = "succeeded";
      })
      .addCase(user_profile.rejected, (state, action) => {
        state.profileStatus = "failed";
        state.error = action.payload;
      });
  },
});

export const authAction = authSlice.actions;
export default authSlice;
