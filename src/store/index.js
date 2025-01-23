import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./authSlice";
import gameSlice from "./gameSlice";
import TournamentSlice from "./tournamentSlice";
import loadingSlice from "./loadingSlice";
import { persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { combineReducers } from "@reduxjs/toolkit";
import transactionSlice from "./transactionSlice";
import clanSlice from "./clanSlice";
import toastSlice from "./toastSlice";

const persistConfig = {
  key: "root",
  version: 1,
  storage,
  whitelist: ["auth"],
};

const reducer = combineReducers({
  auth: authSlice.reducer,
  games: gameSlice.reducer,
  tournament: TournamentSlice.reducer,
  loading: loadingSlice.reducer,
  transactions: transactionSlice.reducer,
  clan: clanSlice.reducer,
  toast: toastSlice.reducer,
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
