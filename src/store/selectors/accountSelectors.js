import { getStoredErrorMessage } from "../../api/apiError";

// Named selectors keep Account Settings independent from the Redux branch
// shape and give later account features one consistent read boundary.
export const selectAccount = (state) => state.account.data;
export const selectAccountStatus = (state) => state.account.status;
export const selectAccountApiError = (state) => state.account.error;
export const selectAccountError = (state) =>
  getStoredErrorMessage(selectAccountApiError(state));
