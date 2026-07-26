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
    toasts: [],
  },
  reducers: {
    showToast: (state, action) => {
      state.visible = true;
      const newToast = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        title: action.payload.title || "",
        message: action.payload.message || "Something went wrong.",
        type: action.payload.type || types.SUCCESS,
        position: action.payload.position || "top-right",
        duration: action.payload.duration || 5000,
        createdAt: Date.now(),
      };
      state.toasts.push(newToast);
    },
    hideToast: (state, action) => {
      state.toasts = state.toasts.filter(
        (toast) => toast.id !== action.payload
      );
      state.visible = state.toasts.length > 0;
    },
  },
});

export const { showToast, hideToast } = toastSlice.actions;
export default toastSlice;
