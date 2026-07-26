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
  user_profile,
  verifySession,
} from "../slices/authSlice";
import {
  selectAuthError,
  selectAuthProfile,
  selectAuthProfileStatus,
  selectAuthUser,
  selectIsAuthenticated,
  selectSessionStatus,
} from "../selectors/authSelectors";
import { fetchGames } from "../slices/gameSlice";
import { fetchTournaments } from "../slices/tournamentSlice";
import {
  selectGames,
  selectGamesError,
  selectGamesStatus,
} from "../selectors/gameSelectors";
import {
  selectTournamentList,
  selectTournamentListError,
  selectTournamentListStatus,
} from "../selectors/tournamentSelectors";

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
    // We return useSelector here so future consumers can read state through
    // one shared store helper surface instead of importing react-redux everywhere.
    useSelector,
  };
};

export const useAuthStore = () => {
  // Select each auth value through its named selector instead of reaching into
  // `state.auth` from route and component files. If the slice shape changes,
  // these selectors remain the single place that needs updating.
  const user = useSelector(selectAuthUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const sessionStatus = useSelector(selectSessionStatus);
  const isSessionResolving = [
    SESSION_STATUS.UNKNOWN,
    SESSION_STATUS.CHECKING,
  ].includes(sessionStatus);
  const profile = useSelector(selectAuthProfile);
  const profileStatus = useSelector(selectAuthProfileStatus);
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

  const loadProfile = useCallback(() => {
    // Role and capability guards depend on the server-provided profile, so
    // this operation is shared by every route that needs authorization data.
    return dispatch(user_profile());
  }, [dispatch]);

  const clearAuthError = useCallback(() => {
    // Components can clear a displayed authentication error without importing
    // the slice action directly.
    return dispatch(authAction.resetError());
  }, [dispatch]);

  return {
    user,
    isAuthenticated,
    sessionStatus,
    isSessionResolving,
    profile,
    profileStatus,
    error,
    verifyCurrentSession,
    signIn,
    signUp,
    signOut,
    loadProfile,
    clearAuthError,
  };
};

export const useCatalogStore = () => {
  // Public game and tournament catalogs share one read boundary because pages
  // commonly need both, while their slices retain independent cache policies.
  const games = useSelector(selectGames);
  const gamesStatus = useSelector(selectGamesStatus);
  const gamesError = useSelector(selectGamesError);
  const tournaments = useSelector(selectTournamentList);
  const tournamentsStatus = useSelector(selectTournamentListStatus);
  const tournamentsError = useSelector(selectTournamentListError);
  const dispatch = useDispatch();

  const loadGames = useCallback(
    (options) => dispatch(fetchGames(options)),
    [dispatch],
  );

  const loadTournaments = useCallback(
    (options) => dispatch(fetchTournaments(options)),
    [dispatch],
  );

  const loadCatalog = useCallback(
    (options) => {
      // Both thunks own TTL and in-flight deduplication, so callers can request
      // the pair without reproducing cache checks in page components.
      const gamesRequest = dispatch(fetchGames(options));
      const tournamentsRequest = dispatch(fetchTournaments(options));
      return Promise.all([gamesRequest, tournamentsRequest]);
    },
    [dispatch],
  );

  return {
    games,
    gamesStatus,
    gamesError,
    tournaments,
    tournamentsStatus,
    tournamentsError,
    loadGames,
    loadTournaments,
    loadCatalog,
  };
};

export default useStore;
