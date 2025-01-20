import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios-api";

// Async thunk for session verification
export const verifySession = createAsyncThunk(
  "auth/verifySession",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/auth/verifySession", {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Async thunk for logout
export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "/api/auth/logout",
        {},
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Async thunk for user login
export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/auth/login", credentials, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Async thunk for user registration
export const register = createAsyncThunk(
  "auth/signup",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/auth/signup", userData);
      return response.data;
    } catch (error) {
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
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
// Auth slice
const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    isAuthenticated: null,
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
