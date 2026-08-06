import { createBrowserRouter } from "react-router-dom";
import { adminRoutes } from "./adminRoutes";
import { buildRoutes } from "./buildRoutes";
import { publicRoutes } from "./publicRoutes";
import { staffRoutes } from "./staffRoutes";

// The router file now acts as the final assembler.
// Domain route files declare route data, and the builder applies wrappers.
const routes = createBrowserRouter(
  buildRoutes([
    {
      path: "/",
      componentKey: "App",
      withSuspense: true,
      withRouteErrorBoundary: true,
      // Every current domain route shares the App shell. Domain files remain
      // separate so they can still be moved into independent services later.
      children: [...publicRoutes, ...adminRoutes, ...staffRoutes],
    },
  ])
);

export default routes;
