// Notification selectors expose the notification slice through a stable read API.
export const selectNotificationState = (state) => state.notifications;
export const selectNotifications = (state) => state.notifications.items;
export const selectNotificationLoading = (state) => state.notifications.loading;
export const selectNotificationError = (state) => state.notifications.error;
