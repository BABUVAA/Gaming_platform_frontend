import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { configureStore } from "@reduxjs/toolkit";
import api from "../src/api/axios-api.js";
import reducer, {
  fetchManagedGameOperations,
  fetchManagedVerificationEvidence,
  fetchManagedVerificationRequests,
  reviewManagedVerificationRequest,
  scheduleManagedMatch,
  fetchManagedMatch,
  fetchManagedMatchOperators,
  assignManagedMatchOperator,
  fetchManagedRoom,
  closeManagedRoomEarly,
  cancelManagedRoom,
} from "../src/store/slices/gameManagementSlice.js";

test("Room controls use scoped room paths and reason-only commands", async () => {
  const originalAdapter = api.defaults.adapter;
  const requests = [];
  api.defaults.adapter = async (config) => {
    requests.push(config);
    return { config, data: { data: { room: { id: "room-1", status: config.url.endsWith("/cancel") ? "cancelled" : "full" } } }, headers: {}, status: 200, statusText: "OK" };
  };
  try {
    const store = configureStore({ reducer: { gameManagement: reducer.reducer } });
    await store.dispatch(fetchManagedRoom({ roomId: "room-1" })).unwrap();
    await store.dispatch(closeManagedRoomEarly({ roomId: "room-1", reason: "Enough complete teams", minimumParticipants: 1, status: "live" })).unwrap();
    await store.dispatch(cancelManagedRoom({ roomId: "room-1", reason: "Room unavailable", refundAmount: 999 })).unwrap();
    assert.equal(requests[0].url, "/api/staff/games/rooms/room-1");
    assert.equal(requests[0].method, "get");
    assert.equal(requests[1].url, "/api/staff/games/rooms/room-1/close-early");
    assert.equal(requests[1].method, "post");
    assert.deepEqual(JSON.parse(requests[1].data), { reason: "Enough complete teams" });
    assert.equal(requests[2].url, "/api/staff/games/rooms/room-1/cancel");
    assert.deepEqual(JSON.parse(requests[2].data), { reason: "Room unavailable" });
    assert.equal(store.getState().gameManagement.roomDetails["room-1"].room.status, "cancelled");
  } finally { api.defaults.adapter = originalAdapter; }
});

test("Room state ignores old reads after mutation and isolates concurrent room actions", () => {
  const arg = { roomId: "room-1" };
  let state = reducer.reducer(undefined, fetchManagedRoom.pending("old-read", arg));
  state = reducer.reducer(state, closeManagedRoomEarly.pending("close", arg));
  state = reducer.reducer(state, closeManagedRoomEarly.fulfilled({ id: "room-1", status: "full" }, "close", arg));
  state = reducer.reducer(state, fetchManagedRoom.fulfilled({ id: "room-1", status: "waiting" }, "old-read", arg));
  assert.equal(state.roomDetails["room-1"].room.status, "full");
  state = reducer.reducer(state, cancelManagedRoom.pending("other", { roomId: "room-2" }));
  assert.equal(state.roomDetails["room-1"].actionStatus, "succeeded");
  assert.equal(state.roomDetails["room-2"].actionStatus, "loading");
});

test("Room controls explain complete teams and require reason confirmation", async () => {
  const source = await readFile(new URL("../src/components/gameManagement/ManagedRoomDetails.jsx", import.meta.url), "utf8");
  assert.match(source, /Every team must contain exactly/);
  assert.match(source, /does not start gameplay/);
  assert.match(source, /at least ten minutes ahead/);
  assert.match(source, /Confirm room cancellation/);
  assert.match(source, /reason\.trim\(\)\.length < 5/);
  assert.match(source, /maxLength=\{200\}/);
  assert.doesNotMatch(source, /axios|api\.post/);
});

test("Sealed underfilled rooms show entry closure without fabricating occupied capacity", async () => {
  const [manager, operator, player] = await Promise.all([
    readFile(new URL("../src/pages/GameManagerDashboard.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/Operations.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/MatchRoom.jsx", import.meta.url), "utf8"),
  ]);
  assert.match(manager, /room\.earlyClosed && room\.status === "full" \? "Entry closed"/);
  assert.match(operator, /room\.earlyClosed && room\.status === "full" \? "Entry closed · "/);
  for (const source of [manager, operator]) assert.match(source, /room\.joinedCount \/ room\.capacity/);
  assert.match(player, /Entry closed · waiting for operator/);
  assert.doesNotMatch(player, /Room full · waiting for operator/);
});

test("Room command success invalidates a read started while the command was pending", () => {
  const arg = { roomId: "room-1" };
  let state = reducer.reducer(undefined, cancelManagedRoom.pending("cancel", arg));
  state = reducer.reducer(state, fetchManagedRoom.pending("reopen-read", arg));
  state = reducer.reducer(state, cancelManagedRoom.fulfilled({ id: "room-1", status: "cancelled", canCancel: false }, "cancel", arg));
  state = reducer.reducer(state, fetchManagedRoom.fulfilled({ id: "room-1", status: "waiting", canCancel: true }, "reopen-read", arg));
  assert.equal(state.roomDetails["room-1"].room.status, "cancelled");
  assert.equal(state.roomDetails["room-1"].room.canCancel, false);
  assert.equal(state.roomDetails["room-1"].detailStatus, "succeeded");
});

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

test("Game Manager evidence uses the scoped private blob endpoint", async () => {
  const originalAdapter = api.defaults.adapter;
  let request;
  api.defaults.adapter = async (config) => {
    request = config;
    return { config, data: new Blob(["evidence"], { type: "image/png" }), headers: {}, status: 200, statusText: "OK" };
  };
  try {
    const store = configureStore({ reducer: { gameManagement: reducer.reducer } });
    const objectUrl = await store.dispatch(fetchManagedVerificationEvidence({ requestId: "request-1" })).unwrap();
    assert.equal(request.url, "/api/staff/games/verification-requests/request-1/evidence");
    assert.equal(request.responseType, "blob");
    assert.match(objectUrl, /^blob:/);
    URL.revokeObjectURL(objectUrl);
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
  assert.doesNotMatch(source, /resolve dispute/i);
  assert.match(source, /Open match details/);
  assert.match(source, /Review match/);
  assert.match(source, /Start delayed/);
});

test("Game Manager detail and assignment transport remain Match-scoped with identity-only writes", async () => {
  const originalAdapter = api.defaults.adapter;
  const requests = [];
  api.defaults.adapter = async (config) => {
    requests.push(config);
    return { config, data: { data: config.url.endsWith("/operators") ? { operators: { items: [{ id: "operator-1" }], page: {} } } : { match: { id: "match-1" } } }, headers: {}, status: 200, statusText: "OK" };
  };
  try {
    const store = configureStore({ reducer: { gameManagement: reducer.reducer } });
    await store.dispatch(fetchManagedMatch({ matchId: "match-1" })).unwrap();
    await store.dispatch(fetchManagedMatchOperators({ matchId: "match-1", cursor: "opaque" })).unwrap();
    await store.dispatch(assignManagedMatchOperator({ matchId: "match-1", operatorId: "operator-1", gameIds: ["forged"], status: "live" })).unwrap();
    assert.equal(requests[0].url, "/api/staff/games/matches/match-1");
    assert.equal(requests[1].params.cursor, "opaque");
    assert.equal(requests[2].method, "patch");
    assert.equal(requests[2].url, "/api/staff/games/matches/match-1/operator");
    assert.deepEqual(JSON.parse(requests[2].data), { operatorId: "operator-1" });
    assert.equal(store.getState().gameManagement.matchDetails["match-1"].assignStatus, "succeeded");
  } finally { api.defaults.adapter = originalAdapter; }
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
