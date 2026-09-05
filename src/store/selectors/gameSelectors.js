import { getStoredErrorMessage } from "../../api/apiError";

// Game selectors keep components independent from the persisted slice shape.
// New game screens should read through these helpers instead of `state.games`.
export const selectGames = (state) => state.games.data;
export const selectGamesStatus = (state) => state.games.status;
const selectGamesApiError = (state) => state.games.error;
export const selectGamesError = (state) =>
  getStoredErrorMessage(selectGamesApiError(state));
