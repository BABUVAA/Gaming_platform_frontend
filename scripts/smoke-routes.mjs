import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

const routeFiles = [
  "src/routes/routes.jsx",
  "src/routes/publicRoutes.jsx",
  "src/routes/adminRoutes.jsx",
  "src/routes/dashboardRoutes.jsx",
  "src/routes/routeConstants.js",
];
const routesText = routeFiles.map(read).join("\n");
const navigationText = read("src/utils/navigation.js");
const tournamentCardText = read("src/components/ui/GameCard/TournamentCard.jsx");
const routeGuardsText = read("src/routes/RouteGuards.jsx");
const routeBuilderText = read("src/routes/buildRoutes.jsx");
const accessControlText = read("src/utils/accessControl.js");

// These checks accept either literal strings or shared constants.
// That keeps the smoke test useful even after route cleanup refactors.
const requiredRoutePatterns = [
  ['path: "matches"', "path: DASHBOARD_ROUTE_SEGMENTS.MATCHES"],
  ['path: "matches/:id"', "path: DASHBOARD_ROUTE_SEGMENTS.MATCH_ROOM"],
  ['path: "tournamentDetails/:id"', "path: ROUTES.TOURNAMENT_DETAILS"],
  ['path: "/panelAdmin"', "path: ROUTES.ADMIN_PANEL"],
];

const requiredNavigationPatterns = [
  ['"/dashboard/matches"', "ROUTES.MATCHES"],
  ['"/tournamentDetails"', "ROUTES.TOURNAMENT_DETAILS"],
];

const failures = [];

requiredRoutePatterns.forEach((tokens) => {
  // A route only fails when neither the old literal nor the new shared token
  // exists. This lets the project evolve without weakening the safety check.
  if (!tokens.some((token) => routesText.includes(token))) {
    failures.push(`Missing route token in routes.jsx: ${tokens.join(" or ")}`);
  }
});

requiredNavigationPatterns.forEach((tokens) => {
  if (!tokens.some((token) => navigationText.includes(token))) {
    failures.push(
      `Missing navigation token in navigation.js: ${tokens.join(" or ")}`
    );
  }
});

if (!tournamentCardText.includes("to={`/tournamentDetails/${_id}`}")) {
  failures.push("Tournament card still not linking to /tournamentDetails/:id");
}

if (
  routesText.includes("tournamentDeatils") &&
  !routesText.includes('path: "tournamentDeatils/:id"') &&
  !routesText.includes("path: ROUTES.TOURNAMENT_DETAILS_LEGACY")
) {
  failures.push("Found suspicious 'tournamentDeatils' string outside expected compatibility route.");
}

// Hosting is a player capability, not a fourth role. These checks protect that
// distinction when new organizer routes are introduced later.
if (routeGuardsText.includes('"host"') || routeGuardsText.includes("'host'")) {
  failures.push("Route guards still treat host as a standalone role.");
}

if (!routeBuilderText.includes("approvedHost: ApprovedHostRoute")) {
  failures.push("Approved host capability is missing from route access wrappers.");
}

if (
  !accessControlText.includes(
    "profile?.hostAccess?.status === HOST_ACCESS_STATUSES.APPROVED"
  )
) {
  failures.push("Approved host access no longer checks the profile capability.");
}

if (failures.length > 0) {
  console.error("Route smoke check failed:");
  failures.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

console.log("Route smoke check passed.");
