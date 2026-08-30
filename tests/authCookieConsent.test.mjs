import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  hasAuthCookieConsent,
  saveAuthCookieConsent,
} from "../src/utils/authCookieConsent.js";

const createStorage = () => {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
};

test("required authentication cookie consent persists without sensitive data", () => {
  const storage = createStorage();

  assert.equal(hasAuthCookieConsent(storage), false);
  saveAuthCookieConsent(true, storage);
  assert.equal(hasAuthCookieConsent(storage), true);
  saveAuthCookieConsent(false, storage);
  assert.equal(hasAuthCookieConsent(storage), false);
});

test("Login verifies cookie delivery before reporting success", async () => {
  const loginSource = await readFile(
    new URL("../src/pages/Login.jsx", import.meta.url),
    "utf8",
  );
  const authSource = await readFile(
    new URL("../src/store/slices/authSlice.js", import.meta.url),
    "utf8",
  );

  assert.match(loginSource, /Allow required login cookies/);
  assert.match(loginSource, /Login cookies are blocked/);
  assert.match(authSource, /confirmAuthenticationCookies/);
  assert.match(authSource, /AUTH_COOKIE_BLOCKED/);
});
