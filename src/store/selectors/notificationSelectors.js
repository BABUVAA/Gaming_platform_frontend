// Notification selectors expose the notification slice through a stable read API.
// If notification state grows later, this file should stay the main read
// boundary instead of spreading raw state access across menus and toasts.
export const selectNotificationState = (state) => state.notifications;
export const selectNotifications = (state) => state.notifications.items;
export const selectNotificationLoading = (state) => state.notifications.loading;
export const selectNotificationApiError = (state) =>
  state.notifications.error;
export const selectNotificationError = (state) =>
  getStoredErrorMessage(selectNotificationApiError(state));
import { getStoredErrorMessage } from "../../api/apiError";
