import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("recent authentication remains password-only and protected staff commands open an inline challenge", async () => {
  const [authSlice, accountSettings, apiThunk, staffLayout, dialog] = await Promise.all([
    readFile(new URL("../src/store/slices/authSlice.js", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/AccountSettings.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/store/thunks/createApiThunk.js", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/StaffLayout.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/common/SensitiveActionDialog.jsx", import.meta.url), "utf8"),
  ]);

  assert.match(authSlice, /path: "\/api\/auth\/reauthenticate"/);
  assert.match(authSlice, /method: "post"/);
  assert.match(accountSettings, /confirmSensitiveAction\(password\)/);
  assert.match(accountSettings, /Current password for sensitive actions/);
  assert.match(accountSettings, /expires after 15 minutes/);
  assert.doesNotMatch(accountSettings, /recentAuthAt.*localStorage|localStorage.*recentAuthAt/);
  assert.match(apiThunk, /RECENT_AUTHENTICATION_REQUIRED/);
  assert.match(apiThunk, /user\?\.role === "staff"/);
  assert.match(apiThunk, /recentAuthenticationRetried = true/);
  assert.match(staffLayout, /<SensitiveActionDialog \/>/);
  assert.match(dialog, /confirmSensitiveAction\(password\)/);
  assert.doesNotMatch(dialog, /localStorage|sessionStorage/);
});
