import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./authSlice";
import gameSlice from "./gameSlice";
import TournamentSlice from "./tournamentSlice";
import loadingSlice from "./loadingSlice";
import { persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { combineReducers } from "@reduxjs/toolkit";
import clanSlice from "./clanSlice";
import toastSlice from "./toastSlice";
import paymentSlice from "./paymentSlice";
import notificationSlice from "./notificationSlice";
import adminSlice from "./adminSlice";

const persistConfig = {
  key: "root",
  version: 1,
  storage,
  whitelist: ["auth"],
};

const reducer = combineReducers({
  admin: adminSlice.reducer,
  auth: authSlice.reducer,
  games: gameSlice.reducer,
  tournament: TournamentSlice.reducer,
  loading: loadingSlice.reducer,
  payment: paymentSlice.reducer,
  clan: clanSlice.reducer,
  toast: toastSlice.reducer,
  notifications: notificationSlice.reducer,
});

const persistedReducer = persistReducer(persistConfig, reducer);

const platformStore = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

export default platformStore;
