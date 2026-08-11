import assert from "node:assert/strict";
import test from "node:test";
import { configureStore } from "@reduxjs/toolkit";
import api from "../src/api/axios-api.js";
import withdrawalSlice, {
  fetchPayoutDestinations,
  fetchWithdrawalHistory,
  requestWithdrawal,
  WITHDRAWAL_PAGE_LIMIT,
} from "../src/store/slices/withdrawalSlice.js";

const playerReducer = (role = "player") => () => ({ summary: { role } });
const createStore = (role = "player") =>
  configureStore({
    reducer: {
      player: playerReducer(role),
      withdrawals: withdrawalSlice.reducer,
    },
  });
const response = (config, data) => ({
  config,
  data,
  headers: {},
  status: 200,
  statusText: "OK",
});

test("player payout reads expose only server-returned verified destinations", async () => {
  const originalAdapter = api.defaults.adapter;
  let request;
  api.defaults.adapter = async (config) => {
    request = config;
    return response(config, {
      data: {
        availability: { blocker: null, canRequest: true },
        destinations: [
          { id: "destination-1", maskedLabel: "user@***", verifiedAt: "2026-08-11T10:00:00.000Z", type: "upi" },
        ],
      },
    });
  };
  try {
    const store = createStore();
    await store.dispatch(fetchPayoutDestinations());
    assert.equal(request.url, "/api/payment/payout-destinations");
    assert.deepEqual(
      store.getState().withdrawals.destinations.items.map((item) => item.id),
      ["destination-1"],
    );
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("withdrawal history forwards only the opaque cursor and de-duplicates pages", async () => {
  const originalAdapter = api.defaults.adapter;
  const requests = [];
  api.defaults.adapter = async (config) => {
    requests.push(config);
    const more = Boolean(config.params.cursor);
    return response(config, {
      data: {
        withdrawals: more ? [{ id: "one" }, { id: "two" }] : [{ id: "one" }],
        page: {
          hasMore: !more,
          limit: WITHDRAWAL_PAGE_LIMIT,
          nextCursor: more ? null : "opaque-cursor",
        },
      },
    });
  };
  try {
    const store = createStore();
    await store.dispatch(fetchWithdrawalHistory());
    await store.dispatch(fetchWithdrawalHistory({ cursor: "opaque-cursor" }));
    assert.deepEqual(requests[1].params, {
      cursor: "opaque-cursor",
      limit: WITHDRAWAL_PAGE_LIMIT,
    });
    assert.deepEqual(
      store.getState().withdrawals.history.items.map((item) => item.id),
      ["one", "two"],
    );
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("a stale history response cannot replace a newer refresh", async () => {
  const originalAdapter = api.defaults.adapter;
  const pending = [];
  api.defaults.adapter = (config) =>
    new Promise((resolve) => pending.push({ config, resolve }));
  try {
    const store = createStore();
    const oldRequest = store.dispatch(fetchWithdrawalHistory());
    const newRequest = store.dispatch(fetchWithdrawalHistory());
    await new Promise((resolve) => setTimeout(resolve, 0));
    pending[1].resolve(response(pending[1].config, {
      data: { withdrawals: [{ id: "new" }], page: { hasMore: false, limit: 20, nextCursor: null } },
    }));
    await newRequest;
    pending[0].resolve(response(pending[0].config, {
      data: { withdrawals: [{ id: "old" }], page: { hasMore: false, limit: 20, nextCursor: null } },
    }));
    await oldRequest;
    assert.deepEqual(
      store.getState().withdrawals.history.items.map((item) => item.id),
      ["new"],
    );
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("withdrawal request sends no client-owned financial or status fields", async () => {
  const originalAdapter = api.defaults.adapter;
  let request;
  api.defaults.adapter = async (config) => {
    request = config;
    return response(config, {
      data: { withdrawal: { id: "withdrawal-1", amountMinor: 2500, status: "requested" } },
    });
  };
  try {
    const store = createStore();
    const action = await store.dispatch(requestWithdrawal({
      amountMinor: 2500,
      currency: "INR",
      finalStatus: "paid",
      idempotencyKey: "attempt-1",
      ledgerAccount: "withdrawable",
      payoutDestinationId: "destination-1",
      userId: "other-user",
    }));
    assert.equal(action.type, requestWithdrawal.fulfilled.type);
    assert.equal(request.url, "/api/payment/withdrawals");
    assert.deepEqual(JSON.parse(request.data), {
      amountMinor: 2500,
      idempotencyKey: "attempt-1",
      payoutDestinationId: "destination-1",
    });
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("staff utility mode cannot start withdrawal transport", async () => {
  const originalAdapter = api.defaults.adapter;
  let calls = 0;
  api.defaults.adapter = async (config) => {
    calls += 1;
    return response(config, {});
  };
  try {
    const store = createStore("staff");
    const action = await store.dispatch(requestWithdrawal({
      amountMinor: 2500,
      idempotencyKey: "attempt-1",
      payoutDestinationId: "destination-1",
    }));
    assert.equal(action.meta.condition, true);
    assert.equal(calls, 0);
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});
