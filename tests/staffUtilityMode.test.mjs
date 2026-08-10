import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  getStaffUtilityRoleLabel,
  isStaffUtilitySummary,
  STAFF_UTILITY_MESSAGE,
} from "../src/utils/staffUtilityMode.js";
import { selectIsStaffUtilityMode } from "../src/store/selectors/playerSelectors.js";
import { getDashboardNavigation } from "../src/utils/navigation.js";

const staffSummary = {
  role: "staff",
  staffAssignments: [{ role: "platform_admin" }],
};

test("staff utility mode is derived only from the server account summary", () => {
  assert.equal(isStaffUtilitySummary(staffSummary), true);
  assert.equal(isStaffUtilitySummary({ role: "player" }), false);
  assert.equal(
    selectIsStaffUtilityMode({ player: { summary: staffSummary } }),
    true,
  );
  assert.equal(getStaffUtilityRoleLabel(staffSummary), "Staff · Platform Admin");
  assert.match(STAFF_UTILITY_MESSAGE, /read-only/i);
});

test("staff navigation keeps safe reads and assigned workspaces without participation tools", () => {
  const navigation = getDashboardNavigation(staffSummary);
  const paths = navigation.map((item) => item.to);

  assert.ok(paths.includes("/staff"));
  assert.ok(paths.includes("/dashboard/tournament"));
  assert.ok(paths.includes("/dashboard/matches"));
  assert.ok(paths.includes("/dashboard/wallet"));
  assert.ok(paths.includes("/dashboard/profile"));
  assert.ok(paths.includes("/dashboard/game-accounts"));
  assert.ok(paths.includes("/dashboard/account-settings"));
  assert.ok(paths.includes("/panelAdmin"));
  assert.ok(paths.includes("/staff/operations"));
  assert.ok(!paths.includes("/dashboard/clan"));
  assert.ok(!paths.includes("/dashboard/chats"));
  assert.ok(!paths.includes("/dashboard/refer"));
});

test("the player dashboard omits staff operation tabs from its utility navigation", () => {
  const navigation = getDashboardNavigation(staffSummary, {
    includeStaffWorkspaces: false,
  });
  const paths = navigation.map((item) => item.to);

  assert.ok(paths.includes("/staff"));
  assert.ok(paths.includes("/dashboard/tournament"));
  assert.ok(!paths.includes("/panelAdmin"));
  assert.ok(!paths.includes("/staff/operations"));
});

test("match operations is owned by the staff route tree", async () => {
  const [constants, staffRoutes, dashboardRoutes] = await Promise.all([
    readFile(new URL("../src/routes/routeConstants.js", import.meta.url), "utf8"),
    readFile(new URL("../src/routes/staffRoutes.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/routes/dashboardRoutes.jsx", import.meta.url), "utf8"),
  ]);

  assert.match(constants, /OPERATIONS: "\/staff\/operations"/);
  assert.match(constants, /OPERATIONS_LEGACY: "\/dashboard\/operations"/);
  assert.match(
    staffRoutes,
    /ROUTES\.OPERATIONS[\s\S]{0,100}componentKey: "Operations"[\s\S]{0,100}access: "operator"/,
  );
  assert.match(
    dashboardRoutes,
    /DASHBOARD_ROUTE_SEGMENTS\.OPERATIONS[\s\S]{0,240}Navigate to=\{ROUTES\.OPERATIONS\} replace/,
  );
  assert.doesNotMatch(
    dashboardRoutes,
    /DASHBOARD_ROUTE_SEGMENTS\.OPERATIONS[\s\S]{0,180}componentKey: "Operations"/,
  );
});

test("staff access oversight excludes hiring and remains governance-only", async () => {
  const [staffPage, staffRoutes] = await Promise.all([
    readFile(new URL("../src/pages/StaffAccessControl.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/routes/staffRoutes.jsx", import.meta.url), "utf8"),
  ]);

  assert.match(staffPage, /RoleManagement showStaffingActions=\{false\}/);
  assert.match(
    staffRoutes,
    /ROUTES\.STAFF_ACCESS_CONTROL[\s\S]{0,140}access: "admin"/,
  );
});

test("route ownership keeps safe staff views separate from participation-only pages", async () => {
  const source = await readFile(
    new URL("../src/routes/dashboardRoutes.jsx", import.meta.url),
    "utf8",
  );

  for (const segment of [
    "GAME",
    "TOURNAMENT",
    "MATCHES",
    "MATCH_ROOM",
    "TOURNAMENT_GAME",
    "TOURNAMENT_OFFERING_DETAILS",
    "PROFILE",
    "GAME_ACCOUNTS",
    "ACCOUNT_SETTINGS",
    "CHANGE_PASSWORD",
    "WALLET",
  ]) {
    assert.match(
      source,
      new RegExp(`DASHBOARD_ROUTE_SEGMENTS\\.${segment}[\\s\\S]{0,180}access: \"(?:dashboardViewer|verifiedDashboardViewer|detailedDashboardViewer|verifiedDetailedDashboardViewer)\"`),
    );
  }

  for (const segment of ["CHATS", "CLAN", "REFER"]) {
    assert.match(
      source,
      new RegExp(`DASHBOARD_ROUTE_SEGMENTS\\.${segment}[\\s\\S]{0,180}access: \"(?:verifiedDetailed|verified|detailed)Player\"`),
    );
  }
});
