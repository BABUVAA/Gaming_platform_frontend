import { ROUTES } from "./routeConstants";

// Admin routes are isolated now so they can later move to a separate domain,
// shell, or package with minimal changes to the route builder.
export const adminRoutes = [
  {
    path: ROUTES.ADMIN_PANEL,
    componentKey: "AdminDashboard",
    access: "admin",
    withSuspense: true,
  },
];
