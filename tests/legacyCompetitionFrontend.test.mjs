import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("active player competition routes use canonical Quick Match clients", async () => {
  const [dashboardRoutes, registry, gamePage, dashboard, quickMatchSlice] =
    await Promise.all([
      read("../src/routes/dashboardRoutes.jsx"),
      read("../src/routes/routeRegistry.jsx"),
      read("../src/pages/Game.jsx"),
      read("../src/pages/Dashboard.jsx"),
      read("../src/store/slices/quickMatchOfferingSlice.js"),
    ]);

  assert.match(dashboardRoutes, /componentKey: "QuickMatchDetails"/);
  assert.match(registry, /pages\/QuickMatchDetails\.jsx/);
  assert.match(gamePage, /fetchPlayerQuickMatchOfferings/);
  assert.doesNotMatch(dashboard, /loadCatalog/);
  assert.match(quickMatchSlice, /path: "\/api\/player\/quick-matches"/);

  const activeSource = [dashboardRoutes, registry, gamePage, dashboard].join("\n");
  assert.doesNotMatch(activeSource, /\/api\/tournaments|findTournaments/);
});

test("legacy active UI modules are retired while explicit compatibility details remain isolated", async () => {
  const [legacySlice, publicRoutes, socketSource, adminSlice] = await Promise.all([
    read("../src/store/slices/tournamentSlice.js"),
    read("../src/routes/publicRoutes.jsx"),
    read("../src/context/socketContext.jsx"),
    read("../src/store/slices/adminSlice.js"),
  ]);

  assert.match(legacySlice, /\/api\/tournaments\/\$\{resourcePath\}/);
  assert.match(publicRoutes, /ROUTES\.TOURNAMENT_DETAILS_LEGACY/);
  assert.doesNotMatch(legacySlice, /\/api\/tournaments\/offerings/);
  assert.doesNotMatch(socketSource, /newTournament|updateTournament/);
  assert.doesNotMatch(adminSlice, /findTournaments/);

  await assert.rejects(
    access(new URL("../src/pages/TournamentGame.jsx", import.meta.url)),
  );
  await assert.rejects(
    access(
      new URL(
        "../src/components/ui/GameCard/TournamentCard.jsx",
        import.meta.url,
      ),
    ),
  );
});
