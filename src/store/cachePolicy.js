// Public catalogs change less frequently than live match or wallet data, so a
// short client TTL can avoid repeat requests while still refreshing regularly.
export const PUBLIC_CACHE_TTL = Object.freeze({
  GAMES: 10 * 60 * 1000,
  TOURNAMENTS: 60 * 1000,
  TOURNAMENT_DETAILS: 60 * 1000,
});

export const isCacheFresh = (lastFetchedAt, ttlMs) => {
  // A missing or invalid timestamp always represents a cold cache.
  if (!Number.isFinite(lastFetchedAt)) {
    return false;
  }

  return Date.now() - lastFetchedAt < ttlMs;
};
