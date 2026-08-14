import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("recent authentication remains a password-only Redux transport from Account Settings", async () => {
  const [authSlice, accountSettings] = await Promise.all([
    readFile(new URL("../src/store/slices/authSlice.js", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/AccountSettings.jsx", import.meta.url), "utf8"),
  ]);

  assert.match(authSlice, /path: "\/api\/auth\/reauthenticate"/);
  assert.match(authSlice, /method: "post"/);
  assert.match(accountSettings, /confirmSensitiveAction\(password\)/);
  assert.match(accountSettings, /Current password for sensitive actions/);
  assert.match(accountSettings, /expires after 15 minutes/);
  assert.doesNotMatch(accountSettings, /recentAuthAt.*localStorage|localStorage.*recentAuthAt/);
});
