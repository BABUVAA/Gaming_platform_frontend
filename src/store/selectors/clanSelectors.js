import { getStoredErrorMessage } from "../../api/apiError";

// Clan selectors keep clan screens decoupled from raw slice internals.
// This is the right place to add future derived clan reads before wiring them
// into large feature pages like the clan and social flows.
export const selectClanState = (state) => state.clan;
export const selectUserClan = (state) => state.clan.userClanData;
export const selectClanSearchResult = (state) => state.clan.searchClanData;
export const selectClanLoading = (state) => state.clan.loading;
export const selectClanApiError = (state) => state.clan.error;
export const selectClanError = (state) =>
  getStoredErrorMessage(selectClanApiError(state));
