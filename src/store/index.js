import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./authSlice";
import gameSlice from "./gameSlice";
import TournamentSlice from "./tournamentSlice";
import loadingSlice from "./loadingSlice";

const platformStore = configureStore({
  reducer: {
    auth: authSlice.reducer,
    games: gameSlice.reducer,
    tournament: TournamentSlice.reducer,
    loading: loadingSlice.reducer,
  },
});

export default platformStore;
