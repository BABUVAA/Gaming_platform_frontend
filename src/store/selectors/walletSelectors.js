// Wallet selectors provide one stable read layer for payment-related UI.
export const selectPaymentState = (state) => state.payment;
export const selectWallet = (state) => state.payment.wallet;
export const selectWalletTransactions = (state) => state.payment.transactions;
export const selectPaymentLoading = (state) => state.payment.isLoading;
export const selectPaymentError = (state) => state.payment.error;
