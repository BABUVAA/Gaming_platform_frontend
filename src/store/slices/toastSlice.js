import { createSlice } from "@reduxjs/toolkit";

export const types = Object.freeze({
  DEFAULT: "default",
  SUCCESS: "success",
  DANGER: "danger",
  WARNING: "warning",
  SIMPLE: "simple",
  MESSAGE: "message-cta",
  NOTIFICATION: "notification",
  INTERACTIVE: "interactive",
});

const DEFAULT_TOAST_DURATION = 5000;
const MAX_QUEUED_TOASTS = 5;
let toastSequence = 0;

// Metadata is created while preparing the action, not inside the reducer.
// This keeps reducers deterministic and still guarantees unique local IDs.
const prepareToast = (payload = {}) => {
  const safePayload =
    payload && typeof payload === "object"
      ? payload
      : { message: String(payload || "Something went wrong.") };
  const createdAt = Date.now();
  toastSequence += 1;

  return {
    payload: {
      ...safePayload,
      id: `${createdAt}-${toastSequence}`,
      createdAt,
    },
  };
};

const toastSlice = createSlice({
  name: "toast",

  initialState: {
    visible: false,
    toasts: [],
  },
  reducers: {
    showToast: {
      reducer: (state, action) => {
        const toast = {
          id: action.payload.id,
          title: action.payload.title || "",
          message: action.payload.message || "Something went wrong.",
          type: action.payload.type || types.SUCCESS,
          position: action.payload.position || "top-right",
          duration:
            Number.isFinite(action.payload.duration) &&
            action.payload.duration > 0
              ? action.payload.duration
              : DEFAULT_TOAST_DURATION,
          createdAt: action.payload.createdAt,
        };

        state.toasts.push(toast);
        // Bound the queue so a burst of socket events cannot grow state
        // indefinitely before UI timers have a chance to dismiss entries.
        if (state.toasts.length > MAX_QUEUED_TOASTS) {
          state.toasts.splice(0, state.toasts.length - MAX_QUEUED_TOASTS);
        }
        state.visible = state.toasts.length > 0;
      },
      prepare: prepareToast,
    },
    hideToast: (state, action) => {
      state.toasts = state.toasts.filter(
        (toast) => toast.id !== action.payload,
      );
      state.visible = state.toasts.length > 0;
    },
  },
});

export const { showToast, hideToast } = toastSlice.actions;
export default toastSlice;
