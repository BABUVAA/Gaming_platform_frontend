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

  // Persist only the minimum non-secret recovery state. In particular, a
  // replacement password must remain in component memory and never survive a
  // reload or become readable from browser storage.
  const safeRegistration = {
    email: registration.email,
    requiresEmailVerification: true,
    ...(registration.verificationEmailSent === true
      ? { verificationEmailSent: true }
      : {}),
    ...(registration.resendAvailableAt
      ? { resendAvailableAt: registration.resendAvailableAt }
      : {}),
    ...(registration.referralApplied === true ? { referralApplied: true } : {}),
    ...(registration.recovered === true ? { recovered: true } : {}),
    ...(registration.recovered === true &&
    typeof registration.recoveryUsername === "string" &&
    registration.recoveryUsername
      ? { recoveryUsername: registration.recoveryUsername }
      : {}),
  };
  try {
    storage?.setItem(
      STORAGE_KEY,
      JSON.stringify({ registration: safeRegistration, savedAt: now }),
    );
  } catch {
    // The live screen still works when browser storage is unavailable.
  }
};

export { MAX_PENDING_AGE_MS, STORAGE_KEY };
