import { getStoredErrorMessage } from "../../api/apiError.js";

const selectWithdrawalReview = (state) => state.withdrawalReview;
export const selectWithdrawalReviewItems = (state) =>
  selectWithdrawalReview(state).items;
export const selectWithdrawalReviewPage = (state) =>
  selectWithdrawalReview(state).page;
export const selectWithdrawalReviewStatus = (state) =>
  selectWithdrawalReview(state).queueStatus;
export const selectWithdrawalReviewError = (state) =>
  getStoredErrorMessage(selectWithdrawalReview(state).queueError);
export const selectWithdrawalReviewRequests = (state) =>
  selectWithdrawalReview(state).actionRequests;
