// Auth selectors keep component code from reaching deep into raw state shape.
// Add new auth reads here first so feature code can stay stable even if the
// auth slice shape changes later.
export const selectAuthState = (state) => state.auth;
export const selectAuthUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectSessionStatus = (state) => state.auth.sessionStatus;
export const selectAuthProfile = (state) => state.auth.profile;
export const selectAuthProfileStatus = (state) => state.auth.profileStatus;
export const selectAuthApiError = (state) => state.auth.error;
export const selectAuthError = (state) =>
  getStoredErrorMessage(selectAuthApiError(state));
import { getStoredErrorMessage } from "../../api/apiError";
