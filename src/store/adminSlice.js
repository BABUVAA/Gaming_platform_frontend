import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios-api";
import { showToast, types } from "./toastSlice";

// 🔄 Async thunk to fetch users
export const findUsers = createAsyncThunk(
  "admin/findUsers", // Better naming
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/api/admin/findUsers");

      thunkAPI.dispatch(
        showToast({
          message: "Users fetched successfully",
          type: types.SUCCESS,
          position: "bottom-right",
        })
      );

      return response.data.data;
    } catch (error) {
      thunkAPI.dispatch(
        showToast({
          message: error.response?.data?.message || "Failed to fetch users",
          type: types.ERROR, // ✅ Fix: was SUCCESS
          position: "bottom-right",
        })
      );

      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

const adminSlice = createSlice({
  name: "admin",
  initialState: {
    users: [],
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(findUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(findUsers.fulfilled, (state, action) => {
        state.users = action.payload;
        state.isLoading = false;
      })
      .addCase(findUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Something went wrong";
      });
  },
});

export default adminSlice;
