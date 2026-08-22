import { lazy } from "react";

// Route components are registered in one place so config files can reference
// them by key instead of importing page modules repeatedly.
const LazyComponents = {
  App: lazy(() => import("../pages/App")),
  Home: lazy(() => import("../pages/Home")),
  ForgotPassword: lazy(() => import("../pages/ForgotPassword")),
  Dashboard: lazy(() => import("../pages/Dashboard")),
  Game: lazy(() => import("../pages/Game")),
  Matches: lazy(() => import("../pages/Matches.jsx")),
  MatchRoom: lazy(() => import("../pages/MatchRoom.jsx")),
  QuickMatchDetails: lazy(() => import("../pages/QuickMatchDetails.jsx")),
  EventDetails: lazy(() => import("../pages/EventDetails.jsx")),
  HostTournamentProposal: lazy(() => import("../pages/HostTournamentProposal.jsx")),
  Profile: lazy(() => import("../pages/Profile")),
  GameAccounts: lazy(() => import("../pages/GameAccounts")),
  AccountSettings: lazy(() => import("../pages/AccountSettings")),
  ChangePassword: lazy(() => import("../pages/ChangePassword")),
  Refer: lazy(() => import("../pages/Refer")),
  Wallet: lazy(() => import("../pages/Wallet")),
  Operations: lazy(() => import("../pages/Operations.jsx")),
  AdminDashboard: lazy(() => import("../pages/AdminDashboard.jsx")),
  StaffDashboard: lazy(() => import("../pages/StaffDashboard.jsx")),
  StaffLayout: lazy(() => import("../pages/StaffLayout.jsx")),
  StaffAccessControl: lazy(() => import("../pages/StaffAccessControl.jsx")),
  EventManagerDashboard: lazy(() => import("../pages/EventManagerDashboard.jsx")),
  TournamentManagerDashboard: lazy(() => import("../pages/TournamentManagerDashboard.jsx")),
  GameManagerDashboard: lazy(() => import("../pages/GameManagerDashboard.jsx")),
  Login: lazy(() => import("../pages/Login")),
  SignUp: lazy(() => import("../pages/SignUp")),
  Clan: lazy(() => import("../pages/Clan")),
  Coc: lazy(() => import("../pages/Coc.jsx")),
  Chats: lazy(() => import("../pages/Chats.jsx")),
};

export default LazyComponents;
