const AUTH_COOKIE_CONSENT_KEY = "egaming.required-auth-cookies";

const getDefaultStorage = () => {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export const hasAuthCookieConsent = (storage = getDefaultStorage()) => {
  try {
    return storage?.getItem(AUTH_COOKIE_CONSENT_KEY) === "accepted";
  } catch {
    return false;
  }
};

export const saveAuthCookieConsent = (
  accepted,
  storage = getDefaultStorage(),
) => {
  try {
    if (accepted) storage?.setItem(AUTH_COOKIE_CONSENT_KEY, "accepted");
    else storage?.removeItem(AUTH_COOKIE_CONSENT_KEY);
  } catch {
    // A browser that blocks storage can still submit after explicit consent;
    // the post-login server check remains the authoritative cookie proof.
  }
};
