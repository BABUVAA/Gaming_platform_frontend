import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Login verifies cookie delivery without prompting normal players", async () => {
  const loginSource = await readFile(
    new URL("../src/pages/Login.jsx", import.meta.url),
    "utf8",
  );
  const authSource = await readFile(
    new URL("../src/store/slices/authSlice.js", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(loginSource, /Allow required login cookies/);
  assert.doesNotMatch(loginSource, /authCookieConsent/);
  assert.match(loginSource, /Login cookies are blocked/);
  assert.match(authSource, /confirmAuthenticationCookies/);
  assert.match(authSource, /AUTH_COOKIE_BLOCKED/);
});
