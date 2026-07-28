import { configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import createStoreMiddleware from "./middleware";
import persistConfig from "./persistConfig";
import rootReducer from "./rootReducer";

// redux-persist wraps the root reducer so selected slices can survive refreshes.
// If persistence rules change later, update `persistConfig.js` instead of
// expanding the bootstrap logic here.
const persistedReducer = persistReducer(persistConfig, rootReducer);

// This creates the Redux Toolkit store used by the entire application.
// We pass the persisted reducer and the centralized middleware setup so
// store initialization stays readable and consistent.
//
// If new middleware is needed later, add it in `middleware.js` so this file
// stays the final assembly layer instead of becoming another config dump.
const platformStore = configureStore({
  reducer: persistedReducer,
  middleware: createStoreMiddleware,
  // Production users should not expose private runtime state through the
  // Redux DevTools extension. Development retains full debugging support.
  devTools: import.meta.env.DEV,
});

// The persistor is exported alongside the store so app bootstrap can treat
// persistence as state infrastructure instead of rebuilding it in provider code.
// If another bootstrap layer ever needs rehydration status, it should import
// the persistor from here rather than calling `persistStore` again.
export const persistor = persistStore(platformStore);
export default platformStore;
