import assert from "node:assert/strict";
import test from "node:test";
import { configureStore } from "@reduxjs/toolkit";
import api from "../src/api/axios-api.js";
import slice, {
  fetchPaymentReconciliationQueue,
  verifySandboxPayment,
} from "../src/store/slices/paymentReconciliationReviewSlice.js";

const response = (config, data) => ({
  config,
  data: { data },
  headers: {},
  status: 200,
  statusText: "OK",
});

const createStore = () =>
  configureStore({ reducer: { paymentReconciliationReview: slice.reducer } });

test("sandbox payment monitoring uses bounded server cursors and appends without duplicates", async () => {
  const original = api.defaults.adapter;
  const requests = [];
  api.defaults.adapter = async (config) => {
    requests.push(config);
    const cursor = config.params?.cursor;
    return response(config, {
      items: cursor
        ? [{ id: "job-2", status: "completed" }, { id: "job-3", status: "queued" }]
        : [{ id: "job-1", status: "queued" }, { id: "job-2", status: "queued" }],
      page: cursor
        ? { hasMore: false, limit: 25, nextCursor: null }
        : { hasMore: true, limit: 25, nextCursor: "cursor-2" },
    });
  };
  try {
    const store = createStore();
    await store.dispatch(fetchPaymentReconciliationQueue({ status: "queued" }));
    await store.dispatch(fetchPaymentReconciliationQueue({ cursor: "cursor-2", status: "queued" }));
    assert.equal(requests[0].url, "/api/admin/payment-reconciliation");
    assert.deepEqual(requests[0].params, { limit: 25, status: "queued" });
    assert.deepEqual(requests[1].params, { cursor: "cursor-2", limit: 25, status: "queued" });
    assert.deepEqual(
      store.getState().paymentReconciliationReview.items.map((item) => item.id),
      ["job-1", "job-2", "job-3"],
    );
    assert.equal(store.getState().paymentReconciliationReview.page.hasMore, false);
  } finally {
    api.defaults.adapter = original;
  }
});

test("manual verification sends only job identity in the path and replaces that row", async () => {
  const original = api.defaults.adapter;
  let request;
  api.defaults.adapter = async (config) => {
    request = config;
    return response(config, {
      job: { id: "job-1", status: "completed", actions: { canVerify: false } },
    });
  };
  try {
    const store = createStore();
    store.dispatch({
      type: fetchPaymentReconciliationQueue.fulfilled.type,
      payload: {
        items: [{ id: "job-1", status: "queued" }],
        page: { hasMore: false, limit: 25, nextCursor: null },
      },
      meta: { arg: {}, requestId: null },
    });
    const action = await store.dispatch(verifySandboxPayment({ jobId: "job-1" }));
    assert.equal(action.type, verifySandboxPayment.fulfilled.type);
    assert.equal(request.method, "post");
    assert.equal(request.url, "/api/admin/payment-reconciliation/job-1/verify");
    assert.deepEqual(JSON.parse(request.data), {});
    assert.equal(store.getState().paymentReconciliationReview.items[0].status, "completed");
  } finally {
    api.defaults.adapter = original;
  }
});
