import { combineReducers } from "@reduxjs/toolkit";
import adminSlice from "./slices/adminSlice";
import authSlice from "./slices/authSlice";
import clanSlice from "./slices/clanSlice";
import gameSlice from "./slices/gameSlice";
import loadingSlice from "./slices/loadingSlice";
import notificationSlice from "./slices/notificationSlice";
import paymentSlice from "./slices/paymentSlice";
import toastSlice from "./slices/toastSlice";
import tournamentSlice from "./slices/tournamentSlice";

// The root reducer is separated from store creation so reducer composition
// stays readable and can grow independently from middleware/persistence setup.
// Each key here becomes a top-level branch in the global Redux state tree.
//
// When new slices are added later, register them here first so the global
// state shape stays explicit and easy to discover from one file.
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
