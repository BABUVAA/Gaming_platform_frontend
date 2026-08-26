import { getStoredErrorMessage } from "../../api/apiError.js";

export const selectMatchActivity = (state) => state.matchActivity.activity;
export const selectMatchActivityStatus = (state) =>
  state.matchActivity.activityStatus;
export const selectMatchActivityPages = (state) => ({
  matches: state.matchActivity.matchPage,
  queues: state.matchActivity.queuePage,
});
export const selectMatchActivityMoreStatus = (state) =>
  state.matchActivity.moreStatus;
export const selectMatchActivityError = (state) =>
  getStoredErrorMessage(state.matchActivity.activityError);
export const selectPlayerMatch = (state) => state.matchActivity.selectedMatch;
export const selectPlayerMatchStatus = (state) =>
  state.matchActivity.selectedStatus;
export const selectPlayerMatchError = (state) =>
  getStoredErrorMessage(state.matchActivity.selectedError);
export const selectPlayerMatchActionStatus = (state) =>
  state.matchActivity.actionStatus;
