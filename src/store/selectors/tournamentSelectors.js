import { createSelector } from "@reduxjs/toolkit";
import { getStoredErrorMessage } from "../../api/apiError";

// Tournament selectors centralize the list/detail split so components do not
// need to understand the persisted state shape.
export const selectTournamentState = (state) => state.tournament;
export const selectTournamentMap = (state) => state.tournament.tournaments;
export const selectTournamentListStatus = (state) =>
  state.tournament.listStatus;
export const selectTournamentListApiError = (state) =>
  state.tournament.listError;
export const selectTournamentListError = (state) =>
  getStoredErrorMessage(selectTournamentListApiError(state));
export const selectTournamentDetails = (state) =>
  state.tournament.selectedTournament;
export const selectTournamentDetailStatus = (state) =>
  state.tournament.detailStatus;
export const selectTournamentDetailApiError = (state) =>
  state.tournament.detailError;
export const selectTournamentDetailError = (state) =>
  getStoredErrorMessage(selectTournamentDetailApiError(state));
export const selectTournamentLastFetchedAt = (state) =>
  state.tournament.lastFetchedAt;

// Object.values creates a new array, so memoization prevents unrelated Redux
// updates from forcing every tournament list component to rerender.
export const selectTournamentList = createSelector(
  [selectTournamentMap],
  (tournaments) => Object.values(tournaments || {}),
);
