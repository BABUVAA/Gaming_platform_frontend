import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { showToast, types } from "./toastSlice";
import api from "../../api/axios-api";
import { getApiErrorMessage, rejectApiError } from "../../api/apiError";
import addThunkLifecycleMatchers from "../reducers/addThunkLifecycleMatchers";

const initialState = {
  items: [],
  loading: false,
  loadingMore: false,
  hasMore: false,
  nextCursor: null,
  error: null,
};

const getNotificationSignature = (notification = {}) =>
  notification?._id ||
  [
    notification?.title || "",
    notification?.message || "",
    String(notification?.createdAt || ""),
  ].join("::");

const dedupeNotifications = (notifications = []) => {
  const seenSignatures = new Set();

  return notifications.filter((notification) => {
    const signature = getNotificationSignature(notification);
    if (seenSignatures.has(signature)) return false;
    seenSignatures.add(signature);
    return true;
  });
};

// ✅ Fetch user notifications
export const fetchNotifications = createAsyncThunk(
  "notifications/fetch",
  async ({ cursor = null } = {}, thunkAPI) => {
    try {
      const response = await api.get("/api/notifications", {
        withCredentials: true,
        params: { limit: 25, ...(cursor ? { cursor } : {}) },
      });
      const data = response.data?.data || {};
      return { items: Array.isArray(data.items) ? data.items : [], page: data.page || {}, cursor };
    } catch (error) {
      thunkAPI.dispatch(
        showToast({
          message: getApiErrorMessage(
            error,
            "Failed to fetch notifications",
          ),
          type: types.DANGER,
          position: "bottom-right",
        })
      );
      return rejectApiError(
        thunkAPI,
        error,
        "Failed to fetch notifications",
      );
    }
  },
  {
    condition: ({ cursor = null } = {}, { getState }) => {
      // Dashboard effects may mount twice in development Strict Mode. Refuse
      // only an overlapping fetch while allowing later manual refreshes.
      const state = getState().notifications;
      return cursor ? state.loadingMore !== true : state.loading !== true;
    },
  },
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
          message: getApiErrorMessage(
            error,
            "Failed to update notification",
          ),
          type: types.DANGER,
          position: "bottom-right",
        })
      );
      return rejectApiError(
        thunkAPI,
        error,
        "Failed to update notification",
      );
    }
  }
);

// ✅ Slice
// Both requests report errors through the same slice field. Only the feed
// request controls `loading`, so marking one item never hides the open list.
const notificationThunks = [
  fetchNotifications,
  markNotificationAsRead,
];

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification: (state, action) => {
      const notification = action.payload;
      if (!notification || typeof notification !== "object") return;

      const existingIndex = state.items.findIndex(
        (item) =>
          getNotificationSignature(item) ===
          getNotificationSignature(notification)
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
      .addCase(fetchNotifications.pending, (state, action) => {
        if (action.meta.arg?.cursor) state.loadingMore = true;
        else state.loading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        const { items, page, cursor } = action.payload;
        state.items = dedupeNotifications(cursor ? [...state.items, ...items] : items);
        state.hasMore = page.hasMore === true;
        state.nextCursor = page.nextCursor || null;
      })
      .addCase(fetchNotifications.rejected, (state) => {
        state.loading = false;
        state.loadingMore = false;
      })

      // Mark as read
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        if (!action.payload?._id) return;

        const index = state.items.findIndex(
          (n) => n._id === action.payload._id
        );
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      });

    addThunkLifecycleMatchers(builder, notificationThunks, {
      pending: (state) => {
        state.error = null;
      },
      rejected: (state, action) => {
        // Closing or replacing the header can abort work intentionally.
        if (!action.meta.aborted && !action.meta.condition) {
          state.error = action.payload;
        }
      },
    });
  },
});

export const notificationActions = notificationSlice.actions;
export default notificationSlice;
