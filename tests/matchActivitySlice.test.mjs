import assert from "node:assert/strict";
import test from "node:test";
import { configureStore } from "@reduxjs/toolkit";
import api from "../src/api/axios-api.js";
import matchActivitySlice, {
  checkInPlayerMatch,
  fetchPlayerMatch,
  fetchPlayerMatchActivity,
  raisePlayerMatchDispute,
  submitPlayerMatchResult,
} from "../src/store/slices/matchActivitySlice.js";

const createStore = (role) =>
  configureStore({
    reducer: {
      matchActivity: matchActivitySlice.reducer,
      ...(role ? { player: () => ({ summary: { role } }) } : {}),
    },
  });

const response = (config, data) => ({
  config,
  data,
  headers: {},
  status: 200,
  statusText: "OK",
});

test("player activity combines canonical queues and matches in timeline order", async () => {
  const originalAdapter = api.defaults.adapter;
  api.defaults.adapter = async (config) => {
    if (config.url === "/api/matches/queues") {
      return response(config, {
        data: [{ _id: "queue-1", createdAt: "2026-08-09T10:00:00Z" }],
      });
    }
    return response(config, {
      data: [{ _id: "match-1", createdAt: "2026-08-09T11:00:00Z" }],
    });
  };

  try {
    const store = createStore();
    const action = await store.dispatch(fetchPlayerMatchActivity());

    assert.equal(action.type, fetchPlayerMatchActivity.fulfilled.type);
    assert.deepEqual(
      store.getState().matchActivity.activity.map((item) => item._id),
      ["match-1", "queue-1"],
    );
    assert.equal(store.getState().matchActivity.activityStatus, "succeeded");
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("player Match detail uses the protected canonical read path", async () => {
  const originalAdapter = api.defaults.adapter;
  let request;
  api.defaults.adapter = async (config) => {
    request = config;
    return response(config, {
      data: { _id: "match-1", game: "future-arena", source: "quick_match" },
    });
  };

  try {
    const store = createStore();
    await store.dispatch(fetchPlayerMatch("match-1"));

    assert.equal(request.method, "get");
    assert.equal(request.url, "/api/matches/match-1");
    assert.equal(store.getState().matchActivity.selectedMatch.source, "quick_match");
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("result submission sends only the player result contract", async () => {
  const originalAdapter = api.defaults.adapter;
  let request;
  api.defaults.adapter = async (config) => {
    request = config;
    return response(config, {
      data: { _id: "match-1", status: "result_pending" },
      message: "Result submitted.",
    });
  };

  try {
    const store = createStore();
    await store.dispatch(
      submitPlayerMatchResult({
        matchId: "match-1",
        proofNote: "Recorded stream",
        score: "2-1",
        winnerIds: ["player-1"],
      }),
    );

    assert.equal(request.method, "patch");
    assert.equal(request.url, "/api/matches/match-1/result");
    assert.deepEqual(JSON.parse(request.data), {
      proofNote: "Recorded stream",
      score: "2-1",
      winnerIds: ["player-1"],
    });
    assert.equal(store.getState().matchActivity.selectedMatch.status, "result_pending");
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("staff utility mode sends no Match participation command", async () => {
  const originalAdapter = api.defaults.adapter;
  let requestCount = 0;
  api.defaults.adapter = async (config) => {
    requestCount += 1;
    return response(config, {});
  };

  try {
    const store = createStore("staff");
    const actions = await Promise.all([
      store.dispatch(checkInPlayerMatch({ matchId: "match-1" })),
      store.dispatch(
        submitPlayerMatchResult({
          matchId: "match-1",
          proofNote: "proof",
          score: "1-0",
          winnerIds: ["player-1"],
        }),
      ),
      store.dispatch(
        raisePlayerMatchDispute({ matchId: "match-1", reason: "reason" }),
      ),
    ]);

    assert.equal(requestCount, 0);
    assert.ok(actions.every((action) => action.meta.condition));
    assert.equal(store.getState().matchActivity.actionStatus, "idle");
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});
