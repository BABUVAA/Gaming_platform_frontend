import { getStoredErrorMessage } from "../../api/apiError.js";
import { isStaffUtilitySummary } from "../../utils/staffUtilityMode.js";

// Player selectors isolate consumers from the `state.player` storage shape.
// Authentication selectors intentionally expose no profile-domain data.
export const selectPlayerState = (state) => state.player;
export const selectPlayerSummary = (state) => state.player.summary;
export const selectPlayerSummaryStatus = (state) =>
  state.player.summaryStatus;
export const selectPlayerProfile = (state) => state.player.profile;
export const selectPlayerProfileStatus = (state) =>
  state.player.profileStatus;
export const selectPublicPlayerProfile = (state) =>
  state.player.publicProfile;
export const selectPublicPlayerProfileStatus = (state) =>
  state.player.publicProfileStatus;
export const selectPlayerApiError = (state) => state.player.error;
export const selectPlayerError = (state) =>
  getStoredErrorMessage(selectPlayerApiError(state));
export const selectIsStaffUtilityMode = (state) =>
  isStaffUtilitySummary(selectPlayerSummary(state));
