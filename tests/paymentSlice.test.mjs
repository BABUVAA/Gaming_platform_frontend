import assert from "node:assert/strict";
import test from "node:test";
import { configureStore } from "@reduxjs/toolkit";
import api from "../src/api/axios-api.js";
import paymentSlice, {
  fetchWalletLedger,
  fetchWalletBalance,
  fetchPaymentCapabilities,
  initiateRazorpayOrder,
  verifyRazorpayPayment,
  WALLET_LEDGER_PAGE_LIMIT,
} from "../src/store/slices/paymentSlice.js";

test("staff utility mode never starts a wallet top-up transport", async () => {
  const originalAdapter = api.defaults.adapter;
  let requestCount = 0;
  api.defaults.adapter = async (config) => {
    requestCount += 1;
    return { config, data: {}, headers: {}, status: 200, statusText: "OK" };
  };

  try {
    const store = configureStore({
      reducer: {
        payment: paymentSlice.reducer,
        player: () => ({ summary: { role: "staff" } }),
      },
    });
    const action = await store.dispatch(initiateRazorpayOrder({ amountMinor: 10000 }));

    assert.equal(action.meta.condition, true);
    assert.equal(requestCount, 0);
    assert.equal(store.getState().payment.isLoading, false);
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("player wallet top-up sends only the canonical minor-unit amount", async () => {
  const originalAdapter = api.defaults.adapter;
  let observedConfig;
  api.defaults.adapter = async (config) => {
    observedConfig = config;
    return {
      config,
      data: { data: { amount: 1250, currency: "INR", orderId: "order_test" } },
      headers: {},
      status: 200,
      statusText: "OK",
    };
  };

  try {
    const store = configureStore({
      reducer: {
        payment: paymentSlice.reducer,
        player: () => ({ summary: { role: "player" } }),
      },
    });
    const action = await store.dispatch(initiateRazorpayOrder({ amountMinor: 1250 }));

    assert.equal(action.type, initiateRazorpayOrder.fulfilled.type);
    assert.equal(observedConfig.url, "/api/payment/create-order");
    assert.deepEqual(JSON.parse(observedConfig.data), { amountMinor: 1250 });
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("Razorpay verification forwards only the three signed checkout fields", async () => {
  const originalAdapter = api.defaults.adapter;
  let observedConfig;
  api.defaults.adapter = async (config) => {
    observedConfig = config;
    return { config, data: { data: { verified: true } }, headers: {}, status: 200, statusText: "OK" };
  };
  try {
    const store = configureStore({
      reducer: {
        payment: paymentSlice.reducer,
        player: () => ({ summary: { role: "player" } }),
      },
    });
    const fields = {
      razorpay_order_id: "order_test",
      razorpay_payment_id: "pay_test",
      razorpay_signature: "a".repeat(64),
    };
    const action = await store.dispatch(verifyRazorpayPayment(fields));
    assert.equal(action.type, verifyRazorpayPayment.fulfilled.type);
    assert.equal(observedConfig.url, "/api/payment/verify-payment");
    assert.deepEqual(JSON.parse(observedConfig.data), fields);
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("payment capability read stores the server-owned deposit release state", async () => {
  const originalAdapter = api.defaults.adapter;
  let observedConfig;
  api.defaults.adapter = async (config) => {
    observedConfig = config;
    return {
      config,
      data: { data: {
        deposits: { available: true, currency: "INR", provider: "razorpay" },
        moneyMode: "sandbox",
        testMoney: true,
        withdrawalsAvailable: false,
      } },
      headers: {},
      status: 200,
      statusText: "OK",
    };
  };

  try {
    const store = configureStore({ reducer: { payment: paymentSlice.reducer } });
    const action = await store.dispatch(fetchPaymentCapabilities());
    assert.equal(action.type, fetchPaymentCapabilities.fulfilled.type);
    assert.equal(observedConfig.url, "/api/payment/capabilities");
    assert.deepEqual(store.getState().payment.capabilities, {
      depositAvailable: true,
      depositProvider: "razorpay",
      moneyMode: "sandbox",
      status: "succeeded",
      testMoney: true,
      withdrawalsAvailable: false,
    });
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

const ledgerEntry = (id, overrides = {}) => ({
  createdAt: `2026-08-09T10:00:0${id}.000Z`,
  currency: "INR",
  id,
  legs: [
    {
      account: "available",
      amountMinor: 200,
      direction: "credit",
    },
  ],
  referenceType: "transaction",
  type: "deposit",
  ...overrides,
});

test("wallet read stores canonical minor-unit settlement buckets", async () => {
  const originalAdapter = api.defaults.adapter;
  api.defaults.adapter = async (config) => ({
    config,
    data: {
      availableMinor: 12500,
      currency: "INR",
      entryHeldMinor: 2500,
      platformTransactions: [],
      prizePendingMinor: 5000,
      realTransactions: [],
      withdrawableMinor: 7500,
      withdrawalPendingMinor: 1000,
    },
    headers: {},
    status: 200,
    statusText: "OK",
  });

  try {
    const store = configureStore({ reducer: { payment: paymentSlice.reducer } });
    const action = await store.dispatch(fetchWalletBalance());
    const wallet = store.getState().payment.wallet;

    assert.equal(action.type, fetchWalletBalance.fulfilled.type);
    assert.equal(wallet.availableMinor, 12500);
    assert.equal(wallet.entryHeldMinor, 2500);
    assert.equal(wallet.prizePendingMinor, 5000);
    assert.equal(wallet.withdrawableMinor, 7500);
    assert.equal(wallet.withdrawalPendingMinor, 1000);
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("ledger read sends the bounded canonical request and stores its first page", async () => {
  const originalAdapter = api.defaults.adapter;
  let observedConfig;
  api.defaults.adapter = async (config) => {
    observedConfig = config;
    return {
      config,
      data: {
        data: {
          entries: [ledgerEntry("1")],
          page: {
            hasMore: true,
            limit: WALLET_LEDGER_PAGE_LIMIT,
            nextCursor: "cursor-1",
          },
        },
      },
      headers: {},
      status: 200,
      statusText: "OK",
    };
  };

  try {
    const store = configureStore({ reducer: { payment: paymentSlice.reducer } });
    const action = await store.dispatch(fetchWalletLedger());
    const ledger = store.getState().payment.ledger;

    assert.equal(action.type, fetchWalletLedger.fulfilled.type);
    assert.equal(observedConfig.url, "/api/payment/ledger");
    assert.deepEqual(observedConfig.params, {
      limit: WALLET_LEDGER_PAGE_LIMIT,
    });
    assert.deepEqual(ledger.entries.map((entry) => entry.id), ["1"]);
    assert.equal(ledger.page.hasMore, true);
    assert.equal(ledger.page.nextCursor, "cursor-1");
    assert.equal(ledger.isLoading, false);
    assert.equal(ledger.error, null);
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("ledger pagination appends without duplicates and forwards only the server cursor", async () => {
  const originalAdapter = api.defaults.adapter;
  const observedParams = [];
  api.defaults.adapter = async (config) => {
    observedParams.push(config.params);
    const isNextPage = Boolean(config.params.cursor);
    return {
      config,
      data: {
        data: isNextPage
          ? {
              entries: [ledgerEntry("1"), ledgerEntry("2")],
              page: {
                hasMore: false,
                limit: WALLET_LEDGER_PAGE_LIMIT,
                nextCursor: null,
              },
            }
          : {
              entries: [ledgerEntry("1")],
              page: {
                hasMore: true,
                limit: WALLET_LEDGER_PAGE_LIMIT,
                nextCursor: "opaque-cursor",
              },
            },
      },
      headers: {},
      status: 200,
      statusText: "OK",
    };
  };

  try {
    const store = configureStore({ reducer: { payment: paymentSlice.reducer } });
    await store.dispatch(fetchWalletLedger());
    await store.dispatch(fetchWalletLedger({ cursor: "opaque-cursor" }));
    const ledger = store.getState().payment.ledger;

    assert.deepEqual(observedParams[1], {
      cursor: "opaque-cursor",
      limit: WALLET_LEDGER_PAGE_LIMIT,
    });
    assert.deepEqual(ledger.entries.map((entry) => entry.id), ["1", "2"]);
    assert.equal(ledger.page.hasMore, false);
    assert.equal(ledger.page.nextCursor, null);
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("ledger refresh replaces stale pages and a later error preserves loaded history", async () => {
  const originalAdapter = api.defaults.adapter;
  let requestNumber = 0;
  api.defaults.adapter = async (config) => {
    requestNumber += 1;
    if (requestNumber === 3) {
      const error = new Error("Request failed");
      error.isAxiosError = true;
      error.response = {
        data: {
          error: {
            code: "LEDGER_TEMPORARILY_UNAVAILABLE",
            fields: {},
            message: "Ledger history is temporarily unavailable.",
          },
        },
        headers: {},
        status: 503,
      };
      throw error;
    }

    return {
      config,
      data: {
        data: {
          entries: [ledgerEntry(requestNumber === 1 ? "old" : "fresh")],
          page: {
            hasMore: false,
            limit: WALLET_LEDGER_PAGE_LIMIT,
            nextCursor: null,
          },
        },
      },
      headers: {},
      status: 200,
      statusText: "OK",
    };
  };

  try {
    const store = configureStore({ reducer: { payment: paymentSlice.reducer } });
    await store.dispatch(fetchWalletLedger());
    await store.dispatch(fetchWalletLedger());
    const failedAction = await store.dispatch(fetchWalletLedger());
    const ledger = store.getState().payment.ledger;

    assert.equal(failedAction.type, fetchWalletLedger.rejected.type);
    assert.deepEqual(ledger.entries.map((entry) => entry.id), ["fresh"]);
    assert.equal(
      ledger.error.message,
      "Ledger history is temporarily unavailable.",
    );
    assert.equal(ledger.isLoading, false);
    assert.equal(ledger.isLoadingMore, false);
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("a slower stale ledger response cannot replace a newer refresh", async () => {
  const originalAdapter = api.defaults.adapter;
  let requestNumber = 0;
  let resolveFirstRequest;
  api.defaults.adapter = async (config) => {
    requestNumber += 1;
    if (requestNumber === 1) {
      return new Promise((resolve) => {
        resolveFirstRequest = () =>
          resolve({
            config,
            data: {
              data: {
                entries: [ledgerEntry("stale")],
                page: { hasMore: false, limit: 20, nextCursor: null },
              },
            },
            headers: {},
            status: 200,
            statusText: "OK",
          });
      });
    }
    return {
      config,
      data: {
        data: {
          entries: [ledgerEntry("fresh")],
          page: { hasMore: false, limit: 20, nextCursor: null },
        },
      },
      headers: {},
      status: 200,
      statusText: "OK",
    };
  };

  try {
    const store = configureStore({ reducer: { payment: paymentSlice.reducer } });
    const staleRequest = store.dispatch(fetchWalletLedger());
    await store.dispatch(fetchWalletLedger());
    resolveFirstRequest();
    await staleRequest;

    assert.deepEqual(
      store.getState().payment.ledger.entries.map((entry) => entry.id),
      ["fresh"],
    );
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});
