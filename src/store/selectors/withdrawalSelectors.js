import { getStoredErrorMessage } from "../../api/apiError.js";

export const selectWithdrawals = (state) => state.withdrawals;
export const selectPayoutDestinations = (state) =>
  selectWithdrawals(state).destinations.items;
export const selectWithdrawalAvailability = (state) =>
  selectWithdrawals(state).destinations.availability;
export const selectPayoutDestinationStatus = (state) =>
  selectWithdrawals(state).destinations.status;
export const selectPayoutDestinationError = (state) =>
  getStoredErrorMessage(selectWithdrawals(state).destinations.error);
export const selectWithdrawalHistory = (state) =>
  selectWithdrawals(state).history.items;
export const selectWithdrawalHistoryPage = (state) =>
  selectWithdrawals(state).history.page;
export const selectWithdrawalHistoryStatus = (state) =>
  selectWithdrawals(state).history.status;
export const selectWithdrawalHistoryError = (state) =>
  getStoredErrorMessage(selectWithdrawals(state).history.error);
export const selectWithdrawalRequest = (state) =>
  selectWithdrawals(state).request;
export const selectWithdrawalRequestError = (state) =>
  getStoredErrorMessage(selectWithdrawals(state).request.error);
