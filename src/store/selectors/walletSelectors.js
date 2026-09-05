import { getStoredErrorMessage } from "../../api/apiError";

// Wallet selectors provide one stable read layer for payment-related UI.
// If wallet data shape changes later, updating these selectors is safer than
// fixing deep state access across every payment-related component.
export const selectWallet = (state) => state.payment.wallet;
export const selectPaymentCapabilities = (state) => state.payment.capabilities;
const selectWalletLedger = (state) => state.payment.ledger;
export const selectWalletLedgerEntries = (state) =>
  selectWalletLedger(state).entries;
export const selectWalletLedgerPage = (state) =>
  selectWalletLedger(state).page;
export const selectWalletLedgerLoading = (state) =>
  selectWalletLedger(state).isLoading;
export const selectWalletLedgerLoadingMore = (state) =>
  selectWalletLedger(state).isLoadingMore;
const selectWalletLedgerApiError = (state) =>
  selectWalletLedger(state).error;
export const selectWalletLedgerError = (state) =>
  getStoredErrorMessage(selectWalletLedgerApiError(state));
export const selectPaymentLoading = (state) => state.payment.isLoading;
