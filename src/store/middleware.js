// This helper centralizes store middleware configuration.
// Keeping it separate makes the store bootstrap file easier to scan and gives
// us one place to grow middleware rules later.
const createStoreMiddleware = (getDefaultMiddleware) =>
  getDefaultMiddleware({
    serializableCheck: {
      // redux-persist dispatches internal non-serializable actions during
      // rehydration, so we explicitly ignore them here.
      ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
    },
  });

export default createStoreMiddleware;
