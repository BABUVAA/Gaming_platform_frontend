import storage from "redux-persist/lib/storage";

// Persistence is isolated here so the store bootstrap file can stay focused
// on assembling infrastructure instead of owning config details inline.
// Right now only auth is persisted because that is the main user state we want
// to survive refreshes without forcing a fresh login flow every time.
const persistConfig = {
  key: "root",
  version: 1,
  storage,
  whitelist: ["auth"],
};

export default persistConfig;
