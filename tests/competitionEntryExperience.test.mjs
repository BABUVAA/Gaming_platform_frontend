import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("Quick Match and Event surfaces render compact server-owned progress", async () => {
  const [quickCard, tournamentManager, compete, eventCard, eventManager] = await Promise.all([
    source("../src/components/ui/GameCard/QuickMatchCard.jsx"),
    source("../src/components/adminComponents/QuickMatchOfferingManagement.jsx"),
    source("../src/pages/Game.jsx"),
    source("../src/components/competition/EventCompetitionCard.jsx"),
    source("../src/pages/EventManagerDashboard.jsx"),
  ]);
  assert.match(quickCard, /offering\.joinProgress\?\.joinedParticipants/);
  assert.match(tournamentManager, /Room filling:/);
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

test("paid team entry lets the captain choose payment and reward handling", async () => {
  const [choice, quickPicker, eventPicker] = await Promise.all([
    source("../src/components/competition/TeamPaymentChoice.jsx"),
    source("../src/components/feature/InviteModal.jsx"),
    source("../src/components/competition/EventTeamPicker.jsx"),
  ]);
  assert.match(choice, /captain_pays/);
  assert.match(choice, /Split between team/);
  assert.match(choice, /entryFeeMinor \* teamSize/);
  assert.match(choice, /Keep full reward/);
  assert.match(choice, /Share with team/);
  assert.match(choice, /reimburse_then_split/);
  assert.match(quickPicker, /paymentMode/);
  assert.match(quickPicker, /rewardMode/);
  assert.match(eventPicker, /paymentMode/);
  assert.match(eventPicker, /rewardMode/);
  assert.doesNotMatch(choice, /type="password"/);
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
