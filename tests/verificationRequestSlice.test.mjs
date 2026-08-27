import assert from "node:assert/strict";
import test from "node:test";
import { configureStore } from "@reduxjs/toolkit";
import api from "../src/api/axios-api.js";
import verificationRequestReducer, {
  fetchMyVerificationRequests,
  submitGameAccountReplacement,
  submitGameAccountVerification,
} from "../src/store/slices/verificationRequestSlice.js";
import adminReducer, { findVerificationRequests } from "../src/store/slices/adminSlice.js";

test("verification history uses the bounded cursor and appends unique rows", async () => {
  const originalAdapter = api.defaults.adapter;
  const requests = [];
  api.defaults.adapter = async (config) => {
    requests.push(config);
    const isMore = config.params?.cursor === "opaque-next";
    return {
      config,
      data: {
        data: isMore ? [{ _id: "b", status: "approved" }, { _id: "c", status: "pending" }] : [{ _id: "a", status: "pending" }, { _id: "b", status: "approved" }],
        page: isMore
          ? { limit: 25, hasMore: false, nextCursor: null }
          : { limit: 25, hasMore: true, nextCursor: "opaque-next" },
      },
      headers: {}, status: 200, statusText: "OK",
    };
  };

  try {
    const store = configureStore({ reducer: { verificationRequests: verificationRequestReducer } });
    await store.dispatch(fetchMyVerificationRequests());
    await store.dispatch(fetchMyVerificationRequests({ cursor: "opaque-next", limit: 25 }));
    assert.equal(requests[0].url, "/api/users/verification-requests");
    assert.deepEqual(requests[0].params, { limit: 25 });
    assert.deepEqual(requests[1].params, { limit: 25, cursor: "opaque-next" });
    assert.deepEqual(store.getState().verificationRequests.items.map((item) => item._id), ["a", "b", "c"]);
    assert.equal(store.getState().verificationRequests.page.hasMore, false);
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("first-time BGMI verification uses the same private evidence contract", async () => {
  const originalAdapter = api.defaults.adapter;
  let request;
  api.defaults.adapter = async (config) => {
    request = config;
    return { config, data: { data: { _id: "initial-1", status: "pending" } }, headers: {}, status: 201, statusText: "Created" };
  };
  try {
    const store = configureStore({ reducer: { verificationRequests: verificationRequestReducer } });
    await store.dispatch(submitGameAccountVerification({
      gameKey: "bgmi",
      accountId: "987654321",
      accountUsername: "FirstPlayer",
      evidence: new Blob(["image"], { type: "image/jpeg" }),
      evidenceNote: "Initial profile screenshot",
      fraudAcknowledged: true,
    })).unwrap();
    assert.equal(request.url, "/api/users/verification-requests");
    assert.equal(request.data.get("gameKey"), "bgmi");
    assert.equal(request.data.get("accountId"), "987654321");
    assert.equal(request.data.get("fraudAcknowledged"), "true");
    assert.equal(request.data.get("evidence").type, "image/jpeg");
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("BGMI replacement sends only bounded identity evidence and fraud acknowledgement", async () => {
  const originalAdapter = api.defaults.adapter;
  let request;
  api.defaults.adapter = async (config) => {
    request = config;
    return { config, data: { data: { request: { id: "replacement-1", status: "pending" } } }, headers: {}, status: 201, statusText: "Created" };
  };
  try {
    const store = configureStore({ reducer: { verificationRequests: verificationRequestReducer } });
    const evidence = new Blob(["image"], { type: "image/png" });
    await store.dispatch(submitGameAccountReplacement({
      gameKey: "bgmi",
      accountId: "123456789",
      accountUsername: "NewPlayer",
      evidence,
      evidenceNote: "Profile screenshot",
      fraudAcknowledged: true,
      userId: "must-not-send",
    })).unwrap();
    assert.equal(request.method, "post");
    assert.equal(request.url, "/api/users/game-accounts/bgmi/replacement-requests");
    assert.equal(request.data.get("accountId"), "123456789");
    assert.equal(request.data.get("accountUsername"), "NewPlayer");
    assert.equal(request.data.get("fraudAcknowledged"), "true");
    assert.equal(request.data.has("userId"), false);
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("admin verification queue preserves the selected state and uses its opaque cursor", async () => {
  const originalAdapter = api.defaults.adapter;
  const requests = [];
  api.defaults.adapter = async (config) => {
    requests.push(config);
    return { config, data: { data: [{ _id: config.params.cursor ? "old" : "new", status: "pending" }], page: { limit: 25, hasMore: !config.params.cursor, nextCursor: config.params.cursor ? null : "next" } }, headers: {}, status: 200, statusText: "OK" };
  };
  try {
    const store = configureStore({ reducer: { admin: adminReducer.reducer } });
    await store.dispatch(findVerificationRequests({ status: "pending", limit: 25 }));
    await store.dispatch(findVerificationRequests({ status: "pending", cursor: "next", limit: 25 }));
    assert.deepEqual(requests[1].params, { status: "pending", limit: 25, cursor: "next" });
    assert.deepEqual(store.getState().admin.verificationRequests.map((item) => item._id), ["new", "old"]);
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});
