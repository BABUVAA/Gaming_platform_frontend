import { createSelector } from "@reduxjs/toolkit";
import { getStoredErrorMessage } from "../../api/apiError.js";

const selectQuickMatchOfferingState = (state) => state.quickMatchOfferings;

export const selectPlayerQuickMatchOfferings = createSelector(
  [selectQuickMatchOfferingState],
  (state) => state.playerOfferings,
);

export const selectPlayerQuickMatchStatus = (state) =>
  state.quickMatchOfferings.playerStatus;

export const selectPlayerQuickMatchError = (state) =>
  getStoredErrorMessage(state.quickMatchOfferings.playerError);

export const selectPlayerQuickMatchDetail = (state, offeringId) =>
  state.quickMatchOfferings.playerDetails[offeringId] || null;

export const selectPlayerQuickMatchDetailStatus = (state, offeringId) =>
  state.quickMatchOfferings.playerDetailStatusById[offeringId] || "idle";

export const selectPlayerQuickMatchDetailError = (state, offeringId) =>
  getStoredErrorMessage(
    state.quickMatchOfferings.playerDetailErrorsById[offeringId],
  );

export const selectPlayerQuickMatchLeaderboard = (state, offeringId) =>
  state.quickMatchOfferings.playerLeaderboards[offeringId] || null;

export const selectPlayerQuickMatchLeaderboardStatus = (state, offeringId) =>
  state.quickMatchOfferings.playerLeaderboardStatusById[offeringId] || "idle";

export const selectPlayerQuickMatchLeaderboardError = (state, offeringId) =>
  getStoredErrorMessage(state.quickMatchOfferings.playerLeaderboardErrorsById[offeringId]);
