import assert from "node:assert/strict";
import test from "node:test";
import { configureStore } from "@reduxjs/toolkit";
import api from "../src/api/axios-api.js";
import { isSessionAuthenticationError, normalizeApiError } from "../src/api/apiError.js";
import sessionLifecycleMiddleware from "../src/store/middleware/sessionLifecycleMiddleware.js";
import { sessionInvalidated } from "../src/store/actions/sessionActions.js";
import { initiateRazorpayOrder } from "../src/store/slices/paymentSlice.js";

test("only session failures trigger authentication recovery, including uncoded legacy 401s", () => {
  for (const code of ["SESSION_INVALID", "ACCESS_TOKEN_EXPIRED", "ACCESS_TOKEN_MISSING", "ACCESS_TOKEN_INVALID", undefined]) {
    assert.equal(isSessionAuthenticationError(normalizeApiError({
      isAxiosError: true, response: { status: 401, data: { error: { code } } },
    })), true);
  }
  assert.equal(isSessionAuthenticationError({ status: 401, code: "PAYMENT_PROVIDER_AUTH_FAILED" }), false);
  assert.equal(isSessionAuthenticationError({ status: 503, code: "SESSION_STORE_UNAVAILABLE" }), false);
});

test("a provider 401 is surfaced once without retrying checkout or expiring the player session", async () => {
  const adapter = api.defaults.adapter;
  let requests = 0;
  api.defaults.adapter = async (config) => {
    requests += 1;
    const error = new Error("provider credentials rejected");
    Object.assign(error, {
      config, isAxiosError: true,
      response: { status: 401, data: { error: { code: "PAYMENT_PROVIDER_AUTH_FAILED", message: "Provider unavailable." } } },
    });
    throw error;
  };
  const store = configureStore({
    reducer: (state = { invalidations: 0, player: { summary: { role: "player" } }, requestScope: { activeRequestIds: {} } }, action) => {
      if (sessionInvalidated.match(action)) return { ...state, invalidations: state.invalidations + 1 };
      if (action.meta?.requestId && action.type.endsWith("/pending")) {
        return { ...state, requestScope: { activeRequestIds: { [action.meta.requestId]: true } } };
      }
      return state;
    },
    middleware: (defaults) => defaults().prepend(sessionLifecycleMiddleware.middleware),
  });
  try {
    const result = await store.dispatch(initiateRazorpayOrder({ amountMinor: 100 }));
    assert.equal(result.payload.code, "PAYMENT_PROVIDER_AUTH_FAILED");
    assert.equal(requests, 1);
    assert.equal(store.getState().invalidations, 0);
    // Genuine auth loss on the same registered request still closes access.
    store.dispatch(initiateRazorpayOrder.rejected(null, result.meta.requestId, {}, {
      status: 401, code: "SESSION_INVALID",
    }));
    assert.equal(store.getState().invalidations, 1);
  } finally { api.defaults.adapter = adapter; }
});
