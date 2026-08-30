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
  unreadCount: 0,
  lastSyncedAt: null,
  localRevision: 0,
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
      const localRevision = thunkAPI.getState().notifications.localRevision;
      const response = await api.get("/api/notifications", {
        withCredentials: true,
        params: { limit: 25, ...(cursor ? { cursor } : {}) },
      });
      const data = response.data?.data || {};
      return {
        items: Array.isArray(data.items) ? data.items : [],
        page: data.page || {},
        unreadCount: Number(data.unreadCount) || 0,
        syncedAt: new Date().toISOString(),
        localRevision,
        cursor,
      };
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

export const markAllNotificationsAsRead = createAsyncThunk(
  "notifications/markAllAsRead",
  async (_, thunkAPI) => {
    try {
      const response = await api.patch("/api/notifications/read-all", null, {
        withCredentials: true,
      });
      return response.data?.data || response.data;
    } catch (error) {
      thunkAPI.dispatch(showToast({
        message: getApiErrorMessage(error, "Failed to update notifications"),
        type: types.DANGER,
        position: "bottom-right",
      }));
      return rejectApiError(thunkAPI, error, "Failed to update notifications");
    }
  },
);

// ✅ Slice
// Both requests report errors through the same slice field. Only the feed
// request controls `loading`, so marking one item never hides the open list.
const notificationThunks = [
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
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
        if (notification.isRead !== true) state.unreadCount += 1;
        state.localRevision += 1;
        return;
      }

      const wasUnread = state.items[existingIndex].isRead !== true;
      state.items[existingIndex] = {
        ...state.items[existingIndex],
        ...notification,
      };
      const isUnread = state.items[existingIndex].isRead !== true;
      if (wasUnread !== isUnread) {
        state.unreadCount = Math.max(0, state.unreadCount + (isUnread ? 1 : -1));
      }
      state.localRevision += 1;
    },
    applyReadState: (state, action) => {
      const update = action.payload || {};
      if (update.allRead === true) {
        state.items.forEach((item) => {
          item.isRead = true;
          item.readAt = update.readAt || item.readAt;
        });
        state.unreadCount = 0;
        state.localRevision += 1;
        return;
      }
      const item = state.items.find(
        (notification) => notification._id === update.notificationId,
      );
      if (item && item.isRead !== true) {
        item.isRead = true;
        item.readAt = update.readAt || item.readAt;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
        state.localRevision += 1;
      }
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
        const {
          items,
          page,
          unreadCount,
          syncedAt,
          localRevision,
          cursor,
        } = action.payload;
        if (localRevision === state.localRevision) {
          state.items = dedupeNotifications(cursor ? [...state.items, ...items] : items);
          state.unreadCount = unreadCount;
        } else {
          const existing = new Set(state.items.map(getNotificationSignature));
          const unseenUnread = items.filter(
            (item) => !existing.has(getNotificationSignature(item)) && item.isRead !== true,
          ).length;
          state.items = dedupeNotifications([...state.items, ...items]).sort(
            (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
          );
          state.unreadCount += unseenUnread;
        }
        state.lastSyncedAt = syncedAt;
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
          if (state.items[index].isRead !== true && action.payload.isRead === true) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
            state.localRevision += 1;
          }
          state.items[index] = action.payload;
        }
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state, action) => {
        const readAt = action.payload?.readAt || null;
        state.items.forEach((item) => {
          item.isRead = true;
          item.readAt = readAt;
        });
        state.unreadCount = 0;
        state.localRevision += 1;
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
