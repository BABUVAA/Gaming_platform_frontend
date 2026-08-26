import { createSlice } from "@reduxjs/toolkit";

const sensitiveActionSlice = createSlice({
  name: "sensitiveAction",
  initialState: { isOpen: false },
  reducers: {
    openSensitiveActionDialog: (state) => {
      state.isOpen = true;
    },
    closeSensitiveActionDialog: (state) => {
      state.isOpen = false;
    },
  },
});

const pendingConfirmations = new Set();

export const requestSensitiveActionConfirmation = (dispatch, signal) => {
  if (signal?.aborted) return Promise.resolve(false);

  dispatch(sensitiveActionSlice.actions.openSensitiveActionDialog());

  return new Promise((resolve) => {
    const pending = { resolve };
    pendingConfirmations.add(pending);

    if (!signal) return;

    const handleAbort = () => {
      pendingConfirmations.delete(pending);
      resolve(false);
      if (pendingConfirmations.size === 0) {
        dispatch(sensitiveActionSlice.actions.closeSensitiveActionDialog());
      }
    };

    pending.handleAbort = handleAbort;
    pending.signal = signal;
    signal.addEventListener("abort", handleAbort, { once: true });
  });
};

export const settleSensitiveActionConfirmation = (dispatch, confirmed) => {
  pendingConfirmations.forEach((pending) => {
    pending.signal?.removeEventListener("abort", pending.handleAbort);
    pending.resolve(confirmed);
  });
  pendingConfirmations.clear();
  dispatch(sensitiveActionSlice.actions.closeSensitiveActionDialog());
};

export const selectSensitiveActionDialogOpen = (state) =>
  state.sensitiveAction.isOpen;

export default sensitiveActionSlice;
