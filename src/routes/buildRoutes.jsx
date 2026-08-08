import { Suspense } from "react";
import {
  AdminRoute,
  ApprovedHostRoute,
  DashboardLanding,
  DetailedPlayerRoute,
  LandingPage,
  Loading,
  OperatorRoute,
  PlayerRoute,
  ProtectedRoute,
  StaffRoute,
  EventManagerRoute,
  GameManagerRoute,
  VerifiedPlayerRoute,
  VerifiedDetailedPlayerRoute,
} from "./RouteGuards";
import LazyComponents from "./routeRegistry";
import RouteErrorPage from "../components/common/RouteErrorPage";

const guardElements = {
  DashboardLanding: <DashboardLanding />,
  LandingPage: <LandingPage />,
};

const accessWrappers = {
  admin: AdminRoute,
  detailedPlayer: DetailedPlayerRoute,
  // Hosting is an approved player capability, so its access key names the
  // capability instead of pretending that host is another user role.
  approvedHost: ApprovedHostRoute,
  operator: OperatorRoute,
  player: PlayerRoute,
  protected: ProtectedRoute,
  staff: StaffRoute,
  eventManager: EventManagerRoute,
  gameManager: GameManagerRoute,
  // Verified-player access prevents restricted pages from mounting, which
  // also prevents their page-level API requests from starting.
  verifiedPlayer: VerifiedPlayerRoute,
  verifiedDetailedPlayer: VerifiedDetailedPlayerRoute,
};

const getRouteComponent = (componentKey) => {
  // Config files only store the registry key. This resolver turns that key
  // into the actual lazy component right before the router is built.
  const Component = LazyComponents[componentKey];

  if (!Component) {
    throw new Error(`Unknown route component: ${componentKey}`);
  }

  return <Component />;
};

const getRouteElement = (route) => {
  // Route definitions can reference either a shared guard element or a lazy
  // page component. Keeping both options makes the config flexible but simple.
  if (route.guardElement) {
    return guardElements[route.guardElement];
  }

  if (route.element) {
    return route.element;
  }

  return getRouteComponent(route.componentKey);
};

const wrapWithAccess = (element, access) => {
  // Access wrapping is centralized here so role protection stays consistent
  // across every route config file.
  if (!access) {
    return element;
  }

  const GuardComponent = accessWrappers[access];

  if (!GuardComponent) {
    throw new Error(`Unknown route access level: ${access}`);
  }

  return <GuardComponent>{element}</GuardComponent>;
};

const wrapWithSuspense = (element, withSuspense) => {
  // Some top-level routes need their own suspense boundary because they sit
  // outside the main app shell. Nested routes can usually reuse a parent one.
  if (!withSuspense) {
    return element;
  }

  return <Suspense fallback={<Loading />}>{element}</Suspense>;
};

export const buildRoute = (route) => {
  const builtRoute = {};

  // Index routes do not accept a path, so the builder copies only the shape
  // that React Router expects for each route type.
  if (route.index) {
    builtRoute.index = true;
  } else if (route.path) {
    builtRoute.path = route.path;
  }

  const routeElement = getRouteElement(route);
  const accessWrappedElement = wrapWithAccess(routeElement, route.access);
  builtRoute.element = wrapWithSuspense(
    accessWrappedElement,
    route.withSuspense
  );

  // React Router intercepts route render errors before an outer React error
  // boundary. Root routes receive a user-safe fallback instead of its default
  // development stack-trace screen.
  if (route.withRouteErrorBoundary) {
    builtRoute.errorElement = <RouteErrorPage />;
  }

  if (route.children) {
    // Children are built recursively so nested route files can stay declarative
    // and avoid repeating the same wrapper boilerplate.
    builtRoute.children = route.children.map(buildRoute);
  }

  return builtRoute;
};

export const buildRoutes = (routes) => routes.map(buildRoute);

export default buildRoutes;
