import { createSlice } from "@reduxjs/toolkit";

const toastSlice = createSlice({
  name: "toast",
  initialState: {
    visible: false,
    message: "",
    type: "success", // success, error, info, etc.
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
