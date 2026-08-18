import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("player competition routes use only canonical Quick Match clients", async () => {
  const [dashboardRoutes, publicRoutes, registry, gamePage, rootReducer, quickMatchSlice] =
    await Promise.all([
      read("../src/routes/dashboardRoutes.jsx"),
      read("../src/routes/publicRoutes.jsx"),
      read("../src/routes/routeRegistry.jsx"),
      read("../src/pages/Game.jsx"),
      read("../src/store/rootReducer.js"),
      read("../src/store/slices/quickMatchOfferingSlice.js"),
    ]);

  assert.match(dashboardRoutes, /componentKey: "QuickMatchDetails"/);
  assert.match(registry, /pages\/QuickMatchDetails\.jsx/);
  assert.match(gamePage, /fetchPlayerQuickMatchOfferings/);
  assert.match(quickMatchSlice, /path: "\/api\/player\/quick-matches"/);

  const activeSource = [dashboardRoutes, publicRoutes, registry, gamePage, rootReducer].join("\n");
  assert.doesNotMatch(activeSource, /TournamentDetails|tournamentSlice|\/api\/tournaments/);
});

test("legacy Tournament UI modules and routes are absent", async () => {
  const [routeConstants, socketSource, adminSlice] = await Promise.all([
    read("../src/routes/routeConstants.js"),
    read("../src/context/socketContext.jsx"),
    read("../src/store/slices/adminSlice.js"),
  ]);

  assert.doesNotMatch(routeConstants, /tournamentDetails|tournamentDeatils/);
  assert.doesNotMatch(socketSource, /newTournament|updateTournament/);
  assert.doesNotMatch(adminSlice, /findTournaments/);

  for (const path of [
    "../src/pages/TournamentDetails.jsx",
    "../src/pages/TournamentGame.jsx",
    "../src/store/slices/tournamentSlice.js",
    "../src/store/selectors/tournamentSelectors.js",
    "../src/components/ui/GameCard/TournamentCard.jsx",
  ]) {
    await assert.rejects(access(new URL(path, import.meta.url)));
  }
});
