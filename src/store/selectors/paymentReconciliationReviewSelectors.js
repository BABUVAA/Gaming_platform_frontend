import { getStoredErrorMessage } from "../../api/apiError.js";

const selectState = (state) => state.paymentReconciliationReview;
export const selectPaymentReconciliationItems = (state) => selectState(state).items;
export const selectPaymentReconciliationPage = (state) => selectState(state).page;
export const selectPaymentReconciliationStatus = (state) => selectState(state).status;
export const selectPaymentReconciliationRequests = (state) => selectState(state).requests;
export const selectPaymentReconciliationError = (state) =>
  getStoredErrorMessage(selectState(state).error);
