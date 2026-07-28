// This helper centralizes store middleware configuration.
// Keeping it separate makes the store bootstrap file easier to scan and gives
// us one place to grow middleware rules later.
//
// If we add custom middleware in the future, extend this helper instead of
// inflating `store/index.js`, so store creation remains easy to read.
const createStoreMiddleware = (getDefaultMiddleware) =>
  getDefaultMiddleware({
    serializableCheck: {
      // redux-persist dispatches internal non-serializable actions during
      // rehydration, so we explicitly ignore them here.
      // Add more ignored actions here only when a library genuinely requires it.
      ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
    },
  }).prepend(sessionLifecycleMiddleware.middleware);

export default createStoreMiddleware;
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
} from "redux-persist";
import sessionLifecycleMiddleware from "./middleware/sessionLifecycleMiddleware";
