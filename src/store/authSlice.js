import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios-api";
import { showToast, types } from "./toastSlice";

// Async thunk for session verification
export const verifySession = createAsyncThunk(
  "auth/verifySession",
  async (_, thunkAPI) => {
    // ✅ Add `thunkAPI` here
    try {
      const response = await api.post("/api/auth/verifySession", {
        withCredentials: true,
      });
      // ✅ Dispatch `showToast` correctly
      thunkAPI.dispatch(
        showToast({
          message: response.data.message || error,
          type: types.SUCCESS,
          position: "bottom-right",
        })
      );
      return response.data;
    } catch (error) {
      thunkAPI.dispatch(
        showToast({
          message: error.response.data.message || error,
          type: types.DANGER,
          position: "bottom-right",
        })
      );
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
        position: "bootom-right",
      })
    );
    return response.data;
  } catch (error) {
    thunkAPI.dispatch(
      showToast({
        message: error.response.data.error,
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
      thunkAPI.dispatch(
        showToast({
          message: error.response.data.error,
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
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/auth/signup", userData);
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
          message: error.response.data.error,
          type: types.DANGER,
          position: "bottom-right",
        })
      );
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Async thunk for user Profile
export const user_profile = createAsyncThunk(
  "users/profile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/users/profile");
      return response.data;
    } catch (error) {
      thunkAPI.dispatch(
        showToast({
          message: error.response.data.error,
          type: types.DANGER,
          position: "bottom-right",
        })
      );
      return rejectWithValue(error.response?.data || error.message);
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
      return response.data; // return error message in case of failure
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
    error: null,
  },
  reducers: {
    setAuthenticated: (state, action) => {
      state.isAuthenticated = action.payload;
    },
    resetError: (state) => {
      state.error = null;
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
        state.error = action.payload;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.profile = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = "";
      })
      .addCase(login.rejected, (state, action) => {
        state.error = action.payload;
      })

      .addCase(register.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(user_profile.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      .addCase(user_profile.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const authAction = authSlice.actions;
export default authSlice;
