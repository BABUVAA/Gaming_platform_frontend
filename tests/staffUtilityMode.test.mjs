import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  getStaffUtilityRoleLabel,
  isStaffUtilitySummary,
  STAFF_UTILITY_MESSAGE,
} from "../src/utils/staffUtilityMode.js";
import { selectIsStaffUtilityMode } from "../src/store/selectors/playerSelectors.js";
import {
  getDashboardNavigation,
  getStaffWorkspaceNavigation,
} from "../src/utils/navigation.js";

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
  assert.ok(paths.includes("/dashboard/game"));
  assert.ok(!paths.includes("/dashboard/tournament"));
  assert.ok(!paths.includes("/dashboard/events"));
  assert.ok(paths.includes("/dashboard/matches"));
  assert.ok(paths.includes("/dashboard/wallet"));
  assert.ok(paths.includes("/dashboard/profile"));
  assert.ok(paths.includes("/dashboard/game-accounts"));
  assert.ok(paths.includes("/dashboard/account-settings"));
  assert.ok(paths.includes("/panelAdmin"));
  assert.ok(paths.includes("/staff/operations"));
  assert.ok(!paths.includes("/dashboard/clan"));
  assert.ok(!paths.includes("/dashboard/friends"));
  assert.ok(!paths.includes("/dashboard/chats"));
  assert.ok(!paths.includes("/dashboard/refer"));
});

test("the player dashboard omits staff operation tabs from its utility navigation", () => {
  const navigation = getDashboardNavigation(staffSummary, {
    includeStaffWorkspaces: false,
  });
  const paths = navigation.map((item) => item.to);

  assert.ok(paths.includes("/staff"));
  assert.ok(paths.includes("/dashboard/game"));
  assert.ok(!paths.includes("/dashboard/tournament"));
  assert.ok(!paths.includes("/panelAdmin"));
  assert.ok(!paths.includes("/staff/operations"));
});

test("staff navigation shows only the chooser, selected dashboard, and its tabs", () => {
  const multiRoleStaff = {
    role: "staff",
    staffAssignments: [
      { role: "event_manager" },
      { role: "game_manager" },
      { role: "match_operator" },
    ],
  };
  const chooser = getStaffWorkspaceNavigation(multiRoleStaff, "/staff");
  const gameWorkspace = getStaffWorkspaceNavigation(
    multiRoleStaff,
    "/staff/games",
  );

  assert.deepEqual(chooser.map((item) => item.to), ["/staff"]);
  assert.deepEqual(
    gameWorkspace
      .filter((item) => item.navigationKind !== "tab")
      .map((item) => item.to),
    ["/staff", "/staff/games"],
  );
  assert.equal(gameWorkspace[1].label, "Game Manager dashboard");
  assert.deepEqual(
    gameWorkspace
      .filter((item) => item.navigationKind === "tab")
      .map((item) => item.id),
    [
      "overview",
      "rooms",
      "events",
      "attention",
      "operators",
      "verification",
      "history",
    ],
  );
  assert.ok(!gameWorkspace.some((item) => item.to === "/staff/events"));
  assert.ok(!gameWorkspace.some((item) => item.to === "/staff/operations"));
});

test("mobile player navigation uses compact account labels", () => {
  const navigation = getDashboardNavigation({ role: "player" });
  const paths = navigation.map((item) => item.to);
  const referAndEarn = navigation.find(
    (item) => item.to === "/dashboard/refer",
  );
  const gameAccounts = navigation.find(
    (item) => item.to === "/dashboard/game-accounts",
  );
  const accountSettings = navigation.find(
    (item) => item.to === "/dashboard/account-settings",
  );

  assert.equal(gameAccounts?.label, "Game Accounts");
  assert.equal(gameAccounts?.mobileLabel, "Games");
  assert.equal(accountSettings?.label, "Account Settings");
  assert.equal(accountSettings?.mobileLabel, "Settings");
  assert.equal(referAndEarn?.label, "Refer & Earn");
  assert.equal(referAndEarn?.mobileLabel, "Earn");
  assert.ok(paths.includes("/dashboard/friends"));
  assert.ok(paths.includes("/dashboard/refer"));
  assert.ok(
    paths.indexOf("/dashboard/friends") < paths.indexOf("/dashboard/teams"),
  );
});

test("mobile dashboard keeps five requested primary actions and moves the full list into the menu", async () => {
  const navigation = getDashboardNavigation({ role: "player" });
  const primaryPaths = navigation
    .filter((item) => item.mobilePrimary)
    .sort((left, right) => left.mobileOrder - right.mobileOrder)
    .map((item) => item.to);
  const [sidebar, burgerMenu] = await Promise.all([
    readFile(
      new URL("../src/components/layout/Sidebar/SideBar.jsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../src/components/layout/Header/HeaderBurgerMenu.jsx", import.meta.url),
      "utf8",
    ),
  ]);

  assert.deepEqual(primaryPaths, [
    "/dashboard",
    "/dashboard/clan",
    "/dashboard/profile",
    "/dashboard/wallet",
    "/dashboard/chats",
  ]);
  assert.match(sidebar, /dashboardNavigation\.filter\([\s\S]{0,80}mobilePrimary/);
  assert.match(burgerMenu, /All player areas/);
  assert.match(burgerMenu, /dashboardNavigation\.map/);
  assert.match(burgerMenu, /aria-expanded=\{menuOpen\}/);
});

test("Friends is a player-owned main route instead of a Clan subtab", async () => {
  const [constants, routes, registry, clan, friends] = await Promise.all([
    readFile(new URL("../src/routes/routeConstants.js", import.meta.url), "utf8"),
    readFile(new URL("../src/routes/dashboardRoutes.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/routes/routeRegistry.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/Clan.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/Friends.jsx", import.meta.url), "utf8"),
  ]);

  assert.match(constants, /FRIENDS: "\/dashboard\/friends"/);
  assert.match(
    routes,
    /DASHBOARD_ROUTE_SEGMENTS\.FRIENDS[\s\S]{0,120}componentKey: "Friends"[\s\S]{0,120}access: "verifiedPlayer"/,
  );
  assert.match(registry, /Friends: lazy\(\(\) => import\("\.\.\/pages\/Friends\.jsx"\)\)/);
  assert.match(friends, /fetchSocialConnections/);
  assert.match(friends, /searchPlayer/);
  assert.doesNotMatch(clan, /fetchSocialConnections|id: "social"/);
});

test("Game Accounts omits dashboard statistics", async () => {
  const source = await readFile(
    new URL("../src/pages/GameAccounts.jsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(
    source,
    /Linked Accounts|Pending Reviews|availableGames\.length\} Live/,
  );
  assert.doesNotMatch(source, /<h1[^>]*>Game Accounts<\/h1>/);
  assert.doesNotMatch(source, /Reconnect Account|Resubmit for Review/);
  assert.match(source, /status === "verified"/);
  assert.match(source, /account\.replacement\?\.allowed/);
  assert.match(source, /Change account/);
  assert.match(source, /Account change used/);
  assert.match(source, /status === "pending"/);
  assert.match(source, /Under review/);
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
    /STAFF_ROUTE_SEGMENTS\.OPERATIONS[\s\S]{0,100}componentKey: "Operations"[\s\S]{0,100}access: "operator"/,
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
    /STAFF_ROUTE_SEGMENTS\.ACCESS_CONTROL[\s\S]{0,140}access: "admin"/,
  );
});

test("staff workspaces share a player-style responsive shell", async () => {
  const [layout, sidebar, routes] = await Promise.all([
    readFile(new URL("../src/pages/StaffLayout.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/layout/StaffSidebar/StaffSideBar.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/routes/staffRoutes.jsx", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /md:grid-cols-\[16rem_minmax\(0,1fr\)\]/);
  assert.match(layout, /<StaffSideBar \/>/);
  assert.match(layout, /<Outlet \/>/);
  assert.match(sidebar, /getStaffWorkspaceNavigation/);
  assert.match(sidebar, /workspaceTabs\.map/);
  assert.match(sidebar, /new URLSearchParams\(location\.search\)/);
  assert.match(sidebar, /fixed inset-x-0 bottom-0/);
  assert.match(sidebar, /md:fixed md:bottom-0/);
  assert.match(sidebar, /md:left-\[max\(0px,calc\(\(100vw-1600px\)\/2\)\)\]/);
  assert.match(routes, /componentKey: "StaffLayout"[\s\S]*children:/);
});

test("desktop dashboard sidebars stay fixed while content keeps its grid column", async () => {
  const [playerSidebar, playerLayout, staffLayout, adminLayout] =
    await Promise.all([
      readFile(
        new URL(
          "../src/components/layout/Sidebar/SideBar.jsx",
          import.meta.url,
        ),
        "utf8",
      ),
      readFile(new URL("../src/pages/Dashboard.jsx", import.meta.url), "utf8"),
      readFile(new URL("../src/pages/StaffLayout.jsx", import.meta.url), "utf8"),
      readFile(
        new URL("../src/pages/AdminDashboard.jsx", import.meta.url),
        "utf8",
      ),
    ]);

  assert.match(playerSidebar, /md:fixed md:bottom-0/);
  assert.match(playerLayout, /md:col-start-2/);
  assert.match(staffLayout, /md:col-start-2/);
  assert.match(adminLayout, /md:fixed md:bottom-0/);
  assert.match(adminLayout, /md:col-start-2/);
});

test("each operational role dashboard separates its responsibilities", async () => {
  const [tournaments, events, games, operations, navigation] = await Promise.all([
    readFile(new URL("../src/components/adminComponents/QuickMatchOfferingManagement.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/EventManagerDashboard.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/GameManagerDashboard.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/Operations.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/utils/navigation.js", import.meta.url), "utf8"),
  ]);

  assert.match(navigation, /Overview[\s\S]*Create[\s\S]*Drafts & paused[\s\S]*Live tournaments[\s\S]*History/);
  assert.match(navigation, /Templates[\s\S]*Invitations[\s\S]*Results & rewards[\s\S]*Events/);
  assert.match(navigation, /Overview[\s\S]*Rooms & schedules[\s\S]*Events[\s\S]*Attention[\s\S]*Operators[\s\S]*Account verification[\s\S]*History/);
  assert.match(navigation, /Active rooms[\s\S]*Full rooms[\s\S]*Assigned matches/);
  for (const dashboard of [tournaments, events, games, operations]) {
    assert.match(dashboard, /useStaffWorkspaceTab/);
  }
  assert.doesNotMatch(tournaments, /Tournament Manager responsibilities/);
  assert.doesNotMatch(events, /Event Manager sections/);
  assert.doesNotMatch(games, /Game Manager responsibilities/);
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

  for (const segment of ["CHATS", "CLAN", "FRIENDS", "REFER"]) {
    assert.match(
      source,
      new RegExp(`DASHBOARD_ROUTE_SEGMENTS\\.${segment}[\\s\\S]{0,180}access: \"(?:verifiedDetailed|verified|detailed)Player\"`),
    );
  }
});
