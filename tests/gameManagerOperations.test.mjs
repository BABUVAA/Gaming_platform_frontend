import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { configureStore } from "@reduxjs/toolkit";
import api from "../src/api/axios-api.js";
import reducer, {
  fetchManagedGameOperations,
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

test("Game Manager dashboard exposes scoped attention and history without mutation controls", async () => {
  const source = await readFile(
    new URL("../src/pages/GameManagerDashboard.jsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /Attention queue/);
  assert.match(source, /Operational history/);
  assert.match(source, /No delayed or disputed work needs attention/);
  assert.doesNotMatch(source, /approve|resolve dispute|assign operator/i);
});
