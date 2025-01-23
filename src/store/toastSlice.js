import { createSlice } from "@reduxjs/toolkit";

export const types = {
  DEAFAULT: "default",
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
    message: "",
    type: types.DEAFAULT, // success, error, info, etc.
    position: "top-right", // top-left, top-right, bottom-left, bottom-right
  },
  reducers: {
    // Action to show the toast
    showToast: (state, action) => {
      state.visible = true;
      state.message = action.payload.message || "message";
      state.type = action.payload.type || "success";
      state.position = action.payload.position || "top-right";
    },
    // Action to hide the toast
    hideToast: (state) => {
      state.visible = false;
    },
  },
});

export const { showToast, hideToast } = toastSlice.actions;
export default toastSlice;
