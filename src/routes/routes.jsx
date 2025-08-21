import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useSelector } from "react-redux";

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
  TournamentGame: lazy(() => import("../pages/TournamentGame.jsx")),
  TournamentDetails: lazy(() => import("../pages/TournamentDetails.jsx")),
  Profile: lazy(() => import("../pages/Profile")),
  Account: lazy(() => import("../pages/Account")),
  Refer: lazy(() => import("../pages/Refer")),
  Wallet: lazy(() => import("../pages/Wallet")),
  AdminDashboard: lazy(() => import("../pages/AdminDashboard.jsx")),
  Login: lazy(() => import("../pages/Login")),
  SignUp: lazy(() => import("../pages/SignUp")),
  Clan: lazy(() => import("../pages/Clan")),
  Coc: lazy(() => import("../pages/Coc.jsx")),
  Chats: lazy(() => import("../pages/Chats.jsx")),
};

// Loading fallback
const Loading = () => <LoadingSpinner />;

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((store) => store.auth);
  return isAuthenticated ? children : <Navigate to={ROUTES.LOGIN} replace />;
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
          { index: true, element: <LazyComponents.Game /> },
          {
            path: "tournament",
            element: <LazyComponents.Tournament />,
          },
          // Dynamic Game Tournament Route
          {
            path: "tournament/:game",
            element: <LazyComponents.TournamentGame />,
          },
          { path: "chats", element: <LazyComponents.Chats /> },
          { path: "clan", element: <LazyComponents.Clan /> },
          { path: "profile", element: <LazyComponents.Profile /> },
          { path: "account", element: <LazyComponents.Account /> },
          { path: "wallet", element: <LazyComponents.Wallet /> },
          { path: "refer", element: <LazyComponents.Refer /> },
        ],
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
      <Suspense fallback={<Loading />}>
        <LazyComponents.AdminDashboard />
      </Suspense>
    ),
  },
]);

export default routes;
