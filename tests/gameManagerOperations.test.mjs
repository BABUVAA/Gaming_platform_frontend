import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { configureStore } from "@reduxjs/toolkit";
import api from "../src/api/axios-api.js";
import reducer, {
  fetchManagedGameOperations,
  fetchManagedVerificationRequests,
  reviewManagedVerificationRequest,
  scheduleManagedMatch,
} from "../src/store/slices/gameManagementSlice.js";

test("Game Manager operations use only the assigned read endpoint", async () => {
  const originalAdapter = api.defaults.adapter;
  const requests = [];
  api.defaults.adapter = async (config) => {
    requests.push(config);
    return {
      config,
      data: { data: { operations: [{ game: { _id: "game-1" }, metrics: {} }] } },
      headers: {},
      status: 200,
      statusText: "OK",
    };
  };

  try {
    const store = configureStore({
      reducer: { gameManagement: reducer.reducer },
    });
    await store.dispatch(fetchManagedGameOperations()).unwrap();
    assert.equal(requests.length, 1);
    assert.equal(requests[0].method, "get");
    assert.equal(requests[0].url, "/api/staff/games/operations");
    assert.equal(store.getState().gameManagement.operations[0].game._id, "game-1");
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("Game Manager dashboard exposes scoped operations and only account verification", async () => {
  const source = await readFile(
    new URL("../src/pages/GameManagerDashboard.jsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /Attention queue/);
  assert.match(source, /Operational history/);
  assert.match(source, /Account verification/);
  assert.match(source, /No delayed or disputed work needs attention/);
  assert.doesNotMatch(source, /resolve dispute|assign operator/i);
});

test("Game Manager schedules a scoped Match with only time and lobby configuration", async () => {
  const originalAdapter = api.defaults.adapter;
  let request;
  api.defaults.adapter = async (config) => {
    request = config;
    return { config, data: { data: { match: { id: "match-1", status: "scheduled" } } }, headers: {}, status: 200, statusText: "OK" };
  };
  try {
    const store = configureStore({ reducer: { gameManagement: reducer.reducer } });
    await store.dispatch(scheduleManagedMatch({
      matchId: "match-1",
      instructions: "Use slot one.",
      roomCode: "ROOM-1",
      roomPassword: "PASS-1",
      scheduledFor: "2026-08-22T12:00:00.000Z",
      operatorId: "must-not-send",
      playerIds: ["must-not-send"],
    })).unwrap();
    assert.equal(request.method, "patch");
    assert.equal(request.url, "/api/staff/games/matches/match-1/schedule");
    assert.deepEqual(JSON.parse(request.data), {
      instructions: "Use slot one.",
      roomCode: "ROOM-1",
      roomPassword: "PASS-1",
      scheduledFor: "2026-08-22T12:00:00.000Z",
    });
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("Game Manager verification sends only its scoped decision contract", async () => {
  const originalAdapter = api.defaults.adapter;
  const requests = [];
  api.defaults.adapter = async (config) => {
    requests.push(config);
    const data = config.method === "patch"
      ? { data: { request: { id: "request-1", status: "approved" } } }
      : { data: { items: [{ id: "request-1", status: "pending" }], page: { hasMore: false } } };
    return { config, data, headers: {}, status: 200, statusText: "OK" };
  };
  try {
    const store = configureStore({ reducer: { gameManagement: reducer.reducer } });
    await store.dispatch(fetchManagedVerificationRequests({ status: "pending" })).unwrap();
    await store.dispatch(reviewManagedVerificationRequest({ requestId: "request-1", status: "approved", reviewNote: "UID verified", gameId: "must-not-send", userId: "must-not-send" })).unwrap();
    assert.equal(requests[0].url, "/api/staff/games/verification-requests");
    assert.deepEqual(requests[0].params, { status: "pending", limit: 25 });
    assert.equal(requests[1].url, "/api/staff/games/verification-requests/request-1");
    assert.deepEqual(JSON.parse(requests[1].data), { status: "approved", reviewNote: "UID verified" });
    assert.equal(store.getState().gameManagement.verification.items.length, 0);
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});
