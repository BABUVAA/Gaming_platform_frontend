import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { configureStore } from "@reduxjs/toolkit";
import api from "../src/api/axios-api.js";
import slice, {
  fetchStaffProfileActivity,
} from "../src/store/slices/accessControlSlice.js";

test("staff profile history uses the bounded governance activity contract", async () => {
  const originalAdapter = api.defaults.adapter;
  let request;
  api.defaults.adapter = async (config) => {
    request = config;
    return { config, data: { data: { activity: [] } }, headers: {}, status: 200, statusText: "OK" };
  };
  try {
    const store = configureStore({ reducer: { accessControl: slice.reducer } });
    await store.dispatch(fetchStaffProfileActivity("staff-user-1")).unwrap();
    assert.equal(request.method, "get");
    assert.equal(request.url, "/api/access-control/activity");
    assert.equal(request.params.userId, "staff-user-1");
    assert.equal(request.params.limit, 50);
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("directory profile is compact, read-only, and keeps role actions outside the drawer", async () => {
  const source = await readFile(new URL("../src/components/adminComponents/RoleManagement.jsx", import.meta.url), "utf8");
  const drawer = source.slice(source.indexOf("const StaffProfileDrawer"), source.indexOf("const HistoryPanel"));
  assert.match(drawer, /Active roles/);
  assert.match(drawer, /Recent service actions/);
  assert.match(drawer, /Recent service and access history/);
  assert.doesNotMatch(drawer, /Suspend|Restore|Revoke|Reassign|Save scope/);
});
