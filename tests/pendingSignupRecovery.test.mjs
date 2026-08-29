import test from "node:test";
import assert from "node:assert/strict";
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
