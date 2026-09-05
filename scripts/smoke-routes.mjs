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
const competeText = read("src/pages/Game.jsx");
const verificationDialogText = read(
  "src/components/common/EmailVerificationDialog.jsx"
);
const routeGuardsText = read("src/routes/RouteGuards.jsx");
const routeBuilderText = read("src/routes/buildRoutes.jsx");
const accessControlText = read("src/utils/accessControl.js");
const playerSliceText = read("src/store/slices/playerSlice.js");

// These checks accept either literal strings or shared constants.
// That keeps the smoke test useful even after route cleanup refactors.
const requiredRoutePatterns = [
  ['path: "matches"', "path: DASHBOARD_ROUTE_SEGMENTS.MATCHES"],
  ['path: "matches/:id"', "path: DASHBOARD_ROUTE_SEGMENTS.MATCH_ROOM"],
  [
    'path: "tournaments/offering/:id"',
    "path: DASHBOARD_ROUTE_SEGMENTS.TOURNAMENT_OFFERING_DETAILS",
  ],
  ['path: "/panelAdmin"', "path: ROUTES.ADMIN_PANEL"],
  ['path: "change-password"', "path: DASHBOARD_ROUTE_SEGMENTS.CHANGE_PASSWORD"],
];

const requiredNavigationPatterns = [
  ['"/dashboard/matches"', "ROUTES.MATCHES"],
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

if (
  !competeText.includes("offeringId={teamPickerOffering._id}") ||
  !competeText.includes("buildTournamentOfferingPath(tournament._id)")
) {
  failures.push("Quick Match cards no longer use the canonical queue/detail boundary.");
}

// Hosting is a player capability, not a fourth role. These checks protect that
// distinction when new organizer routes are introduced later.
if (routeGuardsText.includes('"host"') || routeGuardsText.includes("'host'")) {
  failures.push("Route guards still treat host as a standalone role.");
}

if (!routeBuilderText.includes("approvedHost: ApprovedHostRoute")) {
  failures.push("Approved host capability is missing from route access wrappers.");
}

if (!routeBuilderText.includes("verifiedPlayer: VerifiedPlayerRoute")) {
  failures.push("Verified player access is missing from route access wrappers.");
}

if (
  !routeBuilderText.includes(
    "verifiedDetailedPlayer: VerifiedDetailedPlayerRoute"
  )
) {
  failures.push("Verified detailed-player access is missing from route wrappers.");
}

if (
  !routeGuardsText.includes("loadSummary()") ||
  !playerSliceText.includes('path: "/api/users/summary"')
) {
  failures.push("Dashboard access no longer uses the lightweight player summary.");
}

if (
  !routeGuardsText.includes("const VerifiedAccountGate") ||
  !routeGuardsText.includes("<EmailVerificationDialog />")
) {
  failures.push("Unverified players no longer receive the blocking dialog.");
}

if (
  !verificationDialogText.includes("ROUTES.ACCOUNT_SETTINGS") ||
  !verificationDialogText.includes("ROUTES.GAME")
) {
  failures.push("Verification dialog actions no longer use safe routes.");
}

const verifiedDashboardRouteCount = (
  routesText.match(
    /access: "verified(?:Detailed)?(?:Player|DashboardViewer)"/g,
  ) || []
).length;

if (verifiedDashboardRouteCount < 9) {
  failures.push("One or more verified-only dashboard routes lost their guard.");
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
