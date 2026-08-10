import assert from "node:assert/strict";
import test from "node:test";
import { configureStore } from "@reduxjs/toolkit";
import api from "../src/api/axios-api.js";
import prizeReleaseReviewSlice, {
  fetchPrizeReleaseQueue,
  PRIZE_RELEASE_PAGE_LIMIT,
  releaseMatchPrize,
} from "../src/store/slices/prizeReleaseReviewSlice.js";

const createStore = () =>
  configureStore({
    reducer: { prizeReleaseReview: prizeReleaseReviewSlice.reducer },
  });

const queueItem = (matchId, overrides = {}) => ({
  currency: "INR",
  gameKey: "bgmi",
  matchId,
  offering: { id: "offering-1", title: "BGMI Classic" },
  result: {
    disputeDeadline: "2026-08-09T10:30:00.000Z",
    disputeResolutionNote: "",
    disputeResolvedAt: null,
    disputedAt: null,
    finalScore: "Winner confirmed",
    proofNote: "Result screenshot reviewed.",
    verifiedAt: "2026-08-09T10:00:00.000Z",
  },
  review: { blockedReason: null, canRelease: true },
  settledAt: "2026-08-09T11:00:00.000Z",
  settledBy: {
    displayName: "Settlement Admin",
    id: "admin-1",
    profileTag: "settler",
  },
  title: `Match ${matchId}`,
  totalMinor: 8000,
  winners: [
    {
      amountMinor: 8000,
      displayName: "Winner",
      profileTag: "winner",
      userId: "winner-1",
    },
  ],
  ...overrides,
});

const response = (config, data) => ({
  config,
  data,
  headers: {},
  status: 200,
  statusText: "OK",
});

test("prize review queue uses the bounded governance transport contract", async () => {
  const originalAdapter = api.defaults.adapter;
  let requestConfig;
  api.defaults.adapter = async (config) => {
    requestConfig = config;
    return response(config, {
      data: {
        items: [queueItem("match-1")],
        page: {
          hasMore: true,
          limit: PRIZE_RELEASE_PAGE_LIMIT,
          nextCursor: "opaque-cursor",
        },
      },
    });
  };

  try {
    const store = createStore();
    const action = await store.dispatch(fetchPrizeReleaseQueue());
    const state = store.getState().prizeReleaseReview;

    assert.equal(action.type, fetchPrizeReleaseQueue.fulfilled.type);
    assert.equal(requestConfig.url, "/api/admin/prize-releases");
    assert.deepEqual(requestConfig.params, { limit: PRIZE_RELEASE_PAGE_LIMIT });
    assert.deepEqual(state.items.map((item) => item.matchId), ["match-1"]);
    assert.equal(state.page.nextCursor, "opaque-cursor");
    assert.equal(state.queueStatus, "succeeded");
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("prize review pagination forwards the opaque cursor and de-duplicates Matches", async () => {
  const originalAdapter = api.defaults.adapter;
  const requests = [];
  api.defaults.adapter = async (config) => {
    requests.push(config);
    const isNextPage = Boolean(config.params.cursor);
    return response(config, {
      data: isNextPage
        ? {
            items: [queueItem("match-1"), queueItem("match-2")],
            page: {
              hasMore: false,
              limit: PRIZE_RELEASE_PAGE_LIMIT,
              nextCursor: null,
            },
          }
        : {
            items: [queueItem("match-1")],
            page: {
              hasMore: true,
              limit: PRIZE_RELEASE_PAGE_LIMIT,
              nextCursor: "opaque-cursor",
            },
          },
    });
  };

  try {
    const store = createStore();
    await store.dispatch(fetchPrizeReleaseQueue());
    await store.dispatch(fetchPrizeReleaseQueue({ cursor: "opaque-cursor" }));
    const state = store.getState().prizeReleaseReview;

    assert.deepEqual(requests[1].params, {
      cursor: "opaque-cursor",
      limit: PRIZE_RELEASE_PAGE_LIMIT,
    });
    assert.deepEqual(state.items.map((item) => item.matchId), [
      "match-1",
      "match-2",
    ]);
    assert.equal(state.page.hasMore, false);
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("only the newest queue response may replace refreshed review state", async () => {
  const originalAdapter = api.defaults.adapter;
  const pending = [];
  api.defaults.adapter = (config) =>
    new Promise((resolve) => pending.push({ config, resolve }));

  try {
    const store = createStore();
    const olderRequest = store.dispatch(fetchPrizeReleaseQueue());
    const newerRequest = store.dispatch(fetchPrizeReleaseQueue());
    await new Promise((resolve) => setTimeout(resolve, 0));

    pending[1].resolve(
      response(pending[1].config, {
        data: {
          items: [queueItem("new-match")],
          page: { hasMore: false, limit: 20, nextCursor: null },
        },
      }),
    );
    await newerRequest;
    pending[0].resolve(
      response(pending[0].config, {
        data: {
          items: [queueItem("stale-match")],
          page: { hasMore: false, limit: 20, nextCursor: null },
        },
      }),
    );
    await olderRequest;

    assert.deepEqual(
      store.getState().prizeReleaseReview.items.map((item) => item.matchId),
      ["new-match"],
    );
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("release is path-owned, sends an empty body, and removes the completed review", async () => {
  const originalAdapter = api.defaults.adapter;
  const requests = [];
  api.defaults.adapter = async (config) => {
    requests.push(config);
    if (config.method === "get") {
      return response(config, {
        data: {
          items: [queueItem("match-1")],
          page: { hasMore: false, limit: 20, nextCursor: null },
        },
      });
    }
    return response(config, {
      data: {
        release: {
          currency: "INR",
          matchId: "match-1",
          releasedAt: "2026-08-09T12:00:00.000Z",
          releasedBy: {
            displayName: "Independent Admin",
            id: "admin-2",
            profileTag: "reviewer",
          },
          totalMinor: 8000,
          winners: queueItem("match-1").winners,
        },
      },
      message: "Prize released.",
    });
  };

  try {
    const store = createStore();
    await store.dispatch(fetchPrizeReleaseQueue());
    const action = await store.dispatch(releaseMatchPrize({ matchId: "match-1" }));
    const releaseRequest = requests[1];
    const state = store.getState().prizeReleaseReview;

    assert.equal(action.type, releaseMatchPrize.fulfilled.type);
    assert.equal(
      releaseRequest.url,
      "/api/admin/prize-releases/match-1/release",
    );
    assert.equal(releaseRequest.method, "post");
    assert.deepEqual(JSON.parse(releaseRequest.data), {});
    assert.deepEqual(state.items, []);
    assert.equal(state.latestRelease.matchId, "match-1");
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("blocked or duplicate release commands never reach transport", async () => {
  const originalAdapter = api.defaults.adapter;
  let releaseRequestCount = 0;
  let completeRelease;
  api.defaults.adapter = async (config) => {
    if (config.method === "get") {
      return response(config, {
        data: {
          items: [
            queueItem("eligible"),
            queueItem("same-settler", {
              review: {
                blockedReason: "independent_review_required",
                canRelease: false,
              },
            }),
            queueItem("participant-reviewer", {
              review: {
                blockedReason: "participant_conflict",
                canRelease: false,
              },
            }),
          ],
          page: { hasMore: false, limit: 20, nextCursor: null },
        },
      });
    }

    releaseRequestCount += 1;
    return new Promise((resolve) => {
      completeRelease = () =>
        resolve(
          response(config, {
            data: {
              release: {
                currency: "INR",
                matchId: "eligible",
                releasedAt: "2026-08-09T12:00:00.000Z",
                releasedBy: null,
                totalMinor: 8000,
                winners: [],
              },
            },
          }),
        );
    });
  };

  try {
    const store = createStore();
    await store.dispatch(fetchPrizeReleaseQueue());

    const blocked = await store.dispatch(
      releaseMatchPrize({ matchId: "same-settler" }),
    );
    assert.equal(blocked.meta.condition, true);
    assert.equal(releaseRequestCount, 0);

    const participantConflict = await store.dispatch(
      releaseMatchPrize({ matchId: "participant-reviewer" }),
    );
    assert.equal(participantConflict.meta.condition, true);
    assert.equal(
      store
        .getState()
        .prizeReleaseReview.items.find(
          (item) => item.matchId === "participant-reviewer",
        ).review.blockedReason,
      "participant_conflict",
    );
    assert.equal(releaseRequestCount, 0);

    const first = store.dispatch(releaseMatchPrize({ matchId: "eligible" }));
    const duplicate = await store.dispatch(
      releaseMatchPrize({ matchId: "eligible" }),
    );
    assert.equal(duplicate.meta.condition, true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(releaseRequestCount, 1);
    completeRelease();
    await first;
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("a rejected release keeps its review item and stores a normalized per-Match error", async () => {
  const originalAdapter = api.defaults.adapter;
  api.defaults.adapter = async (config) => {
    if (config.method === "get") {
      return response(config, {
        data: {
          items: [queueItem("match-1")],
          page: { hasMore: false, limit: 20, nextCursor: null },
        },
      });
    }

    const error = new Error("Request failed");
    error.isAxiosError = true;
    error.response = {
      data: {
        error: {
          code: "PRIZE_RELEASE_INDEPENDENT_REVIEW_REQUIRED",
          fields: {},
          message: "A different governance administrator must release this prize.",
        },
      },
      headers: {},
      status: 409,
    };
    throw error;
  };

  try {
    const store = createStore();
    await store.dispatch(fetchPrizeReleaseQueue());
    const action = await store.dispatch(
      releaseMatchPrize({ matchId: "match-1" }),
    );
    const state = store.getState().prizeReleaseReview;

    assert.equal(action.type, releaseMatchPrize.rejected.type);
    assert.deepEqual(state.items.map((item) => item.matchId), ["match-1"]);
    assert.equal(state.releaseRequests["match-1"].status, "failed");
    assert.equal(
      state.releaseRequests["match-1"].error.message,
      "A different governance administrator must release this prize.",
    );
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});
