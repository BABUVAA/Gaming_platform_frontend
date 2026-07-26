// Wallet selectors provide one stable read layer for payment-related UI.
// If wallet data shape changes later, updating these selectors is safer than
// fixing deep state access across every payment-related component.
export const selectPaymentState = (state) => state.payment;
export const selectWallet = (state) => state.payment.wallet;
export const selectWalletTransactions = (state) => state.payment.transactions;
export const selectPaymentLoading = (state) => state.payment.isLoading;
export const selectPaymentApiError = (state) => state.payment.error;
export const selectPaymentError = (state) =>
  getStoredErrorMessage(selectPaymentApiError(state));
import { getStoredErrorMessage } from "../../api/apiError";
