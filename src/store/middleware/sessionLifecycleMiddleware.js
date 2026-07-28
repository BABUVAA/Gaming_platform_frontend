import {
  createListenerMiddleware,
  isRejectedWithValue,
} from "@reduxjs/toolkit";
import { rememberUnauthenticatedSession } from "../authSessionHint";
import { sessionInvalidated } from "../actions/sessionActions";

const credentialActionPrefixes = new Set(["auth/login", "auth/signup"]);

const isProtectedRequestUnauthorized = (action, previousState) => {
  if (!isRejectedWithValue(action) || action.payload?.status !== 401) {
    return false;
  }

  // Invalid login or registration credentials describe a form attempt, not
  // the loss of an already established browser session.
  const typePrefix = action.type.replace(/\/rejected$/, "");
  if (credentialActionPrefixes.has(typePrefix)) return false;

  // Session verification is not part of the private request registry because
  // it establishes the session itself.
  if (typePrefix === "auth/verifySession") return true;

  // Listener predicates receive the state from before this rejected action.
  // A missing ID means logout already cleared this old request, so its late
  // 401 must not invalidate a newer user's session.
  return Boolean(
    previousState?.requestScope?.activeRequestIds?.[action.meta.requestId],
  );
};

const sessionLifecycleMiddleware = createListenerMiddleware();

sessionLifecycleMiddleware.startListening({
  predicate: (action, _currentState, previousState) =>
    isProtectedRequestUnauthorized(action, previousState),
  effect: (action, listenerApi) => {
    // Remember the authoritative 401 before clearing every private slice.
    rememberUnauthenticatedSession();
    listenerApi.dispatch(sessionInvalidated(action.payload));
  },
});

export default sessionLifecycleMiddleware;
