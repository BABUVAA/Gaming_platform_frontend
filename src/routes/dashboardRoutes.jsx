import { DASHBOARD_ROUTE_SEGMENTS, ROUTES } from "./routeConstants";

// Dashboard routes stay grouped by the dashboard domain so future role splits
// can move whole sections without searching one giant router file.
export const dashboardChildRoutes = [
  { index: true, guardElement: "DashboardLanding" },
  {
    path: DASHBOARD_ROUTE_SEGMENTS.GAME,
    componentKey: "Game",
    access: "player",
  },
  {
    path: DASHBOARD_ROUTE_SEGMENTS.TOURNAMENT,
    componentKey: "Tournament",
    access: "player",
  },
  {
    path: DASHBOARD_ROUTE_SEGMENTS.MATCHES,
    componentKey: "Matches",
    access: "player",
  },
  {
    path: DASHBOARD_ROUTE_SEGMENTS.MATCH_ROOM,
    componentKey: "MatchRoom",
    access: "player",
  },
  {
    path: DASHBOARD_ROUTE_SEGMENTS.TOURNAMENT_GAME,
    componentKey: "TournamentGame",
    access: "player",
  },
  {
    path: DASHBOARD_ROUTE_SEGMENTS.CHATS,
    componentKey: "Chats",
    access: "player",
  },
  {
    path: DASHBOARD_ROUTE_SEGMENTS.CLAN,
    componentKey: "Clan",
    access: "player",
  },
  {
    path: DASHBOARD_ROUTE_SEGMENTS.PROFILE,
    componentKey: "Profile",
    access: "player",
  },
  {
    path: DASHBOARD_ROUTE_SEGMENTS.ACCOUNT,
    componentKey: "Account",
    access: "player",
  },
  {
    path: DASHBOARD_ROUTE_SEGMENTS.WALLET,
    componentKey: "Wallet",
    access: "player",
  },
  {
    path: DASHBOARD_ROUTE_SEGMENTS.OPERATIONS,
    componentKey: "Operations",
    access: "operator",
  },
  {
    path: DASHBOARD_ROUTE_SEGMENTS.REFER,
    componentKey: "Refer",
    access: "player",
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
