import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("Quick Match and Event surfaces render server-owned live progress", async () => {
  const [quickCard, tournamentManager, compete, eventCard, eventManager] = await Promise.all([
    source("../src/components/ui/GameCard/QuickMatchCard.jsx"),
    source("../src/components/adminComponents/QuickMatchOfferingManagement.jsx"),
    source("../src/pages/Game.jsx"),
    source("../src/components/competition/EventCompetitionCard.jsx"),
    source("../src/pages/EventManagerDashboard.jsx"),
  ]);
  assert.match(quickCard, /offering\.joinProgress\?\.joinedParticipants/);
  assert.match(tournamentManager, /Live seat progress/);
  assert.match(tournamentManager, /fetchQuickMatchOfferings\(\).*5000|5000/);
  assert.match(compete, /joinedCount: offering\.joinProgress\?\.joinedParticipants/);
  assert.match(eventCard, /Registration progress/);
  assert.match(eventManager, /item\.registrationSummary\?\.registeredCount/);
});

test("competition entry confirmation discloses wallet hold and never requests a password", async () => {
  const [dialog, quickCard, compete, eventDetails] = await Promise.all([
    source("../src/components/competition/CompetitionEntryDialog.jsx"),
    source("../src/components/ui/GameCard/QuickMatchCard.jsx"),
    source("../src/pages/Game.jsx"),
    source("../src/pages/EventDetails.jsx"),
  ]);
  assert.match(dialog, /Available balance to Entry held/);
  assert.match(dialog, /No password is required/);
  assert.doesNotMatch(dialog, /type="password"|current-password/);
  assert.match(quickCard, /CompetitionEntryDialog/);
  assert.match(compete, /Proceed & register/);
  assert.match(eventDetails, /Proceed & register/);
  assert.doesNotMatch(`${compete}\n${eventDetails}`, /globalThis\.confirm/);
});

test("mobile authentication opens as a bottom sheet before the desktop marketing panel", async () => {
  const authShell = await source("../src/components/common/AuthShell.jsx");
  assert.match(authShell, /hidden[^"]*lg:block/);
  assert.match(authShell, /items-end/);
  assert.match(authShell, /rounded-t-\[28px\]/);
  assert.match(authShell, /border-b-0/);
  assert.match(authShell, /sm:rounded-\[28px\]/);
  assert.match(authShell, /backdrop-blur-xl/);
});
