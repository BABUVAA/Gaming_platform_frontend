import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("Tournament Manager owns the game-scoped staff workspace", async () => {
  const [routes, guards, registry, dashboard, navigation] = await Promise.all([
    source("../src/routes/staffRoutes.jsx"),
    source("../src/routes/RouteGuards.jsx"),
    source("../src/routes/routeRegistry.jsx"),
    source("../src/pages/StaffDashboard.jsx"),
    source("../src/utils/navigation.js"),
  ]);
  assert.match(routes, /STAFF_ROUTE_SEGMENTS\.TOURNAMENTS[\s\S]*access: "tournamentManager"/);
  assert.match(guards, /assignment\.role === "tournament_manager"/);
  assert.match(registry, /TournamentManagerDashboard/);
  assert.match(dashboard, /title: "Tournament Manager"/);
  assert.match(navigation, /requiredStaffRoles: \["tournament_manager"\]/);
});

test("offering mutations use only the Tournament Manager API", async () => {
  const [slice, page, admin, components] = await Promise.all([
    source("../src/store/slices/quickMatchOfferingSlice.js"),
    source("../src/pages/TournamentManagerDashboard.jsx"),
    source("../src/pages/AdminDashboard.jsx"),
    source("../src/components/index.js"),
  ]);
  assert.match(slice, /\/api\/staff\/tournaments\/games/);
  assert.match(slice, /\/api\/staff\/tournaments\/offerings/);
  assert.doesNotMatch(slice, /\/api\/admin\/quick-match-offerings/);
  assert.match(page, /QuickMatchOfferingManagement/);
  assert.doesNotMatch(admin, /QuickMatchOfferingManagement|Tournament Management/);
  assert.doesNotMatch(components, /TournamentManagement/);
});

test("Tournament Manager uses compact operational offering rows", async () => {
  const management = await source(
    "../src/components/adminComponents/QuickMatchOfferingManagement.jsx",
  );

  assert.match(management, /Room filling:/);
  assert.match(management, /space-y-2/);
  assert.doesNotMatch(management, /JoinProgress|const Detail/);
});

test("Tournament place rewards are configured once and result commands send ranking only", async () => {
  const [management, operations, prizeReview, playerCard] = await Promise.all([
    source("../src/components/adminComponents/QuickMatchOfferingManagement.jsx"),
    source("../src/pages/Operations.jsx"),
    source("../src/components/adminComponents/PrizeReleaseReview.jsx"),
    source("../src/components/ui/GameCard/QuickMatchCard.jsx"),
  ]);
  assert.match(management, /rewardPolicy[\s\S]*placementRewards/);
  assert.match(management, /Each place is a team total/);
  assert.match(operations, /rankingKeys/);
  assert.match(operations, /Match Operator records the complete player or team ranking|Configured place rewards/);
  assert.doesNotMatch(operations, /rankingKeys[\s\S]{0,120}(amountMinor|prizePoolMinor)/);
  assert.match(prizeReview, /#\{winner\.place \|\| 1\}/);
  assert.match(playerCard, /offering\.placementRewards/);
});
