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
