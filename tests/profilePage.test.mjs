import assert from "node:assert/strict";
import test from "node:test";
import { configureStore } from "@reduxjs/toolkit";
import { readFile } from "node:fs/promises";
import api from "../src/api/axios-api.js";
import playerSlice, {
  fetchPlayerProfile,
  fetchPublicPlayerProfile,
  playerActions,
} from "../src/store/slices/playerSlice.js";

test("private Profile loading is not suppressed by auth bootstrap timing", async () => {
  const originalAdapter = api.defaults.adapter;
  let request;
  api.defaults.adapter = async (config) => {
    request = config;
    return {
      config,
      data: {
        success: true,
        data: { _id: "player-1", profile: { username: "Babu" } },
      },
      headers: {},
      status: 200,
      statusText: "OK",
    };
  };

  try {
    const store = configureStore({ reducer: { player: playerSlice.reducer } });
    await store.dispatch(fetchPlayerProfile()).unwrap();

    assert.equal(request.url, "/api/users/profile");
    assert.equal(store.getState().player.profile.profile.username, "Babu");
    assert.equal(store.getState().player.profileStatus, "succeeded");
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("a malformed legacy Profile response fails instead of refetching forever", async () => {
  const originalAdapter = api.defaults.adapter;
  api.defaults.adapter = async (config) => ({
    config,
    data: { profile: { username: "Legacy Babu" } },
    headers: {},
    status: 200,
    statusText: "OK",
  });

  try {
    const store = configureStore({ reducer: { player: playerSlice.reducer } });
    const action = await store.dispatch(fetchPlayerProfile());

    assert.equal(fetchPlayerProfile.rejected.match(action), true);
    assert.equal(store.getState().player.profile, null);
    assert.equal(store.getState().player.profileStatus, "failed");
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

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

test("a visited player profile exposes friendship actions through Redux", async () => {
  const profilePage = await readFile(
    new URL("../src/pages/Profile.jsx", import.meta.url),
    "utf8",
  );

  assert.match(profilePage, /sendFriendRequest\(\{ playerId \}\)/);
  assert.match(profilePage, /acceptFriendRequest\(playerId\)/);
  assert.match(profilePage, /cancelFriendRequest\(playerId\)/);
  assert.match(profilePage, /Add Friend/);
  assert.match(profilePage, /Friends/);
});
