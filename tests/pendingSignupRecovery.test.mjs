import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  MAX_PENDING_AGE_MS,
  clearPendingSignup,
  loadPendingSignup,
  savePendingSignup,
} from "../src/utils/pendingSignupRecovery.js";

const createStorage = () => {
  const entries = new Map();
  return {
    getItem: (key) => entries.get(key) ?? null,
    removeItem: (key) => entries.delete(key),
    setItem: (key, value) => entries.set(key, value),
  };
};

test("pending signup verification survives a page reload", () => {
  const storage = createStorage();
  const registration = {
    email: "Player@example.com",
    requiresEmailVerification: true,
    verificationEmailSent: true,
  };
  savePendingSignup(registration, storage, 1_000);

  assert.deepEqual(loadPendingSignup(storage, 2_000), registration);
  clearPendingSignup(storage);
  assert.equal(loadPendingSignup(storage, 2_000), null);
});

test("expired or malformed recovery state is discarded", () => {
  const storage = createStorage();
  savePendingSignup(
    { email: "Player@example.com", requiresEmailVerification: true },
    storage,
    1_000,
  );
  assert.equal(
    loadPendingSignup(storage, 1_000 + MAX_PENDING_AGE_MS),
    null,
  );

  storage.setItem("egaming.pending-signup", "not-json");
  assert.equal(loadPendingSignup(storage), null);
});

test("recovered signup stores the username but never credentials or OTP", () => {
  const storage = createStorage();
  savePendingSignup(
    {
      email: "Player@example.com",
      requiresEmailVerification: true,
      verificationEmailSent: true,
      recovered: true,
      recoveryUsername: "new_player",
      password: "NeverStoreThis1!",
      confirmPassword: "NeverStoreThis1!",
      verificationCode: "123456",
    },
    storage,
    1_000,
  );

  assert.deepEqual(loadPendingSignup(storage, 2_000), {
    email: "Player@example.com",
    requiresEmailVerification: true,
    verificationEmailSent: true,
    recovered: true,
    recoveryUsername: "new_player",
  });
});

test("recovered signup verifies the new username and password with the OTP", () => {
  const signupSource = readFileSync(
    new URL("../src/pages/SignUp.jsx", import.meta.url),
    "utf8",
  );
  const authSource = readFileSync(
    new URL("../src/store/slices/authSlice.js", import.meta.url),
    "utf8",
  );

  assert.match(authSource, /recovered: registration\.recovered === true/);
  assert.match(signupSource, /pendingRegistration\.recovered/);
  assert.match(signupSource, /username: validator\.trim\(recoveryDetails\.username\)/);
  assert.match(signupSource, /password: recoveryDetails\.password/);
  assert.match(signupSource, /only be\s+saved after the email code is verified/);
});
