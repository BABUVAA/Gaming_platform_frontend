import { getStoredErrorMessage } from "../../api/apiError";

// Auth selectors keep component code from reaching deep into raw state shape.
// Add new auth reads here first so feature code can stay stable even if the
// auth slice shape changes later.
export const selectAuthUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsVerified = (state) =>
  state.auth.user?.isVerified === true;
export const selectSessionStatus = (state) => state.auth.sessionStatus;
const selectAuthApiError = (state) => state.auth.error;
export const selectAuthError = (state) =>
  getStoredErrorMessage(selectAuthApiError(state));
