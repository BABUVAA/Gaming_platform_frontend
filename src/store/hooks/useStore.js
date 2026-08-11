import { useCallback } from "react";
import {
  useDispatch,
  useSelector,
  useStore as useReduxStore,
} from "react-redux";
import {
  authAction,
  login,
  logout,
  register,
  SESSION_STATUS,
  verifySession,
} from "../slices/authSlice";
import {
  accountActions,
  changePassword,
  fetchAccount,
} from "../slices/accountSlice";
import {
  selectAccount,
  selectAccountError,
  selectAccountStatus,
} from "../selectors/accountSelectors";
import {
  selectAuthError,
  selectAuthUser,
  selectIsAuthenticated,
  selectIsVerified,
  selectSessionStatus,
} from "../selectors/authSelectors";
import {
  fetchPlayerProfile,
  fetchPlayerSummary,
  playerActions,
} from "../slices/playerSlice";
import {
  selectPlayerError,
  selectPlayerProfile,
  selectPlayerProfileStatus,
  selectPlayerSummary,
  selectPlayerSummaryStatus,
} from "../selectors/playerSelectors";
import { fetchGames } from "../slices/gameSlice";
import {
  joinQuickMatchQueue,
  matchmakingActions,
} from "../slices/matchmakingSlice";
import {
  selectGames,
  selectGamesError,
  selectGamesStatus,
} from "../selectors/gameSelectors";
import {
  selectJoiningOfferingId,
  selectQuickMatchJoinError,
  selectQuickMatchJoinStatus,
} from "../selectors/matchmakingSelectors";

export const useStore = () => {
  // This hook is the store-facing convenience boundary for React code.
  // We will grow it with domain hooks/selectors later without changing callers.
  // If store consumption becomes more structured later, this hook can stay as
  // the shared base while `useAuthStore`, `useWalletStore`, and similar hooks
  // build on top of it.
  const dispatch = useDispatch();
  const store = useReduxStore();

  return {
    // Dispatch lets components and hooks trigger Redux actions and thunks.
    dispatch,
    // The raw store is available for advanced cases that need direct access.
    // Most feature code should still prefer selectors and thunks over raw store reads.
    store,
  };
};

export const useAccountStore = () => {
  const account = useSelector(selectAccount);
  const accountStatus = useSelector(selectAccountStatus);
  const error = useSelector(selectAccountError);
  const dispatch = useDispatch();

  const loadAccount = useCallback(
    () => {
      // The returned thunk promise lets the page abort or unwrap the request
      // later without bypassing the shared store boundary.
      return dispatch(fetchAccount());
    },
    [dispatch],
  );

  const clearAccountError = useCallback(() => {
    return dispatch(accountActions.resetError());
  }, [dispatch]);

  const updatePassword = useCallback(
    (passwords) => {
      // Password values go directly to the authenticated auth endpoint; this
      // hook never stores plaintext credentials in Redux state.
      return dispatch(changePassword(passwords));
    },
    [dispatch],
  );

  return {
    account,
    accountStatus,
    error,
    loadAccount,
    updatePassword,
    clearAccountError,
  };
};

export const useAuthStore = () => {
  // Select each auth value through its named selector instead of reaching into
  // `state.auth` from route and component files. If the slice shape changes,
  // these selectors remain the single place that needs updating.
  const user = useSelector(selectAuthUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isVerified = useSelector(selectIsVerified);
  const sessionStatus = useSelector(selectSessionStatus);
  const isSessionResolving = [
    SESSION_STATUS.UNKNOWN,
    SESSION_STATUS.CHECKING,
  ].includes(sessionStatus);
  const error = useSelector(selectAuthError);
  const dispatch = useDispatch();

  const verifyCurrentSession = useCallback(() => {
    // Session verification asks the backend whether the browser cookie still
    // represents a valid server-side session.
    return dispatch(verifySession());
  }, [dispatch]);

  const signIn = useCallback(
    (credentials) => {
      // Login credentials go through the auth thunk so API and Redux state
      // transitions remain owned by the auth slice.
      return dispatch(login(credentials));
    },
    [dispatch],
  );

  const signUp = useCallback(
    (userData) => {
      // Registration uses the same auth boundary and returns the dispatched
      // thunk promise so callers can inspect success or failure when needed.
      return dispatch(register(userData));
    },
    [dispatch],
  );

  const signOut = useCallback(() => {
    // Logout asks the backend to destroy the session before reducers clear
    // the authenticated user and profile from the frontend store.
    return dispatch(logout());
  }, [dispatch]);

  const clearAuthError = useCallback(() => {
    // Components can clear a displayed authentication error without importing
    // the slice action directly.
    return dispatch(authAction.resetError());
  }, [dispatch]);

  return {
    user,
    isAuthenticated,
    // Verification is exposed beside authentication because route guards and
    // verified-only requests must make the same account-status decision.
    isVerified,
    sessionStatus,
    isSessionResolving,
    error,
    verifyCurrentSession,
    signIn,
    signUp,
    signOut,
    clearAuthError,
  };
};

export const usePlayerStore = () => {
  // Player data has a separate React boundary because profile operations do
  // not establish authentication and must reset independently with a session.
  const summary = useSelector(selectPlayerSummary);
  const summaryStatus = useSelector(selectPlayerSummaryStatus);
  const profile = useSelector(selectPlayerProfile);
  const profileStatus = useSelector(selectPlayerProfileStatus);
  const error = useSelector(selectPlayerError);
  const dispatch = useDispatch();

  const loadSummary = useCallback(() => {
    // Dashboard routing and shell identity use this small request rather than
    // loading every social and competitive profile relationship.
    return dispatch(fetchPlayerSummary());
  }, [dispatch]);

  const loadProfile = useCallback(() => {
    // Detailed feature routes call this only when their page consumes the
    // complete gaming profile.
    return dispatch(fetchPlayerProfile());
  }, [dispatch]);

  const clearPlayerError = useCallback(() => {
    return dispatch(playerActions.resetError());
  }, [dispatch]);

  return {
    summary,
    summaryStatus,
    profile,
    profileStatus,
    error,
    loadSummary,
    loadProfile,
    clearPlayerError,
  };
};

export const useCatalogStore = () => {
  // The shared catalog boundary owns only Games. Quick Match discovery has a
  // separate authenticated Redux boundary and must not fall back to legacy
  // Tournament/TournamentType catalog routes.
  const games = useSelector(selectGames);
  const gamesStatus = useSelector(selectGamesStatus);
  const gamesError = useSelector(selectGamesError);
  const dispatch = useDispatch();

  const loadGames = useCallback(
    (options) => dispatch(fetchGames(options)),
    [dispatch],
  );

  return {
    games,
    gamesStatus,
    gamesError,
    loadGames,
  };
};

export const useMatchmakingStore = () => {
  // Components use this hook instead of importing Axios so all Quick Match
  // commands share Redux status, normalized errors, and duplicate protection.
  const joinStatus = useSelector(selectQuickMatchJoinStatus);
  const joiningOfferingId = useSelector(selectJoiningOfferingId);
  const joinError = useSelector(selectQuickMatchJoinError);
  const dispatch = useDispatch();

  const joinQuickMatch = useCallback(
    (request) => dispatch(joinQuickMatchQueue(request)),
    [dispatch],
  );

  const clearJoinError = useCallback(() => {
    return dispatch(matchmakingActions.clearJoinError());
  }, [dispatch]);

  return {
    joinStatus,
    joiningOfferingId,
    joinError,
    joinQuickMatch,
    clearJoinError,
  };
};

export default useStore;
