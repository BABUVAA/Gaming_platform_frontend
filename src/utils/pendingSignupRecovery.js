const STORAGE_KEY = "egaming.pending-signup";
const MAX_PENDING_AGE_MS = 48 * 60 * 60 * 1000;

export const clearPendingSignup = (storage = globalThis.sessionStorage) => {
  try {
    storage?.removeItem(STORAGE_KEY);
  } catch {
    // Storage can be unavailable in hardened/private browser contexts.
  }
};

export const loadPendingSignup = (
  storage = globalThis.sessionStorage,
  now = Date.now(),
) => {
  try {
    const stored = JSON.parse(storage?.getItem(STORAGE_KEY) || "null");
    if (
      !stored?.registration?.email ||
      stored.registration.requiresEmailVerification !== true ||
      !Number.isFinite(stored.savedAt) ||
      now - stored.savedAt >= MAX_PENDING_AGE_MS
    ) {
      clearPendingSignup(storage);
      return null;
    }
    return stored.registration;
  } catch {
    clearPendingSignup(storage);
    return null;
  }
};

export const savePendingSignup = (
  registration,
  storage = globalThis.sessionStorage,
  now = Date.now(),
) => {
  if (!registration?.email || registration.requiresEmailVerification !== true) {
    return;
  }
  try {
    storage?.setItem(
      STORAGE_KEY,
      JSON.stringify({ registration, savedAt: now }),
    );
  } catch {
    // The live screen still works when browser storage is unavailable.
  }
};

export { MAX_PENDING_AGE_MS, STORAGE_KEY };
