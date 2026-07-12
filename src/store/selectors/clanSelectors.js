// Clan selectors keep clan screens decoupled from raw slice internals.
export const selectClanState = (state) => state.clan;
export const selectUserClan = (state) => state.clan.userClanData;
export const selectClanSearchResult = (state) => state.clan.searchClanData;
export const selectClanLoading = (state) => state.clan.loading;
export const selectClanError = (state) => state.clan.error;
