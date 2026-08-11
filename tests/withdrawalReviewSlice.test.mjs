import assert from "node:assert/strict";
import test from "node:test";
import { configureStore } from "@reduxjs/toolkit";
import api from "../src/api/axios-api.js";
import withdrawalReviewSlice, {
  decideWithdrawal,
  fetchWithdrawalReviewQueue,
  startWithdrawalReview,
  WITHDRAWAL_REVIEW_PAGE_LIMIT,
} from "../src/store/slices/withdrawalReviewSlice.js";

const item = (id, actions = {}) => ({
  actions: {
    blockedReason: null,
    canDecide: false,
    canStartReview: false,
    ...actions,
  },
  amountMinor: 5000,
  currency: "INR",
  destination: { maskedLabel: "user@***", type: "upi" },
  id,
  player: { displayName: "Player" },
  status: "requested",
});
const createStore = () => configureStore({ reducer: { withdrawalReview: withdrawalReviewSlice.reducer } });
const response = (config, data) => ({ config, data, headers: {}, status: 200, statusText: "OK" });

test("admin queue is bounded and forwards only the server cursor", async () => {
  const originalAdapter = api.defaults.adapter;
  const requests = [];
  api.defaults.adapter = async (config) => {
    requests.push(config);
    const more = Boolean(config.params.cursor);
    return response(config, {
      data: {
        withdrawals: more ? [item("one"), item("two")] : [item("one")],
        page: { hasMore: !more, limit: WITHDRAWAL_REVIEW_PAGE_LIMIT, nextCursor: more ? null : "cursor" },
      },
    });
  };
  try {
    const store = createStore();
    await store.dispatch(fetchWithdrawalReviewQueue());
    await store.dispatch(fetchWithdrawalReviewQueue({ cursor: "cursor" }));
    assert.deepEqual(requests[1].params, { cursor: "cursor", limit: WITHDRAWAL_REVIEW_PAGE_LIMIT });
    assert.deepEqual(store.getState().withdrawalReview.items.map((entry) => entry.id), ["one", "two"]);
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("admin review actions send identity in the path and only a rejection note", async () => {
  const originalAdapter = api.defaults.adapter;
  const requests = [];
  api.defaults.adapter = async (config) => {
    requests.push(config);
    if (config.method === "get") {
      return response(config, {
        data: {
          withdrawals: [item("withdrawal-1", { canStartReview: true })],
          page: { hasMore: false, limit: 20, nextCursor: null },
        },
      });
    }
    const next = requests.length === 2
      ? item("withdrawal-1", { canDecide: true })
      : item("withdrawal-1");
    return response(config, { data: { withdrawal: next } });
  };
  try {
    const store = createStore();
    await store.dispatch(fetchWithdrawalReviewQueue());
    await store.dispatch(startWithdrawalReview({ withdrawalId: "withdrawal-1" }));
    await store.dispatch(decideWithdrawal({
      amountMinor: 1,
      decision: "reject",
      finalStatus: "paid",
      note: "Destination ownership could not be verified.",
      withdrawalId: "withdrawal-1",
    }));
    assert.equal(requests[1].url, "/api/admin/withdrawals/withdrawal-1/start-review");
    assert.deepEqual(JSON.parse(requests[1].data), {});
    assert.equal(requests[2].url, "/api/admin/withdrawals/withdrawal-1/decision");
    assert.deepEqual(JSON.parse(requests[2].data), { decision: "reject", note: "Destination ownership could not be verified." });
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("server-blocked approval and duplicate actions never reach transport", async () => {
  const originalAdapter = api.defaults.adapter;
  let postCalls = 0;
  api.defaults.adapter = async (config) => {
    if (config.method === "get") {
      return response(config, {
        data: {
          withdrawals: [item("blocked"), item("allowed", { canDecide: true })],
          page: { hasMore: false, limit: 20, nextCursor: null },
        },
      });
    }
    postCalls += 1;
    return new Promise(() => {});
  };
  try {
    const store = createStore();
    await store.dispatch(fetchWithdrawalReviewQueue());
    const blocked = await store.dispatch(decideWithdrawal({ decision: "approve", withdrawalId: "blocked" }));
    assert.equal(blocked.meta.condition, true);
    const first = store.dispatch(decideWithdrawal({ decision: "approve", withdrawalId: "allowed" }));
    const duplicate = await store.dispatch(decideWithdrawal({ decision: "approve", withdrawalId: "allowed" }));
    assert.equal(duplicate.meta.condition, true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(postCalls, 1);
    first.abort();
    await first;
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});
