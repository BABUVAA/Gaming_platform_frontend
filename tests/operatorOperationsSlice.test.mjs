import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { configureStore } from "@reduxjs/toolkit";
import api from "../src/api/axios-api.js";
import operatorOperationsSlice, {
  claimOperatorMatch,
  executeOperatorMatchCommand,
  fetchMoreOperatorMatches,
  fetchOperatorWorkspace,
} from "../src/store/slices/operatorOperationsSlice.js";

const createStore = () =>
  configureStore({
    reducer: { operatorOperations: operatorOperationsSlice.reducer },
  });

const response = (config, data) => ({
  config,
  data,
  headers: {},
  status: 200,
  statusText: "OK",
});

test("operator workspace loads dashboard and both scoped match queues", async () => {
  const originalAdapter = api.defaults.adapter;
  const requestedPaths = [];
  api.defaults.adapter = async (config) => {
    requestedPaths.push(config.url);
    const payload = config.url.endsWith("/dashboard")
      ? { totalAssignedMatches: 1 }
      : {
          items: [{ _id: config.url.endsWith("/unassigned") ? "open-1" : "match-1" }],
          page: { hasMore: true, limit: 25, nextCursor: config.url.endsWith("/unassigned") ? "open-cursor" : "match-cursor" },
        };
    return response(config, { data: payload });
  };

  try {
    const store = createStore();
    const action = await store.dispatch(fetchOperatorWorkspace());

    assert.equal(action.type, fetchOperatorWorkspace.fulfilled.type);
    assert.deepEqual(requestedPaths.sort(), [
      "/api/operator/dashboard",
      "/api/operator/matches",
      "/api/operator/matches/unassigned",
      "/api/operator/rooms",
    ]);
    assert.equal(store.getState().operatorOperations.matches[0]._id, "match-1");
    assert.equal(store.getState().operatorOperations.unassigned[0]._id, "open-1");
    assert.equal(store.getState().operatorOperations.pages.assigned.nextCursor, "match-cursor");
    assert.equal(store.getState().operatorOperations.pages.unassigned.nextCursor, "open-cursor");
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("operator match pages forward only server cursors and append without duplicates", async () => {
  const originalAdapter = api.defaults.adapter;
  const requests = [];
  api.defaults.adapter = async (config) => {
    requests.push(config);
    return response(config, {
      data: {
        items: [{ _id: "match-1" }, { _id: "match-2" }],
        page: { hasMore: false, limit: 25, nextCursor: null },
      },
    });
  };

  try {
    const store = createStore();
    store.dispatch({
      type: fetchOperatorWorkspace.fulfilled.type,
      payload: {
        dashboard: {},
        assignedPage: {
          items: [{ _id: "match-1" }],
          page: { hasMore: true, limit: 25, nextCursor: "match-cursor" },
        },
        unassignedPage: { items: [], page: { hasMore: false, limit: 25, nextCursor: null } },
        rooms: [],
      },
    });
    const action = await store.dispatch(fetchMoreOperatorMatches({
      cursor: "match-cursor",
      kind: "assigned",
    }));
    assert.equal(action.type, fetchMoreOperatorMatches.fulfilled.type);
    assert.equal(requests[0].url, "/api/operator/matches");
    assert.deepEqual(requests[0].params, { cursor: "match-cursor", limit: 25 });
    assert.deepEqual(
      store.getState().operatorOperations.matches.map((match) => match._id),
      ["match-1", "match-2"],
    );
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("operator mutations use only canonical claim and lifecycle command contracts", async () => {
  const originalAdapter = api.defaults.adapter;
  const requests = [];
  api.defaults.adapter = async (config) => {
    requests.push(config);
    return response(config, {
      data: { _id: "match-1", status: "live" },
      message: "Match updated.",
    });
  };

  try {
    const store = createStore();
    await store.dispatch(claimOperatorMatch("match-1"));
    await store.dispatch(
      executeOperatorMatchCommand({ matchId: "match-1", command: "start" }),
    );

    assert.deepEqual(
      requests.map(({ method, url }) => ({ method, url })),
      [
        { method: "patch", url: "/api/operator/matches/match-1/claim" },
        {
          method: "patch",
          url: "/api/operator/matches/match-1/commands/start",
        },
      ],
    );
    assert.equal(store.getState().operatorOperations.matches.length, 1);
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("an unmounted workspace abort does not become a visible API error", async () => {
  const originalAdapter = api.defaults.adapter;
  api.defaults.adapter = (config) =>
    new Promise((resolve, reject) => {
      config.signal.addEventListener("abort", () => reject(new Error("Aborted")));
      setTimeout(() => resolve(response(config, { data: [] })), 100);
    });

  try {
    const store = createStore();
    const request = store.dispatch(fetchOperatorWorkspace());
    request.abort();
    await request;

    assert.equal(store.getState().operatorOperations.error, null);
    assert.equal(store.getState().operatorOperations.status, "idle");
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("full Room progress distinguishes claimable, assigned, and scheduled Matches", () => {
  const source = readFileSync(
    new URL("../src/pages/Operations.jsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /room\.match\.status === "awaiting_operator"/);
  assert.match(source, /return "Ready for operator pickup"/);
  assert.match(source, /return "Operator assigned"/);
  assert.match(source, /return "Scheduled"/);
  assert.doesNotMatch(
    source,
    /room\.status === "full" \? "Ready for operator pickup"/,
  );
});
