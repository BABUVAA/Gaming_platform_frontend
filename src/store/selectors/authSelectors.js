// Auth selectors keep component code from reaching deep into raw state shape.
export const selectAuthState = (state) => state.auth;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthProfile = (state) => state.auth.profile;
export const selectAuthProfileStatus = (state) => state.auth.profileStatus;
export const selectAuthError = (state) => state.auth.error;
