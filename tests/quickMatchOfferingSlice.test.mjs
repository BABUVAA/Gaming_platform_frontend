import assert from "node:assert/strict";
import test from "node:test";
import quickMatchOfferingSlice, {
  fetchPlayerQuickMatchOfferings,
} from "../src/store/slices/quickMatchOfferingSlice.js";
import {
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
