import storage from "redux-persist/lib/storage";
import { createMigrate, createTransform } from "redux-persist";

// Persistence is isolated here so the store bootstrap file can stay focused
// on assembling infrastructure instead of owning config details inline.
// Only public catalogs are persisted. Authentication is deliberately excluded
// because browser storage cannot prove that a server session is still valid.
//
// If we add more slices to `whitelist` later, do it only for state that:
// 1. is safe to store in the browser
// 2. meaningfully improves refresh/reopen UX
// 3. does not represent noisy live data that should always be refetched
//
// Good candidates are usually stable preferences or session-related data.
// Bad candidates are loading flags, transient UI state, or live feeds.
const publicCacheTransform = createTransform(
  (inboundState, key) => {
    // Persist only reusable catalog data and its freshness timestamp. Loading
    // flags and errors are runtime concerns and should reset after a reload.
    if (key === "games") {
      return {
        data: inboundState.data,
        lastFetchedAt: inboundState.lastFetchedAt,
      };
    }

    return {
      tournaments: inboundState.tournaments,
      lastFetchedAt: inboundState.lastFetchedAt,
    };
  },
  (outboundState, key) => {
    // Rehydrated caches receive a stable runtime shape before components and
    // thunk conditions read them.
    if (key === "games") {
      return {
        data: Array.isArray(outboundState?.data) ? outboundState.data : [],
        status: outboundState?.lastFetchedAt ? "succeeded" : "idle",
        lastFetchedAt: outboundState?.lastFetchedAt || null,
        error: null,
      };
    }

    return {
      tournaments: outboundState?.tournaments || {},
      listStatus: outboundState?.lastFetchedAt ? "succeeded" : "idle",
      listError: null,
      lastFetchedAt: outboundState?.lastFetchedAt || null,
      selectedTournament: null,
      selectedTournamentFetchedAt: null,
      detailStatus: "idle",
      detailError: null,
      detailRequestId: null,
      requestedTournamentId: null,
    };
  },
  { whitelist: ["games", "tournament"] }
);

const migrations = {
  2: (state) => {
    // Version 1 persisted the auth slice. Remove that browser-controlled proof
    // once, then let session verification rebuild authoritative auth state.
    if (!state) return state;

    const migratedState = { ...state };
    delete migratedState.auth;
    return migratedState;
  },
  3: (state) => {
    // Version 3 separates tournament list and detail request state. Persisted
    // transforms rebuild runtime fields, so cached public data can stay intact.
    return state;
  },
};

const persistConfig = {
  key: "root",
  version: 3,
  storage,
  whitelist: ["games", "tournament"],
  transforms: [publicCacheTransform],
  migrate: createMigrate(migrations, { debug: false }),
};

export default persistConfig;
