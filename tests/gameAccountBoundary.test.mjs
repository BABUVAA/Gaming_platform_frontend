import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { configureStore } from "@reduxjs/toolkit";
import api from "../src/api/axios-api.js";
import gameAccountReducer, {
  connectVerifiedGameAccount,
  fetchLinkedGameAccounts,
} from "../src/store/slices/gameAccountSlice.js";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("game-account reads and token verification use the Redux API boundary", async () => {
  const originalAdapter = api.defaults.adapter;
  const requests = [];
  api.defaults.adapter = async (config) => {
    requests.push(config);
    return {
      config,
      data: config.method === "get"
        ? { success: true, data: [{ accountId: "#PLAYER", verificationStatus: "verified" }] }
        : { success: true, data: { accountId: "#PLAYER", verificationStatus: "verified" } },
      headers: {},
      status: 200,
      statusText: "OK",
    };
  };

  try {
    const store = configureStore({ reducer: { gameAccounts: gameAccountReducer } });
    await store.dispatch(fetchLinkedGameAccounts()).unwrap();
    await store.dispatch(connectVerifiedGameAccount({
      gameKey: "coc",
      playerTag: "#PLAYER",
      replacement: false,
      token: "owner-token",
    })).unwrap();

    assert.equal(requests[0].url, "/api/users/game-accounts");
    assert.equal(requests[1].url, "/api/users/game-accounts/connect");
    assert.deepEqual(JSON.parse(requests[1].data), {
      gameKey: "coc",
      playerTag: "#PLAYER",
      replacement: false,
      token: "owner-token",
    });
    assert.equal(store.getState().gameAccounts.items.length, 1);
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("the unlaunched public CoC utility is fully removed", async () => {
  const [publicRoutes, routeConstants, registry, footer, gameAccounts, rootReducer] = await Promise.all([
    read("../src/routes/publicRoutes.jsx"),
    read("../src/routes/routeConstants.js"),
    read("../src/routes/routeRegistry.jsx"),
    read("../src/components/layout/Footer.jsx"),
    read("../src/pages/GameAccounts.jsx"),
    read("../src/store/rootReducer.js"),
  ]);

  assert.doesNotMatch(publicRoutes, /ROUTES\.COC|["']\/coc["']/);
  assert.doesNotMatch(routeConstants, /COC:\s*["']\/coc["']/);
  assert.doesNotMatch(registry, /pages\/Coc\.jsx/);
  assert.doesNotMatch(footer, /["']\/coc["']/);
  assert.doesNotMatch(gameAccounts, /api\.(get|post|put|patch|delete)\(/);
  assert.match(gameAccounts, /fetchLinkedGameAccounts/);
  assert.match(gameAccounts, /connectVerifiedGameAccount/);
  assert.match(rootReducer, /gameAccounts: gameAccountSlice/);

  await assert.rejects(access(new URL("../src/pages/Coc.jsx", import.meta.url)));
  await assert.rejects(access(new URL("../src/components/feature/ClanVerify.jsx", import.meta.url)));
});
