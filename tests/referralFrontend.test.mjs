import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { configureStore } from "@reduxjs/toolkit";
import api from "../src/api/axios-api.js";
import referralSlice, { fetchMyReferrals } from "../src/store/slices/referralSlice.js";
import {
  MAX_REFERRAL_AGE_MS,
  clearCapturedReferral,
  loadCapturedReferral,
  saveCapturedReferral,
} from "../src/utils/referralCapture.js";

const storage = () => {
  const entries = new Map();
  return {
    getItem: (key) => entries.get(key) ?? null,
    removeItem: (key) => entries.delete(key),
    setItem: (key, value) => entries.set(key, value),
  };
};

test("referral links retain a bounded normalized code through signup", () => {
  const target = storage();
  assert.equal(saveCapturedReferral(" plyInvite01 ", target, 1_000), true);
  assert.equal(loadCapturedReferral(target, 2_000), "PLYINVITE01");
  assert.equal(loadCapturedReferral(target, 1_000 + MAX_REFERRAL_AGE_MS), "");
  assert.equal(saveCapturedReferral("not valid!", target), false);
  clearCapturedReferral(target);
});

test("referral Redux read uses the protected player boundary", async () => {
  const original = api.defaults.adapter;
  api.defaults.adapter = async (config) => ({
    config,
    data: { data: { code: "PLY001", counts: { rewarded: 1 }, invites: [], rewardMinor: 1000, totalEarnedMinor: 1000 } },
    headers: {},
    status: 200,
    statusText: "OK",
  });
  try {
    const store = configureStore({ reducer: { referrals: referralSlice.reducer } });
    const result = await store.dispatch(fetchMyReferrals()).unwrap();
    assert.equal(result.code, "PLY001");
    assert.equal(store.getState().referrals.data.totalEarnedMinor, 1000);
  } finally {
    api.defaults.adapter = original;
  }
});

test("Refer and Earn presents exact qualification and spending rules", async () => {
  const [refer, signup, routes] = await Promise.all([
    readFile(new URL("../src/pages/Refer.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/SignUp.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/routes/publicRoutes.jsx", import.meta.url), "utf8"),
  ]);
  assert.match(refer, /Earn ₹10 tournament credit/);
  assert.match(refer, /verify their email and complete their first tournament/);
  assert.match(refer, /cannot be withdrawn, transferred, or converted to cash/);
  assert.match(refer, /window\.location\.origin/);
  assert.doesNotMatch(refer, /egaming\.example/);
  assert.match(signup, /referralCode/);
  assert.match(signup, /Referral applied/);
  assert.match(signup, /Referral code \(optional\)/);
  assert.match(routes, /REFERRAL_LANDING/);
});
