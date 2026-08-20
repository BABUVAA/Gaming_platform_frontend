import { DASHBOARD_ROUTE_SEGMENTS, ROUTES } from "./routeConstants";
import { Navigate } from "react-router-dom";

// Dashboard routes stay grouped by the dashboard domain so future role splits
// can move whole sections without searching one giant router file.
export const dashboardChildRoutes = [
  { index: true, guardElement: "DashboardLanding" },
  {
    path: DASHBOARD_ROUTE_SEGMENTS.GAME,
    componentKey: "Game",
    access: "dashboardViewer",
  },
  {
    path: DASHBOARD_ROUTE_SEGMENTS.TOURNAMENT,
    element: <Navigate to={ROUTES.DASHBOARD} replace />,
    access: "verifiedDashboardViewer",
  },
  {
    path: DASHBOARD_ROUTE_SEGMENTS.EVENTS,
    element: <Navigate to={ROUTES.DASHBOARD} replace />,
    access: "verifiedDashboardViewer",
  },
  {
    path: DASHBOARD_ROUTE_SEGMENTS.EVENT_DETAILS,
    componentKey: "EventDetails",
    access: "verifiedDashboardViewer",
  },
  {
    path: DASHBOARD_ROUTE_SEGMENTS.MATCHES,
    componentKey: "Matches",
    access: "verifiedDashboardViewer",
  },
  {
    path: DASHBOARD_ROUTE_SEGMENTS.MATCH_ROOM,
    componentKey: "MatchRoom",
    access: "verifiedDashboardViewer",
  },
  {
    path: DASHBOARD_ROUTE_SEGMENTS.TOURNAMENT_GAME,
    element: <Navigate to={ROUTES.TOURNAMENT} replace />,
    access: "verifiedDashboardViewer",
  },
  {
    path: DASHBOARD_ROUTE_SEGMENTS.TOURNAMENT_OFFERING_DETAILS,
    componentKey: "QuickMatchDetails",
    access: "verifiedDashboardViewer",
  },
  {
    path: DASHBOARD_ROUTE_SEGMENTS.HOST_TOURNAMENT_PROPOSAL,
    componentKey: "HostTournamentProposal",
    access: "approvedHost",
  },
  {
    path: DASHBOARD_ROUTE_SEGMENTS.CHATS,
    componentKey: "Chats",
    access: "verifiedDetailedPlayer",
  },
  {
    path: DASHBOARD_ROUTE_SEGMENTS.CLAN,
    componentKey: "Clan",
    access: "verifiedPlayer",
  },
  {
    path: DASHBOARD_ROUTE_SEGMENTS.PROFILE,
    componentKey: "Profile",
    access: "detailedDashboardViewer",
  },
  {
    path: DASHBOARD_ROUTE_SEGMENTS.GAME_ACCOUNTS,
    componentKey: "GameAccounts",
    access: "verifiedDetailedDashboardViewer",
  },
  {
    path: DASHBOARD_ROUTE_SEGMENTS.ACCOUNT_SETTINGS,
    componentKey: "AccountSettings",
    access: "dashboardViewer",
  },
  {
    // Password security remains available before email verification so every
    // authenticated player can protect their account.
    path: DASHBOARD_ROUTE_SEGMENTS.CHANGE_PASSWORD,
    componentKey: "ChangePassword",
    access: "dashboardViewer",
  },
  {
    // Existing bookmarks keep working while the former Account page moves to
    // its accurate Game Accounts route.
    path: DASHBOARD_ROUTE_SEGMENTS.ACCOUNT_LEGACY,
    element: <Navigate to={ROUTES.GAME_ACCOUNTS} replace />,
    access: "verifiedDashboardViewer",
  },
  {
    path: DASHBOARD_ROUTE_SEGMENTS.WALLET,
    componentKey: "Wallet",
    access: "verifiedDashboardViewer",
  },
  {
    path: DASHBOARD_ROUTE_SEGMENTS.OPERATIONS,
    // Match operations now belongs to the staff workspace. Keep old links
    // working without mounting operator controls in the player dashboard.
    element: <Navigate to={ROUTES.OPERATIONS} replace />,
    access: "operator",
  },
  {
    path: DASHBOARD_ROUTE_SEGMENTS.REFER,
    componentKey: "Refer",
    access: "detailedPlayer",
  },
];

// The parent route handles authenticated dashboard layout concerns while each
// child route declares only the extra role restriction it needs.
export const dashboardRoute = {
  path: ROUTES.DASHBOARD,
  componentKey: "Dashboard",
  access: "protected",
  children: dashboardChildRoutes,
};

export default dashboardRoute;
