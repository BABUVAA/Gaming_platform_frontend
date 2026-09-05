import { getStoredErrorMessage } from "../../api/apiError.js";

const selectPrizeReleaseReview = (state) => state.prizeReleaseReview;
export const selectPrizeReleaseItems = (state) =>
  selectPrizeReleaseReview(state).items;
export const selectPrizeReleasePage = (state) =>
  selectPrizeReleaseReview(state).page;
export const selectPrizeReleaseQueueStatus = (state) =>
  selectPrizeReleaseReview(state).queueStatus;
export const selectPrizeReleaseQueueError = (state) =>
  getStoredErrorMessage(selectPrizeReleaseReview(state).queueError);
export const selectPrizeReleaseRequests = (state) =>
  selectPrizeReleaseReview(state).releaseRequests;
