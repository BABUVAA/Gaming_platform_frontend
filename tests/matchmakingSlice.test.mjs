import assert from "node:assert/strict";
import test from "node:test";
import { configureStore } from "@reduxjs/toolkit";
import api from "../src/api/axios-api.js";
import matchmakingSlice, {
  joinQuickMatchQueue,
} from "../src/store/slices/matchmakingSlice.js";

const createStore = (role) =>
  configureStore({
    reducer: {
      matchmaking: matchmakingSlice.reducer,
      ...(role
        ? { player: () => ({ summary: { role } }) }
        : {}),
    },
  });

test("canonical Quick Match join uses the player offering route and minimal body", async () => {
  const originalAdapter = api.defaults.adapter;
  let request;
  api.defaults.adapter = async (config) => {
    request = config;
    return {
      config,
      data: { data: { queueId: "queue-1", roomStatus: "waiting" } },
      headers: {},
      status: 200,
      statusText: "OK",
    };
  };

  try {
    const store = createStore();
    const action = await store.dispatch(
      joinQuickMatchQueue({
        offeringId: "offering-1",
      }),
    );

    assert.equal(action.type, joinQuickMatchQueue.fulfilled.type);
    assert.equal(request.method, "post");
    assert.equal(request.url, "/api/player/quick-matches/offering-1/queue");
    assert.deepEqual(JSON.parse(request.data), {});
    assert.equal(store.getState().matchmaking.joinStatus, "succeeded");
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("staff utility mode never sends a Quick Match join request", async () => {
  const originalAdapter = api.defaults.adapter;
  let requestCount = 0;
  api.defaults.adapter = async (config) => {
    requestCount += 1;
    return { config, data: {}, headers: {}, status: 200, statusText: "OK" };
  };

  try {
    const store = createStore("staff");
    const action = await store.dispatch(
      joinQuickMatchQueue({
        offeringId: "offering-staff",
      }),
    );

    assert.equal(action.meta.condition, true);
    assert.equal(requestCount, 0);
    assert.equal(store.getState().matchmaking.joinStatus, "idle");
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("canonical team join sends only its selected team", async () => {
  const originalAdapter = api.defaults.adapter;
  let request;
  api.defaults.adapter = async (config) => {
    request = config;
    return {
      config,
      data: { data: { queueId: "queue-2", roomStatus: "waiting" } },
      headers: {},
      status: 200,
      statusText: "OK",
    };
  };

  try {
    const store = createStore();
    await store.dispatch(
      joinQuickMatchQueue({
        offeringId: "offering-2",
        teamId: "team-1",
      }),
    );

    assert.equal(request.url, "/api/player/quick-matches/offering-2/queue");
    assert.deepEqual(JSON.parse(request.data), { teamId: "team-1" });
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});
