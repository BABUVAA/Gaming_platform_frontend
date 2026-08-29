import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { configureStore } from "@reduxjs/toolkit";
import api from "../src/api/axios-api.js";
import slice, { fetchManagedPlayers } from "../src/store/slices/playerManagementSlice.js";

const response = (config, players, page) => ({
  config,
  data: {
    data: {
      page,
      players,
      summary: { banned: 0, pendingVerification: 1, total: 2, underReview: 0, verified: 1 },
    },
  },
  headers: {},
  status: 200,
  statusText: "OK",
});

test("player management keeps search filters on bounded pagination", async () => {
  const original = api.defaults.adapter;
  const requests = [];
  api.defaults.adapter = async (config) => {
    requests.push(config);
    return requests.length === 1
      ? response(config, [{ id: "one" }], { hasMore: true, nextCursor: "opaque" })
      : response(config, [{ id: "two" }], { hasMore: false, nextCursor: null });
  };
  try {
    const store = configureStore({ reducer: { playerManagement: slice.reducer } });
    await store.dispatch(fetchManagedPlayers({ search: "alpha", status: "verified" })).unwrap();
    await store.dispatch(fetchManagedPlayers({ cursor: "opaque", search: "alpha", status: "verified" })).unwrap();
    assert.equal(requests[0].url, "/api/admin/players");
    assert.deepEqual(requests[0].params, { limit: 25, search: "alpha", status: "verified" });
    assert.deepEqual(requests[1].params, { cursor: "opaque", limit: 25, search: "alpha", status: "verified" });
    assert.deepEqual(store.getState().playerManagement.players.map((item) => item.id), ["one", "two"]);
  } finally {
    api.defaults.adapter = original;
  }
});

test("admin dashboard mounts a player-only management workspace", async () => {
  const [dashboard, component] = await Promise.all([
    readFile(new URL("../src/pages/AdminDashboard.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/adminComponents/PlayerManagement.jsx", import.meta.url), "utf8"),
  ]);
  assert.match(dashboard, /Player Management/);
  assert.match(dashboard, /<PlayerManagement \/>/);
  assert.match(component, /Registered players/);
  assert.match(component, /Username, tag, or email/);
  assert.doesNotMatch(component, /delete player|ban player|wallet|IP address/i);
});
