// Tournament selectors centralize reads from the tournament slice.
export const selectTournamentState = (state) => state.tournament;
export const selectTournamentMap = (state) => state.tournament.tournaments;
export const selectTournamentDetails = (state) => state.tournament.tournamentId;
export const selectTournamentError = (state) => state.tournament.error;
