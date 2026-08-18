// Public catalogs change less frequently than live match or wallet data, so a
// short client TTL can avoid repeat requests while still refreshing regularly.
export const PUBLIC_CACHE_TTL = Object.freeze({
  GAMES: 10 * 60 * 1000,
  TOURNAMENTS: 60 * 1000,
});

export const isCacheFresh = (lastFetchedAt, ttlMs) => {
  // A missing or invalid timestamp always represents a cold cache.
  if (
    !Number.isFinite(lastFetchedAt) ||
    !Number.isFinite(ttlMs) ||
    ttlMs <= 0
  ) {
    return false;
  }

  const cacheAge = Date.now() - lastFetchedAt;

  // Future timestamps can come from clock changes or corrupted persisted data.
  // They must not suppress refreshes until the local clock catches up.
  return cacheAge >= 0 && cacheAge < ttlMs;
};
