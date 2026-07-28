import { createAction } from "@reduxjs/toolkit";

// One action gives reducers, middleware, and future services a common signal
// that all browser-held private state must be discarded immediately.
export const sessionInvalidated = createAction("session/invalidated");
