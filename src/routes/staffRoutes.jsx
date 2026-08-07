import { ROUTES } from "./routeConstants";

export const staffRoutes = [
  { path: ROUTES.STAFF, componentKey: "StaffDashboard", access: "staff", withSuspense: true },
  { path: ROUTES.STAFF_ACCESS_CONTROL, componentKey: "StaffAccessControl", access: "staff", withSuspense: true },
  { path: ROUTES.EVENT_MANAGER, componentKey: "EventManagerDashboard", access: "eventManager", withSuspense: true },
  { path: ROUTES.GAME_MANAGER, componentKey: "GameManagerDashboard", access: "gameManager", withSuspense: true },
];
