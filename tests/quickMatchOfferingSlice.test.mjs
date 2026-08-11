import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { configureStore } from "@reduxjs/toolkit";
import api from "../src/api/axios-api.js";
import quickMatchOfferingSlice, {
  fetchPlayerQuickMatchOfferingById,
  fetchPlayerQuickMatchOfferings,
} from "../src/store/slices/quickMatchOfferingSlice.js";
import {
  selectPlayerQuickMatchDetail,
  selectPlayerQuickMatchDetailStatus,
  selectPlayerQuickMatchError,
  selectPlayerQuickMatchOfferings,
  selectPlayerQuickMatchStatus,
} from "../src/store/selectors/quickMatchOfferingSelectors.js";

const reduce = quickMatchOfferingSlice.reducer;

test("player discovery owns an independent loading lifecycle", () => {
  const adminOffering = { _id: "admin-offering" };
  const initial = {
    ...reduce(undefined, { type: "test/init" }),
    error: { message: "admin error" },
    offerings: [adminOffering],
    status: "succeeded",
  };

  const pending = reduce(
    initial,
    fetchPlayerQuickMatchOfferings.pending("player-request"),
  );

  assert.equal(pending.playerStatus, "loading");
  assert.equal(pending.playerError, null);
  assert.deepEqual(pending.offerings, [adminOffering]);
  assert.equal(pending.status, "succeeded");
});

test("player discovery stores only array payloads and selectors expose the result", () => {
  const offering = {
    _id: "quick-match-offering",
    eligibility: {
      joinAvailable: true,
      reasons: [],
    },
    gameKey: "catalog-game",
  };
  const fulfilled = reduce(
    undefined,
    fetchPlayerQuickMatchOfferings.fulfilled(
      [offering],
      "player-request",
    ),
  );
  const rootState = { quickMatchOfferings: fulfilled };

  assert.equal(selectPlayerQuickMatchStatus(rootState), "succeeded");
  assert.deepEqual(selectPlayerQuickMatchOfferings(rootState), [offering]);
  assert.equal(selectPlayerQuickMatchError(rootState), null);

  const malformed = reduce(
    fulfilled,
    fetchPlayerQuickMatchOfferings.fulfilled(
      { offerings: [offering] },
      "malformed-request",
    ),
  );
  assert.deepEqual(malformed.playerOfferings, []);
});

test("player discovery retains a normalized rejection for recovery UI", () => {
  const apiError = {
    code: "QUICK_MATCH_DISCOVERY_FAILED",
    message: "Unable to load tournaments right now.",
    status: 503,
  };
  const rejected = reduce(
    undefined,
    fetchPlayerQuickMatchOfferings.rejected(
      null,
      "player-request",
      undefined,
      apiError,
    ),
  );
  const rootState = { quickMatchOfferings: rejected };

  assert.equal(selectPlayerQuickMatchStatus(rootState), "failed");
  assert.equal(
    selectPlayerQuickMatchError(rootState),
    "Unable to load tournaments right now.",
  );
});

test("paid-entry release blockers have a deliberate player explanation", async () => {
  const source = await readFile(
    new URL("../src/components/ui/GameCard/QuickMatchCard.jsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /paid_entry_unavailable:/);
  assert.match(source, /payment release checks are incomplete/);
});

test("direct offering details use the canonical ID route independent of list position", async () => {
  const originalAdapter = api.defaults.adapter;
  let request;
  api.defaults.adapter = async (config) => {
    request = config;
    return {
      config,
      data: { data: { _id: "offering-101", gameKey: "future-arena" } },
      headers: {},
      status: 200,
      statusText: "OK",
    };
  };

  try {
    const store = configureStore({
      reducer: { quickMatchOfferings: quickMatchOfferingSlice.reducer },
    });
    const action = await store.dispatch(
      fetchPlayerQuickMatchOfferingById("offering-101"),
    );

    assert.equal(action.type, fetchPlayerQuickMatchOfferingById.fulfilled.type);
    assert.equal(request.url, "/api/player/quick-matches/offering-101");
    assert.equal(
      selectPlayerQuickMatchDetailStatus(store.getState(), "offering-101"),
      "succeeded",
    );
    assert.equal(
      selectPlayerQuickMatchDetail(store.getState(), "offering-101").gameKey,
      "future-arena",
    );
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("StrictMode remount keeps the replacement detail request authoritative", () => {
  const offeringId = "strict-offering";
  const firstPending = reduce(
    undefined,
    fetchPlayerQuickMatchOfferingById.pending("request-1", offeringId),
  );
  const replacementPending = reduce(
    firstPending,
    fetchPlayerQuickMatchOfferingById.pending("request-2", offeringId),
  );
  const staleAbort = reduce(
    replacementPending,
    fetchPlayerQuickMatchOfferingById.rejected(
      { name: "AbortError", message: "Aborted" },
      "request-1",
      offeringId,
    ),
  );

  assert.equal(staleAbort.playerDetailStatusById[offeringId], "loading");
  assert.equal(
    staleAbort.playerDetailRequestIdsById[offeringId],
    "request-2",
  );

  const fulfilled = reduce(
    staleAbort,
    fetchPlayerQuickMatchOfferingById.fulfilled(
      { _id: offeringId, gameKey: "bgmi" },
      "request-2",
      offeringId,
    ),
  );
  assert.equal(fulfilled.playerDetailStatusById[offeringId], "succeeded");
  assert.equal(fulfilled.playerDetails[offeringId].gameKey, "bgmi");
});

test("team picker uses a stable empty selector result", async () => {
  const source = await readFile(
    new URL("../src/components/feature/InviteModal.jsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /const EMPTY_TEAMS = Object\.freeze\(\[\]\)/);
  assert.match(source, /teams \|\| EMPTY_TEAMS/);
});
