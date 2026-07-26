import { lazy } from "react";

// Route components are registered in one place so config files can reference
// them by key instead of importing page modules repeatedly.
export const LazyComponents = {
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

export default LazyComponents;
