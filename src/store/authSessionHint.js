const UNAUTHENTICATED_SESSION_KEY = "platform:session:unauthenticated";

const getSessionStorage = () => {
  // Browser storage may be unavailable during server rendering, tests, or when
  // a browser privacy policy blocks access, so callers must tolerate no store.
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

export const hasUnauthenticatedSessionHint = () => {
  // This hint can only preserve a confirmed logged-out result. We never read
  // browser storage as evidence that a user is authenticated or authorized.
  return (
    getSessionStorage()?.getItem(UNAUTHENTICATED_SESSION_KEY) === "true"
  );
};

export const rememberUnauthenticatedSession = () => {
  // sessionStorage survives page refreshes but is scoped to this browser tab,
  // allowing a new tab or browser session to perform its own secure check.
  getSessionStorage()?.setItem(UNAUTHENTICATED_SESSION_KEY, "true");
};

export const forgetUnauthenticatedSession = () => {
  // A successful login, registration, or verification invalidates the hint so
  // later refreshes are allowed to ask the backend about the active cookie.
  getSessionStorage()?.removeItem(UNAUTHENTICATED_SESSION_KEY);
};
