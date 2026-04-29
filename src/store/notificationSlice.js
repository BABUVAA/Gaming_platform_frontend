import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { showToast, types } from "./toastSlice";
import api from "../api/axios-api";

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const getNotificationSignature = (notification = {}, fallbackIndex = 0) =>
  notification?._id ||
  [
    notification?.title || "",
    notification?.message || "",
    String(notification?.createdAt || ""),
    fallbackIndex,
  ].join("::");

const dedupeNotifications = (notifications = []) => {
  const seenSignatures = new Set();

  return notifications.filter((notification, index) => {
    const signature = getNotificationSignature(notification, index);
    if (seenSignatures.has(signature)) return false;
    seenSignatures.add(signature);
    return true;
  });
};

// ✅ Fetch user notifications
export const fetchNotifications = createAsyncThunk(
  "notifications/fetch",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/api/notifications", {
        withCredentials: true,
      });
      return response.data?.data || response.data || [];
    } catch (error) {
      thunkAPI.dispatch(
        showToast({
          message:
            error?.response?.data?.message || "Failed to fetch notifications",
          type: types.DANGER,
          position: "bottom-right",
        })
      );
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ✅ Mark a notification as read
export const markNotificationAsRead = createAsyncThunk(
  "notifications/markAsRead",
  async (notificationId, thunkAPI) => {
    try {
      const response = await api.patch(
        `/api/notifications/${notificationId}/read`,
        null,
        {
          withCredentials: true,
        }
      );
      return response.data?.data || response.data;
    } catch (error) {
      thunkAPI.dispatch(
        showToast({
          message:
            error?.response?.data?.message || "Failed to update notification",
          type: types.DANGER,
          position: "bottom-right",
        })
      );
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ✅ Slice
const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification: (state, action) => {
      const notification = action.payload;
      const existingIndex = state.items.findIndex(
        (item, index) =>
          getNotificationSignature(item, index) ===
          getNotificationSignature(notification, state.items.length)
      );

      if (existingIndex === -1) {
        state.items = dedupeNotifications([notification, ...state.items]);
        return;
      }

      state.items[existingIndex] = {
        ...state.items[existingIndex],
        ...notification,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = dedupeNotifications(action.payload);
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Mark as read
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (n) => n._id === action.payload._id
        );
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      });
  },
});

export const notificationActions = notificationSlice.actions;
export default notificationSlice;
