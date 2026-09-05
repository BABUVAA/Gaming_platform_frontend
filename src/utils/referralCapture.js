const STORAGE_KEY = "egaming.referral-code";
const MAX_REFERRAL_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const normalizeCode = (value) =>
  typeof value === "string" ? value.trim().toUpperCase() : "";

export const clearCapturedReferral = (storage = globalThis.localStorage) => {
  try {
    storage?.removeItem(STORAGE_KEY);
  } catch {
    // Signup still works when browser storage is unavailable.
  }
};

export const saveCapturedReferral = (
  code,
  storage = globalThis.localStorage,
  now = Date.now(),
) => {
  const normalized = normalizeCode(code);
  if (!/^[A-Z0-9_-]{3,40}$/.test(normalized)) return false;
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify({ code: normalized, savedAt: now }));
    return true;
  } catch {
    return false;
  }
};

export const loadCapturedReferral = (
  storage = globalThis.localStorage,
  now = Date.now(),
) => {
  try {
    const stored = JSON.parse(storage?.getItem(STORAGE_KEY) || "null");
    if (
      !/^[A-Z0-9_-]{3,40}$/.test(stored?.code || "") ||
      !Number.isFinite(stored?.savedAt) ||
      now - stored.savedAt >= MAX_REFERRAL_AGE_MS
    ) {
      clearCapturedReferral(storage);
      return "";
    }
    return stored.code;
  } catch {
    clearCapturedReferral(storage);
    return "";
  }
};

export { MAX_REFERRAL_AGE_MS };
