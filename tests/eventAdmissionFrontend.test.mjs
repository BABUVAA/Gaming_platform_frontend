import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { configureStore } from "@reduxjs/toolkit";
import api from "../src/api/axios-api.js";
import eventRegistrationReducer, {
  cancelEventRegistration,
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
} from "../src/store/slices/eventManagementSlice.js";
import eventStageAdjustmentSlice, {
  fetchManagedStageAdjustments,
  fetchStageAdjustmentReviewQueue,
  proposeManagedStageAdjustment,
  reviewStageAdjustment,
} from "../src/store/slices/eventStageAdjustmentSlice.js";

const response = (config, data) => ({
  config,
  data,
  headers: {},
  status: 200,
  statusText: "OK",
});

const decodeBody = (config) =>
  typeof config.data === "string" ? JSON.parse(config.data) : config.data;

test("player Event discovery, registration, and cancellation use canonical routes and refresh counters", async () => {
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
    return response(config, {
      data: {
        registration: { id: "registration-1", status: "cancelled" },
      },
    });
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
    await store.dispatch(cancelEventRegistration("event-run-1"));

    assert.deepEqual(
      requests.map(({ method, url }) => [method, url]),
      [
        ["get", "/api/player/events"],
        ["post", "/api/player/events/event-run-1/register"],
        ["get", "/api/player/events"],
        ["delete", "/api/player/events/event-run-1/register"],
        ["get", "/api/player/events"],
      ],
    );
    assert.deepEqual(decodeBody(requests[1]), {});
    assert.equal(requests[3].data, undefined);
    assert.equal(store.getState().eventRegistration.status, "succeeded");
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("staff Event participation is cancelled before any mutation transport", async () => {
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
    const cancelAction = await store.dispatch(cancelEventRegistration("run-1"));

    assert.equal(registerAction.meta.condition, true);
    assert.equal(cancelAction.meta.condition, true);
    assert.equal(requestCount, 0);
  } finally {
    api.defaults.adapter = originalAdapter;
  }
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

test("Event governance UI discloses admission terms and avoids an unbounded player directory", async () => {
  const [reviewSource, invitationSource, navigationSource] = await Promise.all([
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
  ]);

  for (const field of [
    "registrationOpensAt",
    "registrationClosesAt",
    "admissionPolicy",
    "registrationCapacity",
    "waitlistEnabled",
    "participantsPerMatch",
    "advanceCount",
    "batchSpacingMinutes",
    "checkInMinutesBefore",
    "seedingPolicy",
    "formatSnapshot",
    "templateRevision",
    "gameKey",
  ]) {
    assert.match(reviewSource, new RegExp(field));
  }
  assert.match(invitationSource, /Search eligible players/);
  assert.match(invitationSource, /bounded to 20/);
  assert.doesNotMatch(invitationSource, /findUsers|\/api\/admin\/findUsers/);
  assert.match(reviewSource, /Independent review required/);
  assert.match(reviewSource, /Another admin reviews/);
  assert.match(reviewSource, /currentUser\?\._id \|\| currentUser\?\.id/);
  assert.match(reviewSource, /if \(!selected \|\| !canReview\(selected\.item\)\) return/);
  assert.match(
    navigationSource,
    /const playerNavigation[\s\S]*label: "Events"[\s\S]*to: ROUTES\.EVENTS/,
  );
});

test("Event Manager proposes only the reviewed execution plan and fails closed for team Events", async () => {
  const source = await readFile(
    new URL("../src/pages/EventManagerDashboard.jsx", import.meta.url),
    "utf8",
  );

  for (const field of [
    "format: \"single_elimination\"",
    "participantsPerMatch",
    "advanceCount",
    "seedingPolicy",
    "batchSpacingMinutes",
    "checkInMinutesBefore",
  ]) {
    assert.match(source, new RegExp(field));
  }
  assert.match(source, /selectedRunTemplate\?\.teamSize > 1/);
  assert.match(source, /participantsPerMatch: "2"/);
  assert.match(source, /advanceCount: "1"/);
  assert.match(source, /Team Event execution is not available yet/);
  const [templateDraftSection, runDraftSection] = source.split(
    "onSubmit={saveRun}",
  );
  assert.doesNotMatch(
    templateDraftSection,
    /disabled=\{teamExecutionUnsupported\}/,
  );
  assert.match(
    runDraftSection,
    /disabled=\{teamExecutionUnsupported \|\| Boolean\(rankedProjection\.error\)\}/,
  );
  assert.doesNotMatch(source, /participantIds|seedingSeed|createBatch|close-registration/);
});

test("Event Manager Run draft sends the exact supported first-stage plan", async () => {
  const originalAdapter = api.defaults.adapter;
  let request;
  const payload = {
    admissionPolicy: "open",
    executionPlan: {
      advanceCount: 1,
      batchSpacingMinutes: 10,
      checkInMinutesBefore: 15,
      format: "single_elimination",
      participantsPerMatch: 2,
      seedingPolicy: "registration_order",
    },
    registrationCapacity: 16,
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
  assert.match(playerSource, /const canCancel = active && event\.registration\.isOpen/);
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
  const [manager, operator, stage] = await Promise.all([
    readFile(new URL("../src/pages/EventManagerDashboard.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/Operations.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/adminComponents/EventStageManagement.jsx", import.meta.url), "utf8"),
  ]);
  assert.match(manager, /RankedStagePlanEditor/);
  assert.match(operator, /record_result/);
  assert.match(stage, /Eliminated round/);
  assert.match(stage, /eliminatedInStage/);
  assert.doesNotMatch(`${manager}\n${stage}`, /seedingSeed|setWinner|eliminatePlayer/);
  assert.match(manager, /Operations handoff/);
  assert.match(manager, /awaiting operator/);
  assert.match(manager, /result attention/);
});
