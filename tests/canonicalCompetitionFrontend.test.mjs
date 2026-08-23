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

test("Compete renders Events and Quick Matches as compact two-column poster cards", async () => {
  const [gamePage, eventCard] = await Promise.all([
    read("../src/pages/Game.jsx"),
    read("../src/components/competition/EventCompetitionCard.jsx"),
  ]);

  assert.match(gamePage, /filteredTournaments\.map\(\(tournament\)/);
  assert.match(gamePage, /grid-cols-1 gap-4 sm:grid-cols-2/);
  assert.match(gamePage, /src=\{presentation\.image\}/);
  assert.match(gamePage, /absolute inset-0 bg-\[linear-gradient/);
  assert.match(gamePage, /Mode · \{tournament\.mode\}/);
  assert.match(gamePage, /Capacity/);
  assert.match(gamePage, /% full/);
  assert.match(gamePage, /placementRewards/);
  assert.match(eventCard, /src=\{presentation\.image\}/);
  assert.match(eventCard, /absolute inset-0 bg-\[linear-gradient/);
  assert.match(eventCard, /min-h-\[18rem\]/);
  assert.match(eventCard, /"Join Event"/);
  assert.doesNotMatch(gamePage, /Ready, \$\{username\}|selectPlayerSummary/);
  assert.ok(
    gamePage.indexOf("Choose your game") <
      gamePage.indexOf("Events for the selected game"),
  );
  assert.ok(
    gamePage.indexOf("Events for the selected game") <
      gamePage.indexOf("Tournaments for the selected game"),
  );
  assert.doesNotMatch(gamePage, /SpotlightTournament/);
});
