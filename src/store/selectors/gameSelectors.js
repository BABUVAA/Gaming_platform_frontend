// Game selectors keep components independent from the persisted slice shape.
// New game screens should read through these helpers instead of `state.games`.
export const selectGamesState = (state) => state.games;
export const selectGames = (state) => state.games.data;
export const selectGamesStatus = (state) => state.games.status;
export const selectGamesApiError = (state) => state.games.error;
export const selectGamesError = (state) =>
  getStoredErrorMessage(selectGamesApiError(state));
export const selectGamesLastFetchedAt = (state) =>
  state.games.lastFetchedAt;
import { getStoredErrorMessage } from "../../api/apiError";
