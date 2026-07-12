import { configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import createStoreMiddleware from "./middleware";
import persistConfig from "./persistConfig";
import rootReducer from "./rootReducer";

// redux-persist wraps the root reducert so selected slices can survive refreshes.
const persistedReducer = persistReducer(persistConfig, rootReducer);

// This creates the Redux Toolkit store used by the entire application.
// We pass the persisted reducer and the centralized middleware setup so
// store initialization stays readable and consistent.
const platformStore = configureStore({
  reducer: persistedReducer,
  middleware: createStoreMiddleware,
});

// The persistor is exported alongside the store so app bootstrap can treat
// persistence as state infrastructure instead of rebuilding it in provider code.
export const persistor = persistStore(platformStore);
export default platformStore;
