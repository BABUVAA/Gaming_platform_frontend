import assert from "node:assert/strict";
import test from "node:test";
import { configureStore } from "@reduxjs/toolkit";
import api from "../src/api/axios-api.js";
import playerSlice, {
  fetchPublicPlayerProfile,
  playerActions,
} from "../src/store/slices/playerSlice.js";

test("public player profiles load through the Redux boundary", async () => {
  const originalAdapter = api.defaults.adapter;
  let request;
  api.defaults.adapter = async (config) => {
    request = config;
    return {
      config,
      data: {
        success: true,
        data: { playerTag: "PLAYER #1", username: "Babu" },
      },
      headers: {},
      status: 200,
      statusText: "OK",
    };
  };

  try {
    const store = configureStore({ reducer: { player: playerSlice.reducer } });
    await store.dispatch(fetchPublicPlayerProfile("PLAYER #1")).unwrap();

    assert.equal(request.url, "/api/users/public/PLAYER%20%231");
    assert.equal(store.getState().player.publicProfile.username, "Babu");
    assert.equal(store.getState().player.publicProfileStatus, "succeeded");

    store.dispatch(playerActions.clearPublicProfile());
    assert.equal(store.getState().player.publicProfile, null);
    assert.equal(store.getState().player.publicProfileStatus, "idle");
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});
