import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";
import PropTypes from "prop-types";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useDispatch, useSelector } from "react-redux";
import { user_profile } from "../store/authSlice";
import { getDefaultRouteForRole } from "../utils/navigation";
import { logout } from "../store/authSlice";

// Centralized Route Paths
const ROUTES = {
  HOME: "/home",
  LOGIN: "/login",
  SIGNUP: "/signup",
  FORGOT_PASSWORD: "/forgotPWD",
  DASHBOARD: "/dashboard",
  GAME: "/dashboard/game",
  TOURNAMENT: "/dashboard/tournament",
  CHATS: "/dashboard/chats",
  CLAN: "/dashboard/clan",
  PROFILE: "/dashboard/profile",
  ACCOUNT: "/dashboard/account",
  WALLET: "/dashboard/wallet",
  REFER: "/dashboard/refer",
  ADMIN_PANEL: "/panelAdmin",
  COC: "/coc",
  LOGOUT: "/logout",
  TOURNAMENT_DETAILS: "/",
};

// Lazy load components
const LazyComponents = {
  App: lazy(() => import("../pages/App")),
  Home: lazy(() => import("../pages/Home")),
  ForgotPassword: lazy(() => import("../pages/ForgotPassword")),
  Dashboard: lazy(() => import("../pages/Dashboard")),
  Game: lazy(() => import("../pages/Game")),
  Tournament: lazy(() => import("../pages/Tournament")),
  Matches: lazy(() => import("../pages/Matches.jsx")),
  MatchRoom: lazy(() => import("../pages/MatchRoom.jsx")),
  TournamentGame: lazy(() => import("../pages/TournamentGame.jsx")),
  TournamentDetails: lazy(() => import("../pages/TournamentDetails.jsx")),
  Profile: lazy(() => import("../pages/Profile")),
  Account: lazy(() => import("../pages/Account")),
  Refer: lazy(() => import("../pages/Refer")),
  Wallet: lazy(() => import("../pages/Wallet")),
  Operations: lazy(() => import("../pages/Operations.jsx")),
  AdminDashboard: lazy(() => import("../pages/AdminDashboard.jsx")),
  Login: lazy(() => import("../pages/Login")),
  SignUp: lazy(() => import("../pages/SignUp")),
  Clan: lazy(() => import("../pages/Clan")),
  Coc: lazy(() => import("../pages/Coc.jsx")),
  Chats: lazy(() => import("../pages/Chats.jsx")),
};

// Loading fallback
const Loading = () => <LoadingSpinner />;

const ProfileRecoveryState = ({ onRetry, onResetSession }) => (
  <div className="mx-auto max-w-lg rounded-[28px] border border-rose-400/20 bg-slate-950/90 p-6 text-center text-slate-200 shadow-[0_18px_40px_rgba(2,8,23,0.35)]">
    <h2 className="text-xl font-bold text-white">Unable to load your profile</h2>
    <p className="mt-3 text-sm leading-7 text-slate-400">
      We stopped showing the spinner here so you can recover instead of getting stuck on a loading screen.
    </p>
    <div className="mt-5 flex flex-wrap justify-center gap-3">
      <button
        type="button"
        onClick={onRetry}
        className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
      >
        Retry Profile Load
      </button>
      <button
        type="button"
        onClick={onResetSession}
        className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/10 hover:text-white"
      >
        Return To Login
      </button>
    </div>
  </div>
);

const useProfileGate = () => {
  const dispatch = useDispatch();
  const [hasRequestedProfile, setHasRequestedProfile] = useState(false);
  const { isAuthenticated, profile, profileStatus } = useSelector(
    (store) => store.auth
  );

  useEffect(() => {
    // Both dashboard landing and role-aware route wrappers rely on the same
    // profile bootstrap rules, so we centralize the fetch-once behavior here.
    if (!isAuthenticated || profile || hasRequestedProfile) return;

    setHasRequestedProfile(true);
    dispatch(user_profile());
  }, [dispatch, hasRequestedProfile, isAuthenticated, profile]);

  const retryProfileLoad = () => {
    // Resetting the local request latch lets the effect ask again.
    setHasRequestedProfile(false);
  };

  const resetSession = () => {
    dispatch(logout());
  };

  return {
    isAuthenticated,
    profile,
    profileStatus,
    retryProfileLoad,
    resetSession,
  };
};

const ProfileGate = ({ allowedRoles, children, fallback }) => {
  const {
    isAuthenticated,
    profile,
    profileStatus,
    retryProfileLoad,
    resetSession,
  } = useProfileGate();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (!profile) {
    if (profileStatus === "failed") {
      return (
        <ProfileRecoveryState
          onRetry={retryProfileLoad}
          onResetSession={resetSession}
        />
      );
    }

    return <Loading />;
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to={getDefaultRouteForRole(profile.role)} replace />;
  }

  // A render-function fallback keeps the gate reusable for dashboard landing
  // without hard-coding the child element inside the guard itself.
  return children || (fallback ? fallback(profile) : null);
};

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((store) => store.auth);
  return isAuthenticated ? children : <Navigate to={ROUTES.LOGIN} replace />;
};

const RoleAwareRoute = ({ allowedRoles, children }) => {
  return <ProfileGate allowedRoles={allowedRoles}>{children}</ProfileGate>;
};

const AdminRoute = ({ children }) => (
  <RoleAwareRoute allowedRoles={["admin"]}>{children}</RoleAwareRoute>
);

const OperatorRoute = ({ children }) => (
  <RoleAwareRoute allowedRoles={["operator"]}>{children}</RoleAwareRoute>
);

const PlayerRoute = ({ children }) => (
  <RoleAwareRoute allowedRoles={["player", "host"]}>{children}</RoleAwareRoute>
);

const DashboardLanding = () => {
  return (
    <ProfileGate
      fallback={(profile) =>
        ["player", "host"].includes(profile.role) ? (
          <LazyComponents.Game />
        ) : (
          <Navigate to={getDefaultRouteForRole(profile.role)} replace />
        )
      }
    />
  );
};

// Landing Page Logic
const LandingPage = () => {
  const { isAuthenticated } = useSelector((store) => store.auth);
  return isAuthenticated ? (
    <Navigate to={ROUTES.DASHBOARD} replace />
  ) : (
    <Navigate to={ROUTES.HOME} replace />
  );
};

ProfileRecoveryState.propTypes = {
  onRetry: PropTypes.func.isRequired,
  onResetSession: PropTypes.func.isRequired,
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

RoleAwareRoute.propTypes = {
  allowedRoles: PropTypes.arrayOf(PropTypes.string).isRequired,
  children: PropTypes.node.isRequired,
};

ProfileGate.propTypes = {
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
  children: PropTypes.node,
  fallback: PropTypes.func,
};

AdminRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

OperatorRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

PlayerRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

// Define Routes
const routes = createBrowserRouter([
  {
    path: "/",
    element: (
      <Suspense fallback={<Loading />}>
        <LazyComponents.App />
      </Suspense>
    ),
    children: [
      { index: true, element: <LandingPage /> },
      { path: ROUTES.HOME, element: <LazyComponents.Home /> },
      {
        path: ROUTES.FORGOT_PASSWORD,
        element: <LazyComponents.ForgotPassword />,
      },
      { path: ROUTES.LOGIN, element: <LazyComponents.Login /> },
      { path: ROUTES.SIGNUP, element: <LazyComponents.SignUp /> },
      { path: ROUTES.COC, element: <LazyComponents.Coc /> },
      { path: ROUTES.LOGOUT, element: <></> }, // Placeholder for logout logic

      {
        path: ROUTES.DASHBOARD,
        element: (
          <ProtectedRoute>
            <LazyComponents.Dashboard />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <DashboardLanding /> },
          {
            path: "tournament",
            element: (
              <PlayerRoute>
                <LazyComponents.Tournament />
              </PlayerRoute>
            ),
          },
          {
            path: "matches",
            element: (
              <PlayerRoute>
                <LazyComponents.Matches />
              </PlayerRoute>
            ),
          },
          {
            path: "matches/:id",
            element: (
              <PlayerRoute>
                <LazyComponents.MatchRoom />
              </PlayerRoute>
            ),
          },
          // Dynamic Game Tournament Route
          {
            path: "tournament/:game",
            element: (
              <PlayerRoute>
                <LazyComponents.TournamentGame />
              </PlayerRoute>
            ),
          },
          {
            path: "chats",
            element: (
              <PlayerRoute>
                <LazyComponents.Chats />
              </PlayerRoute>
            ),
          },
          {
            path: "clan",
            element: (
              <PlayerRoute>
                <LazyComponents.Clan />
              </PlayerRoute>
            ),
          },
          {
            path: "profile",
            element: (
              <PlayerRoute>
                <LazyComponents.Profile />
              </PlayerRoute>
            ),
          },
          {
            path: "account",
            element: (
              <PlayerRoute>
                <LazyComponents.Account />
              </PlayerRoute>
            ),
          },
          {
            path: "wallet",
            element: (
              <PlayerRoute>
                <LazyComponents.Wallet />
              </PlayerRoute>
            ),
          },
          {
            path: "operations",
            element: (
              <OperatorRoute>
                <LazyComponents.Operations />
              </OperatorRoute>
            ),
          },
          {
            path: "refer",
            element: (
              <PlayerRoute>
                <LazyComponents.Refer />
              </PlayerRoute>
            ),
          },
        ],
      },
      {
        path: "tournamentDetails/:id",
        element: <LazyComponents.TournamentDetails />,
      },
      {
        path: "tournamentDeatils/:id",
        element: <LazyComponents.TournamentDetails />,
      },
    ],
  },
  {
    path: ROUTES.ADMIN_PANEL,
    element: (
      <AdminRoute>
        <Suspense fallback={<Loading />}>
          <LazyComponents.AdminDashboard />
        </Suspense>
      </AdminRoute>
    ),
  },
]);

export default routes;
