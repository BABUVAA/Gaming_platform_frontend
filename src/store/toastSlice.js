import { createSlice } from "@reduxjs/toolkit";

export const types = {
  DEFAULT: "default",
  SUCCESS: "success",
  DANGER: "danger",
  WARNING: "warning",
  SIMPLE: "simple",
  MESSAGE: "message-cta",
  NOTIFICATION: "notification",
  INTERACTIVE: "interactive",
};

const toastSlice = createSlice({
  name: "toast",

  initialState: {
    visible: false,
    toasts: [], // Store multiple toasts as an array
  },
  reducers: {
    showToast: (state, action) => {
      state.visible = true;
      const newToast = {
        id: Date.now(), // Unique identifier
        message: action.payload.message || "message",
        type: action.payload.type || types.SUCCESS,
        position: action.payload.position || "top-right",
      };
      state.toasts.push(newToast); // Add new toast
    },
    hideToast: (state, action) => {
      state.toasts = state.toasts.filter(
        (toast) => toast.id !== action.payload
      );
    },
  },
});

export const { showToast, hideToast } = toastSlice.actions;
export default toastSlice;
