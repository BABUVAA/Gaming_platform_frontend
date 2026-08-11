import { getStoredErrorMessage } from "../../api/apiError";

// Legacy Tournament selectors are retained only for compatibility/history
// detail URLs. Active competition discovery uses quickMatchOfferingSelectors.
export const selectTournamentState = (state) => state.tournament;
export const selectTournamentDetails = (state) =>
  state.tournament.selectedTournament;
export const selectTournamentDetailStatus = (state) =>
  state.tournament.detailStatus;
export const selectTournamentDetailApiError = (state) =>
  state.tournament.detailError;
export const selectTournamentDetailError = (state) =>
  getStoredErrorMessage(selectTournamentDetailApiError(state));
