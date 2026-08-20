import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { canReviewEventProposal } from "../src/utils/eventReviewPolicy.js";
import { configureStore } from "@reduxjs/toolkit";
import api from "../src/api/axios-api.js";
import eventRegistrationReducer, {
  fetchPlayerEventStandings,
  fetchPlayerEvents,
  registerForEvent,
  selectEventProgression,
} from "../src/store/slices/eventRegistrationSlice.js";
import eventInvitationSlice, {
  fetchEventInvitations,
  fetchInvitationRuns,
  inviteEventPlayers,
  revokeEventInvitation,
  searchInvitationCandidates,
} from "../src/store/slices/eventInvitationSlice.js";
import eventStageSlice, {
  cancelEventStageGeneration,
  closeEventRegistration,
  fetchEventExecutionRuns,
  fetchEventStages,
  fetchAdminEventStandings,
  retryEventStageAdvancement,
  retryEventStageGeneration,
} from "../src/store/slices/eventStageSlice.js";
import eventManagementSlice, {
  createManagedEventRun,
  fetchManagedEventMatches,
  fetchManagedEventOperations,
  fetchManagedEventRegistrations,
} from "../src/store/slices/eventManagementSlice.js";
import eventStageAdjustmentSlice, {
  fetchManagedStageAdjustments,
  fetchStageAdjustmentReviewQueue,
  proposeManagedStageAdjustment,
  reviewStageAdjustment,
} from "../src/store/slices/eventStageAdjustmentSlice.js";
import eventRoundPlanSlice, {
  fetchEventRoundPlanQueue,
  proposeEventRoundPlan,
  reviewEventRoundPlan,
} from "../src/store/slices/eventRoundPlanSlice.js";

const response = (config, data) => ({
  config,
  data,
  headers: {},
  status: 200,
  statusText: "OK",
});

const decodeBody = (config) =>
  typeof config.data === "string" ? JSON.parse(config.data) : config.data;

test("player Event discovery and committed registration use canonical routes", async () => {
  const originalAdapter = api.defaults.adapter;
  const requests = [];
  const event = {
    id: "event-run-1",
    registration: {
      capacity: 4,
      mine: null,
      registeredCount: 1,
      waitlistedCount: 0,
    },
  };
  api.defaults.adapter = async (config) => {
    requests.push(config);
    if (config.method === "get") {
      return response(config, { data: { events: [event] } });
    }
    if (config.method === "post") {
      return response(config, {
        data: {
          registration: { id: "registration-1", status: "registered" },
        },
      });
    }
    throw new Error(`Unexpected ${config.method} request`);
  };

  try {
    const store = configureStore({
      reducer: {
        eventRegistration: eventRegistrationReducer,
        player: (state = { summary: { role: "player" } }) => state,
      },
    });
    await store.dispatch(fetchPlayerEvents());
    await store.dispatch(registerForEvent("event-run-1"));

    assert.deepEqual(
      requests.map(({ method, url }) => [method, url]),
      [
        ["get", "/api/player/events"],
        ["post", "/api/player/events/event-run-1/register"],
        ["get", "/api/player/events"],
      ],
    );
    assert.deepEqual(decodeBody(requests[1]), {});
    assert.equal(store.getState().eventRegistration.status, "succeeded");
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("staff Event registration is blocked before mutation transport", async () => {
  const originalAdapter = api.defaults.adapter;
  let requestCount = 0;
  api.defaults.adapter = async (config) => {
    requestCount += 1;
    return response(config, { data: {} });
  };

  try {
    const store = configureStore({
      reducer: {
        eventRegistration: eventRegistrationReducer,
        player: (state = { summary: { role: "staff" } }) => state,
      },
    });
    const registerAction = await store.dispatch(registerForEvent("run-1"));

    assert.equal(registerAction.meta.condition, true);
    assert.equal(requestCount, 0);
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("player Event UI exposes no registration cancellation transport", async () => {
  const [pageSource, sliceSource] = await Promise.all([
    readFile(new URL("../src/pages/Events.jsx", import.meta.url), "utf8"),
    readFile(
      new URL("../src/store/slices/eventRegistrationSlice.js", import.meta.url),
      "utf8",
    ),
  ]);

  assert.match(pageSource, /Registration committed/);
  assert.match(pageSource, /Event registration is final and cannot be cancelled/);
  assert.match(pageSource, /globalThis\.confirm/);
  assert.doesNotMatch(`${pageSource}\n${sliceSource}`, /cancelEventRegistration|Cancel \$\{mine\.status\}/);
  assert.doesNotMatch(sliceSource, /method: "delete"/);
});

test("Platform Admin invitation runs, candidates, list, invite, and revoke use bounded contracts", async () => {
  const originalAdapter = api.defaults.adapter;
  const requests = [];
  const activeInvitation = {
    id: "invitation-1",
    player: { id: "64f000000000000000000001", username: "Player One" },
    status: "active",
  };
  api.defaults.adapter = async (config) => {
    requests.push(config);
    if (config.url === "/api/admin/events/invitation-runs") {
      return response(config, {
        data: {
          nextCursor: "next-run-page",
          runs: [{ id: "run-1", title: "Invitational" }],
        },
      });
    }
    if (config.url.endsWith("/invitation-candidates")) {
      return response(config, {
        data: { players: [activeInvitation.player] },
      });
    }
    if (config.method === "get") {
      return response(config, { data: { invitations: [activeInvitation] } });
    }
    if (config.method === "post") {
      return response(config, { data: { invitations: [activeInvitation] } });
    }
    return response(config, {
      data: { invitation: { id: "invitation-1", status: "revoked" } },
    });
  };

  try {
    const store = configureStore({
      reducer: { eventInvitations: eventInvitationSlice.reducer },
    });
    const runId = "64e000000000000000000001";
    const playerIds = ["64f000000000000000000001"];
    await store.dispatch(fetchInvitationRuns());
    await store.dispatch(
      searchInvitationCandidates({ runId, search: "Player" }),
    );
    await store.dispatch(fetchEventInvitations({ runId }));
    await store.dispatch(inviteEventPlayers({ playerIds, runId }));
    await store.dispatch(
      revokeEventInvitation({ invitationId: "invitation-1", runId }),
    );

    assert.deepEqual(
      requests.map(({ method, url }) => [method, url]),
      [
        ["get", "/api/admin/events/invitation-runs"],
        [
          "get",
          `/api/admin/events/runs/${runId}/invitation-candidates`,
        ],
        ["get", `/api/admin/events/runs/${runId}/invitations`],
        ["post", `/api/admin/events/runs/${runId}/invitations`],
        [
          "delete",
          `/api/admin/events/runs/${runId}/invitations/invitation-1`,
        ],
      ],
    );
    assert.deepEqual(requests[0].params, { limit: 25 });
    assert.deepEqual(requests[1].params, { limit: 20, search: "Player" });
    assert.deepEqual(requests[2].params, { limit: 50 });
    assert.deepEqual(decodeBody(requests[3]), { playerIds });
    assert.equal(requests[4].data, undefined);
    assert.equal(
      store.getState().eventInvitations.invitationsByRunId[runId][0].status,
      "revoked",
    );
    assert.equal(
      store.getState().eventInvitations.invitationsByRunId[runId][0].player
        .username,
      "Player One",
    );
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("Event governance and Compete UI disclose authoritative entry terms without accepting a fee", async () => {
  const [reviewSource, invitationSource, navigationSource, playerSource, competeSource] = await Promise.all([
    readFile(
      new URL(
        "../src/components/adminComponents/EventReviewQueue.jsx",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../src/components/adminComponents/EventInvitationManagement.jsx",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(new URL("../src/utils/navigation.js", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/Events.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/Game.jsx", import.meta.url), "utf8"),
  ]);

  for (const field of [
    "registrationOpensAt",
    "registrationClosesAt",
    "admissionPolicy",
    "registrationCapacity",
    "waitlistEnabled",
    "formatSnapshot",
    "templateRevision",
    "gameKey",
    "entryTerms",
    "entryFeeMinor",
  ]) {
    assert.match(reviewSource, new RegExp(field));
  }
  assert.match(invitationSource, /Search eligible players/);
  assert.match(invitationSource, /bounded to 20/);
  assert.doesNotMatch(invitationSource, /findUsers|\/api\/admin\/findUsers/);
  assert.match(reviewSource, /Independent review required/);
  assert.match(reviewSource, /Another admin reviews/);
  assert.match(reviewSource, /aria-label="Event Management sections"/);
  assert.match(reviewSource, /label="Approvals"/);
  assert.match(reviewSource, /label="Invitations"/);
  assert.match(reviewSource, /label="Operations & Reports"/);
  assert.match(reviewSource, /activeView === "approvals"/);
  assert.match(reviewSource, /canReviewEventProposal\(\{ currentUser, item \}\)/);
  assert.match(reviewSource, /if \(!selected \|\| !canReview\(selected\.item\)\) return/);
  assert.doesNotMatch(navigationSource, /label: "Events"|label: "Tournaments"/);
  assert.match(competeSource, /fetchPlayerEvents/);
  assert.match(competeSource, /EventCompetitionCard/);
  assert.match(playerSource, /test money/);
  assert.match(playerSource, /Hold fee and register/);
  assert.match(playerSource, /paidEntryAvailable === false/);
  assert.doesNotMatch(playerSource, /amountMinor|entryFeeMinor[\s\S]*registerForEvent\([^)]*,/);
});

test("Event creation omits round rules and post-registration setup owns the reviewed plan", async () => {
  const [source, planSource] = await Promise.all([
    readFile(new URL("../src/pages/EventManagerDashboard.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/eventManagement/PostRegistrationRoundPlan.jsx", import.meta.url), "utf8"),
  ]);

  for (const field of [
    "entryTerms",
    "entryFeeMinor",
    "entryPolicy",
    "entryFeeRupees",
  ]) {
    assert.match(source, new RegExp(field));
  }
  assert.doesNotMatch(source, /executionPlan:/);
  assert.match(planSource, /registration_closed/);
  assert.match(planSource, /registrationSummary\?\.registeredCount/);
  assert.match(planSource, /format: "ranked_stages"/);
  assert.doesNotMatch(planSource, /playerIds|seedingSeed/);
  assert.match(source, /selectedRunTemplate\?\.teamSize > 1/);
  assert.match(planSource, /participantsPerMatch/);
  assert.match(planSource, /advanceCount/);
  assert.match(source, /Team Event execution is not available yet/);
  assert.match(source, /toInrMinorUnits/);
  assert.match(source, /no more than two decimal places/);
  const [templateDraftSection, runDraftSection] = source.split(
    "onSubmit={saveRun}",
  );
  assert.doesNotMatch(
    templateDraftSection,
    /disabled=\{teamExecutionUnsupported\}/,
  );
  assert.match(
    runDraftSection,
    /disabled=\{teamExecutionUnsupported \|\| entryFeeInvalid\}/,
  );
  assert.doesNotMatch(source, /participantIds|seedingSeed|createBatch|close-registration/);
});

test("Event Manager separates reusable Templates from dated Events", async () => {
  const [source, operationsSource] = await Promise.all([
    readFile(new URL("../src/pages/EventManagerDashboard.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/eventManagement/EventManagerOperations.jsx", import.meta.url), "utf8"),
  ]);

  assert.match(source, /const \[activeTab, setActiveTab\] = useState\("templates"\)/);
  assert.match(source, /aria-label="Event Manager sections"/);
  assert.match(source, />Templates</);
  assert.match(source, />Events</);
  assert.match(source, /lg:grid-cols-\[15rem_minmax\(0,1fr\)\]/);
  assert.match(source, /Approve a Template/);
  assert.match(source, /Create Events from it/);
  assert.doesNotMatch(source, /Competition operations/);
  assert.match(source, /activeTab === "templates"/);
  assert.match(source, /Template name/);
  assert.match(source, /Event name/);
  assert.match(source, /View details/);
  assert.match(operationsSource, /Player entries/);
  assert.match(operationsSource, /Generated Match rooms/);
  assert.match(operationsSource, /Load more registrations/);
  assert.match(operationsSource, /Load more Matches/);
  assert.doesNotMatch(operationsSource, /email|roomPassword|roomCode|wallet/);
});

test("Event Manager operational reads are scoped, bounded, and paginated", async () => {
  const originalAdapter = api.defaults.adapter;
  const requests = [];
  api.defaults.adapter = async (config) => {
    requests.push(config);
    if (config.url.endsWith("/operations")) {
      return response(config, { data: { run: { id: "run-1", title: "Event" }, summary: {} } });
    }
    if (config.url.endsWith("/registrations")) {
      const cursor = config.params?.cursor;
      return response(config, {
        data: {
          items: [{ id: cursor ? "registration-2" : "registration-1", player: { profileTag: "PLAYER", username: "Player" }, status: "registered" }],
          page: { nextCursor: cursor ? null : "registration-cursor" },
        },
      });
    }
    return response(config, {
      data: {
        items: [{ batch: { id: "batch-1", ordinal: 1, participantCount: 100 }, match: { id: "match-1", status: "live" }, stage: { number: 1 } }],
        page: { nextCursor: null },
      },
    });
  };

  try {
    const store = configureStore({ reducer: { eventManagement: eventManagementSlice.reducer } });
    await store.dispatch(fetchManagedEventOperations("run-1"));
    await store.dispatch(fetchManagedEventRegistrations({ runId: "run-1", status: "registered" }));
    await store.dispatch(fetchManagedEventRegistrations({ cursor: "registration-cursor", runId: "run-1", status: "registered" }));
    await store.dispatch(fetchManagedEventMatches({ runId: "run-1" }));

    assert.deepEqual(requests.map(({ method, url }) => [method, url]), [
      ["get", "/api/staff/events/runs/run-1/operations"],
      ["get", "/api/staff/events/runs/run-1/registrations"],
      ["get", "/api/staff/events/runs/run-1/registrations"],
      ["get", "/api/staff/events/runs/run-1/matches"],
    ]);
    assert.deepEqual(requests[1].params, { limit: 25, status: "registered" });
    assert.deepEqual(requests[2].params, { cursor: "registration-cursor", limit: 25, status: "registered" });
    assert.deepEqual(store.getState().eventManagement.registrationsByRunId["run-1"].items.map(({ id }) => id), ["registration-1", "registration-2"]);
    assert.equal(store.getState().eventManagement.matchesByRunId["run-1"].items[0].match.status, "live");
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("Event Manager Run draft sends timing, admission, entry, and rewards without round rules", async () => {
  const originalAdapter = api.defaults.adapter;
  let request;
  const payload = {
    admissionPolicy: "open",
    registrationCapacity: 16,
    entryTerms: {
      currency: "INR",
      entryFeeMinor: 200,
      policy: "paid",
    },
    rewardTerms: {
      currency: "INR",
      placements: [{ place: 1, amountMinor: 5000 }, { place: 2, amountMinor: 2500 }],
    },
    registrationClosesAt: "2026-09-01T10:00",
    registrationOpensAt: "2026-08-20T10:00",
    startsAt: "2026-09-01T11:00",
    templateId: "template-1",
    title: "Solo finals",
    waitlistEnabled: false,
  };
  api.defaults.adapter = async (config) => {
    request = config;
    return response(config, { data: { run: { _id: "run-1", ...payload } } });
  };

  try {
    const store = configureStore({
      reducer: { eventManagement: eventManagementSlice.reducer },
    });
    await store.dispatch(createManagedEventRun(payload));

    assert.equal(request.method, "post");
    assert.equal(request.url, "/api/staff/events/runs");
    assert.deepEqual(decodeBody(request), payload);
    assert.equal("formatSnapshot" in decodeBody(request), false);
    assert.equal("executionPlan" in decodeBody(request), false);
    assert.deepEqual(decodeBody(request).entryTerms, {
      currency: "INR",
      entryFeeMinor: 200,
      policy: "paid",
    });
    assert.deepEqual(decodeBody(request).rewardTerms.placements, [{ place: 1, amountMinor: 5000 }, { place: 2, amountMinor: 2500 }]);
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("Platform Admin stage read and idempotent close use server-owned empty-body contracts", async () => {
  const originalAdapter = api.defaults.adapter;
  const requests = [];
  const runId = "64e000000000000000000099";
  const stage = {
    id: "stage-1",
    batches: [],
    number: 1,
    status: "scheduled",
  };
  api.defaults.adapter = async (config) => {
    requests.push(config);
    if (config.url === "/api/admin/events/execution-runs") {
      return response(config, {
        data: { nextCursor: "next-run", runs: [{ id: runId, status: "scheduled" }] },
      });
    }
    if (config.url.endsWith("/stages") && config.method === "get") {
      return response(config, {
        data: {
          generation: { retryAvailable: true, status: "failed" },
          run: { id: runId, status: "registration_closed" },
          stages: [],
        },
      });
    }
    if (config.url.endsWith("/stages/retry")) {
      return response(config, { data: { claimed: true, completed: true } });
    }
    if (config.url.endsWith("/cancel-generation")) {
      return response(config, {
        data: {
          alreadyCancelled: false,
          run: { id: runId, status: "cancelled" },
        },
      });
    }
    return response(config, {
      data: {
        alreadyGenerated: false,
        run: { id: runId, rosterCount: 4, status: "in_progress" },
        stage,
      },
    });
  };

  try {
    const store = configureStore({
      reducer: { eventStages: eventStageSlice.reducer },
    });
    await store.dispatch(fetchEventExecutionRuns());
    await store.dispatch(fetchEventStages({ runId }));
    await store.dispatch(closeEventRegistration(runId));
    await store.dispatch(retryEventStageGeneration(runId));
    await store.dispatch(
      cancelEventStageGeneration({
        reason: "Roster size cannot execute safely.",
        runId,
      }),
    );

    assert.deepEqual(
      requests.map(({ method, url }) => [method, url]),
      [
        ["get", "/api/admin/events/execution-runs"],
        ["get", `/api/admin/events/runs/${runId}/stages`],
        ["post", `/api/admin/events/runs/${runId}/close-registration`],
        ["post", `/api/admin/events/runs/${runId}/stages/retry`],
        ["post", `/api/admin/events/runs/${runId}/cancel-generation`],
      ],
    );
    assert.deepEqual(requests[0].params, { limit: 25 });
    assert.deepEqual(requests[1].params, { batchLimit: 25 });
    assert.deepEqual(decodeBody(requests[2]), {});
    assert.deepEqual(decodeBody(requests[3]), {});
    assert.deepEqual(decodeBody(requests[4]), {
      reason: "Roster size cannot execute safely.",
    });
    assert.equal(
      store.getState().eventStages.overviewByRunId[runId].stages[0].id,
      "stage-1",
    );
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("stage UI never sends client participants, seeds, batches, or job internals", async () => {
  const source = await readFile(
    new URL(
      "../src/components/adminComponents/EventStageManagement.jsx",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(source, /closeEventRegistration\(selectedRunId\)/);
  assert.match(source, /fetchEventExecutionRuns/);
  assert.match(source, /retryEventStageGeneration/);
  assert.match(source, /generation\?\.cancelAvailable/);
  assert.match(source, /cancelEventStageGeneration\(\{ reason, runId: selectedRunId \}\)/);
  assert.match(source, /server creates[\s\S]*seed, batch, and Match/);
  assert.doesNotMatch(
    source,
    /participantIds|seedingSeed|leaseOwner|jobId|createBatch/,
  );
});

test("stage batch pagination forwards only the opaque cursor and de-duplicates batches", () => {
  const runId = "run-page";
  const first = eventStageSlice.reducer(
    eventStageSlice.reducer(
      undefined,
      fetchEventStages.pending("request-1", { runId }),
    ),
    fetchEventStages.fulfilled(
      {
        generation: { retryAvailable: false, status: "completed" },
        run: { id: runId },
        stages: [
          {
            id: "stage-1",
            batchPage: { hasMore: true, nextCursor: "opaque-cursor" },
            batches: [{ id: "batch-1" }],
            number: 1,
          },
          {
            id: "stage-2",
            batchPage: { hasMore: false, nextCursor: null },
            batches: [{ id: "batch-3" }],
            number: 2,
          },
        ],
      },
      "request-1",
      { runId },
    ),
  );
  const pendingNext = eventStageSlice.reducer(
    first,
    fetchEventStages.pending("request-2", {
      batchCursor: "opaque-cursor",
      runId,
    }),
  );
  const next = eventStageSlice.reducer(
    pendingNext,
    fetchEventStages.fulfilled(
      {
        generation: { retryAvailable: false, status: "completed" },
        run: { id: runId },
        stages: [
          {
            id: "stage-1",
            batchPage: { hasMore: false, nextCursor: null },
            batches: [{ id: "batch-1" }, { id: "batch-2" }],
            number: 1,
          },
        ],
      },
      "request-2",
      { batchCursor: "opaque-cursor", runId },
    ),
  );

  assert.deepEqual(
    next.overviewByRunId[runId].stages[0].batches.map((batch) => batch.id),
    ["batch-1", "batch-2"],
  );
  assert.equal(
    next.overviewByRunId[runId].stages[0].batchPage.hasMore,
    false,
  );
  assert.deepEqual(
    next.overviewByRunId[runId].stages[1].batches.map((batch) => batch.id),
    ["batch-3"],
  );
});

test("player and operator stage UX consumes only safe server-derived Event links", async () => {
  const [playerSource, progressionSource, operatorSource] = await Promise.all([
    readFile(new URL("../src/pages/Events.jsx", import.meta.url), "utf8"),
    readFile(
      new URL("../src/components/EventProgression.jsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../src/pages/Operations.jsx", import.meta.url), "utf8"),
  ]);

  assert.match(playerSource, /selectEventProgression\(event, standingPage\)/);
  assert.match(playerSource, /event\.cancellation/);
  assert.match(progressionSource, /ownBatch\.stageNumber/);
  assert.match(progressionSource, /to=\{`\/dashboard\/matches\/\$\{ownBatch\.matchId\}`\}/);
  assert.match(playerSource, /Registration committed/);
  assert.doesNotMatch(playerSource, /cancelEventRegistration|Cancel registration/);
  assert.doesNotMatch(
    `${playerSource}\n${progressionSource}`,
    /participantIds|seedingSeed|rosterEntries|leaseOwner/,
  );
  assert.match(operatorSource, /match\.source === "event"/);
  assert.match(operatorSource, /match\.eventBatch\?\.ordinal/);
  assert.doesNotMatch(operatorSource, /closeEventRegistration|createEventBatch/);
});

test("bounded player and admin standings plus advancement retry use server-owned contracts", async () => {
  const originalAdapter = api.defaults.adapter;
  const requests = [];
  const runId = "64e000000000000000000199";
  api.defaults.adapter = async (config) => {
    requests.push(config);
    if (config.method === "post") {
      return response(config, { data: { completed: true } });
    }
    return response(config, {
      data: {
        financialSettlement: "not_configured",
        mine: { placement: 1, result: "champion" },
        nextCursor: null,
        standings: [
          {
            placement: 1,
            player: { displayName: "Player One", profileTag: "P1" },
            result: "champion",
          },
        ],
        status: "final",
      },
    });
  };

  try {
    const store = configureStore({
      reducer: {
        eventRegistration: eventRegistrationReducer,
        eventStages: eventStageSlice.reducer,
      },
    });
    await store.dispatch(fetchPlayerEventStandings({ runId }));
    await store.dispatch(fetchAdminEventStandings({ runId }));
    await store.dispatch(
      retryEventStageAdvancement({ runId, stageNumber: 2 }),
    );

    assert.deepEqual(
      requests.map(({ method, url }) => [method, url]),
      [
        ["get", `/api/player/events/${runId}/standings`],
        ["get", `/api/admin/events/runs/${runId}/standings`],
        [
          "post",
          `/api/admin/events/runs/${runId}/stages/2/retry-advancement`,
        ],
      ],
    );
    assert.deepEqual(requests[0].params, { limit: 10 });
    assert.deepEqual(requests[1].params, { limit: 25 });
    assert.deepEqual(decodeBody(requests[2]), {});
    assert.equal(
      store.getState().eventRegistration.standingsById[runId].mine.result,
      "champion",
    );
    assert.equal(
      store.getState().eventStages.standingsByRunId[runId].standings[0]
        .placement,
      1,
    );
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("advancement and Event prize UI never accepts client winners, allocations, or seeds", async () => {
  const [playerSource, adminSource, sliceSource] = await Promise.all([
    readFile(
      new URL("../src/components/EventProgression.jsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL(
        "../src/components/adminComponents/EventStageManagement.jsx",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL("../src/store/slices/eventStageSlice.js", import.meta.url),
      "utf8",
    ),
  ]);
  const sources = `${playerSource}\n${adminSource}\n${sliceSource}`;

  assert.match(sources, /retryEventStageAdvancement/);
  assert.match(sources, /results finalized/i);
  assert.doesNotMatch(
    sources,
    /winnerId|winnerPlayer|participantIds|seedingSeed|prizePool|amountMinor.*getBody|allocation.*getBody/i,
  );
  assert.match(sliceSource, /path: \(\{ arg \}\) => `\/api\/admin\/events\/runs\/\$\{arg\}\/prize-release`/);
  assert.match(sliceSource, /getBody: \(\) => \(\{\}\)/);
});

test("final Event standing replaces a stale earlier Match batch for champion and eliminated players", () => {
  const event = {
    execution: {
      myBatch: {
        matchId: "old-match",
        ordinal: 1,
        stageNumber: 1,
      },
    },
  };

  for (const result of ["champion", "eliminated"]) {
    assert.deepEqual(
      selectEventProgression(event, {
        mine: { placement: result === "champion" ? 1 : 3, result },
        status: "final",
      }),
      { result, status: "results_finalized" },
    );
  }
});

test("Event refresh removes standings that are no longer completed and owned", () => {
  const runId = "run-final";
  const loaded = {
    ...eventRegistrationReducer(undefined, { type: "init" }),
    events: [{ id: runId, status: "completed" }],
    standingsById: { [runId]: { standings: [{ placement: 1 }] } },
    standingsErrorById: { [runId]: "old" },
    standingsRequestById: { [runId]: "request" },
    standingsStatusById: { [runId]: "succeeded" },
  };
  const next = eventRegistrationReducer(
    loaded,
    fetchPlayerEvents.fulfilled(
      [{ id: runId, status: "in_progress" }],
      "refresh-request",
    ),
  );

  assert.equal(next.standingsById[runId], undefined);
  assert.equal(next.standingsStatusById[runId], undefined);
});

test("post-registration round planning sends only the reviewed plan and server-owned identities", async () => {
  const originalAdapter = api.defaults.adapter;
  const requests = [];
  api.defaults.adapter = async (config) => {
    requests.push(config);
    if (config.url === "/api/admin/events/round-plans") return response(config, { data: { proposals: [], nextCursor: null } });
    return response(config, { data: { proposal: { id: "plan-1", status: "in_review" } } });
  };
  const executionPlan = { format: "ranked_stages", stages: [{ participantsPerMatch: 100, advanceCount: 10 }, { participantsPerMatch: 100, advanceCount: 0, qualificationRule: "final_ranking" }] };
  try {
    const store = configureStore({ reducer: { eventRoundPlans: eventRoundPlanSlice.reducer } });
    await store.dispatch(proposeEventRoundPlan({ executionPlan, runId: "run-1" }));
    await store.dispatch(fetchEventRoundPlanQueue());
    await store.dispatch(reviewEventRoundPlan({ action: "approved", note: "", proposalId: "plan-1" }));
    assert.deepEqual(requests.map(({ method, url }) => [method, url]), [
      ["post", "/api/staff/events/runs/run-1/round-plans"],
      ["get", "/api/admin/events/round-plans"],
      ["patch", "/api/admin/events/round-plans/plan-1/review"],
    ]);
    assert.deepEqual(decodeBody(requests[0]), { executionPlan });
    assert.deepEqual(decodeBody(requests[2]), { action: "approved", note: "" });
    assert.doesNotMatch(JSON.stringify(decodeBody(requests[0])), /playerIds|registeredCount|seedingSeed|status/);
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("future-round changes use scoped proposal and independent governance routes", async () => {
  const originalAdapter = api.defaults.adapter;
  const requests = [];
  api.defaults.adapter = async (config) => {
    requests.push(config);
    if (config.method === "get") {
      return response(config, { data: { adjustments: [] } });
    }
    return response(config, {
      data: {
        adjustment: {
          id: "adjustment-1",
          stageNumber: 2,
          status: config.method === "post" ? "in_review" : "approved",
        },
      },
    });
  };

  try {
    const store = configureStore({ reducer: { eventStageAdjustments: eventStageAdjustmentSlice.reducer } });
    const definition = {
      advanceCount: 10,
      batchSpacingMinutes: 2,
      checkInMinutesBefore: 15,
      participantsPerMatch: 100,
      qualificationRule: "top_n",
      stageDelayMinutes: 20,
    };
    await store.dispatch(fetchManagedStageAdjustments("run-1"));
    await store.dispatch(proposeManagedStageAdjustment({ definition, runId: "run-1", stageNumber: 2 }));
    await store.dispatch(fetchStageAdjustmentReviewQueue());
    await store.dispatch(reviewStageAdjustment({ action: "approved", adjustmentId: "adjustment-1", note: "" }));

    assert.deepEqual(requests.map(({ method, url }) => [method, url]), [
      ["get", "/api/staff/events/runs/run-1/stage-adjustments"],
      ["post", "/api/staff/events/runs/run-1/stage-adjustments"],
      ["get", "/api/admin/events/stage-adjustments"],
      ["patch", "/api/admin/events/stage-adjustments/adjustment-1/review"],
    ]);
    assert.deepEqual(decodeBody(requests[1]), { definition, stageNumber: 2 });
    assert.deepEqual(decodeBody(requests[3]), { action: "approved", note: "" });
    assert.doesNotMatch(JSON.stringify(decodeBody(requests[1])), /playerIds|rankingIds|seedingSeed|status/);
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("ranked Event UI exposes eliminated-round filters without client-owned outcomes", async () => {
  const [manager, roundPlan, operator, stage] = await Promise.all([
    readFile(new URL("../src/pages/EventManagerDashboard.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/eventManagement/PostRegistrationRoundPlan.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/Operations.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/adminComponents/EventStageManagement.jsx", import.meta.url), "utf8"),
  ]);
  assert.match(roundPlan, /RankedStagePlanEditor/);
  assert.match(operator, /record_result/);
  assert.match(stage, /Eliminated round/);
  assert.match(stage, /eliminatedInStage/);
  assert.doesNotMatch(`${manager}\n${roundPlan}\n${stage}`, /seedingSeed|setWinner|eliminatePlayer/);
  assert.match(manager, /Operations handoff/);
  assert.match(manager, /awaiting operator/);
  assert.match(manager, /result attention/);
});
test("independent Super Admin can review a Platform Admin Event proposal", () => {
  const item = {
    createdBy: { _id: "platform-admin-id" },
    submittedBy: { _id: "platform-admin-id" },
  };

  assert.equal(
    canReviewEventProposal({
      currentUser: { userId: "super-admin-id" },
      item,
    }),
    true,
  );
  assert.equal(
    canReviewEventProposal({
      currentUser: { userId: "platform-admin-id" },
      item,
    }),
    false,
  );
});
