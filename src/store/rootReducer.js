import { combineReducers } from "@reduxjs/toolkit";
import adminSlice from "./adminSlice";
import authSlice from "./authSlice";
import clanSlice from "./clanSlice";
import gameSlice from "./gameSlice";
import loadingSlice from "./loadingSlice";
import notificationSlice from "./notificationSlice";
import paymentSlice from "./paymentSlice";
import toastSlice from "./toastSlice";
import tournamentSlice from "./tournamentSlice";

// The root reducer is separated from store creation so reducer composition
// stays readable and can grow independently from middleware/persistence setup.
// Each key here becomes a top-level branch in the global Redux state tree.
const rootReducer = combineReducers({
  admin: adminSlice.reducer,
  auth: authSlice.reducer,
  games: gameSlice.reducer,
  tournament: tournamentSlice.reducer,
  loading: loadingSlice.reducer,
  payment: paymentSlice.reducer,
  clan: clanSlice.reducer,
  toast: toastSlice.reducer,
  notifications: notificationSlice.reducer,
});

export default rootReducer;
