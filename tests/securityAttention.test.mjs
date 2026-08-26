import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { configureStore } from "@reduxjs/toolkit";
import api from "../src/api/axios-api.js";
import slice, { fetchSecurityAttention } from "../src/store/slices/securityAttentionSlice.js";

const response = (config, events, page) => ({ config, data: { data: { events, page, summary: { highSeverityLast24Hours: 1, last24Hours: 2, retentionDays: 90 } } }, headers: {}, status: 200, statusText: "OK" });

test("security attention refresh and pagination use only the opaque governance cursor", async () => {
  const original = api.defaults.adapter;
  const requests = [];
  api.defaults.adapter = async (config) => {
    requests.push(config);
    return requests.length === 1
      ? response(config, [{ id: "one" }], { hasMore: true, nextCursor: "opaque" })
      : response(config, [{ id: "one" }, { id: "two" }], { hasMore: false, nextCursor: null });
  };
  try {
    const store = configureStore({ reducer: { securityAttention: slice.reducer } });
    await store.dispatch(fetchSecurityAttention({})).unwrap();
    await store.dispatch(fetchSecurityAttention({ cursor: "opaque" })).unwrap();
    assert.equal(requests[0].url, "/api/admin/security-events");
    assert.deepEqual(requests[0].params, { limit: 25 });
    assert.deepEqual(requests[1].params, { cursor: "opaque", limit: 25 });
    assert.deepEqual(store.getState().securityAttention.events.map((item) => item.id), ["one", "two"]);
  } finally { api.defaults.adapter = original; }
});

test("security UI is compact and review-only", async () => {
  const source = await readFile(new URL("../src/components/adminComponents/SecurityAttention.jsx", import.meta.url), "utf8");
  assert.match(source, /Retained authentication signals/);
  assert.doesNotMatch(source, /Raw credentials|full identity hashes/);
  assert.match(source, /Load older signals/);
  assert.doesNotMatch(source, /ban user|revoke session|delete event/i);
});
