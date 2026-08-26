import { ROUTES, STAFF_ROUTE_SEGMENTS } from "./routeConstants";

export const staffRoutes = [
  {
    path: ROUTES.STAFF,
    componentKey: "StaffLayout",
    access: "staff",
    withSuspense: true,
    children: [
      { index: true, componentKey: "StaffDashboard" },
      { path: STAFF_ROUTE_SEGMENTS.ACCESS_CONTROL, componentKey: "StaffAccessControl", access: "admin" },
      { path: STAFF_ROUTE_SEGMENTS.OPERATIONS, componentKey: "Operations", access: "operator" },
      { path: STAFF_ROUTE_SEGMENTS.EVENTS, componentKey: "EventManagerDashboard", access: "eventManager" },
      { path: STAFF_ROUTE_SEGMENTS.TOURNAMENTS, componentKey: "TournamentManagerDashboard", access: "tournamentManager" },
      { path: STAFF_ROUTE_SEGMENTS.GAMES, componentKey: "GameManagerDashboard", access: "gameManager" },
      { path: STAFF_ROUTE_SEGMENTS.DISCORD, componentKey: "DiscordOperations", access: "staff" },
    ],
  },
];
