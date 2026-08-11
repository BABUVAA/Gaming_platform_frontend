import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { configureStore } from "@reduxjs/toolkit";
import api from "../src/api/axios-api.js";
import hostQuickMatchProposalSlice, {
  proposeHostQuickMatchDraft,
} from "../src/store/slices/hostQuickMatchProposalSlice.js";

test("approved host proposal uses the canonical draft-only transport", async () => {
  const originalAdapter = api.defaults.adapter;
  let request;
  api.defaults.adapter = async (config) => {
    request = config;
    return {
      config,
      data: {
        data: {
          _id: "draft-1",
          gameKey: "bgmi",
          kind: "quick_match_offering",
          status: "draft",
          title: "Duo night",
        },
      },
      headers: {},
      status: 201,
      statusText: "Created",
    };
  };

  try {
    const store = configureStore({
      reducer: { hostQuickMatchProposal: hostQuickMatchProposalSlice.reducer },
    });
    const action = await store.dispatch(
      proposeHostQuickMatchDraft({
        currency: "INR",
        entryFeeMinor: 200,
        entryPolicy: "paid",
        gameId: "game-1",
        map: "erangel",
        maxParticipants: 50,
        mode: "duo",
        operatorCoverageRequired: true,
        prizePoolMinor: 8000,
        region: "india",
        schedulePolicy: "on_demand",
        status: "active",
        teamSize: 2,
        title: "Duo night",
        updatedBy: "attacker-controlled",
      }),
    );

    assert.equal(action.type, proposeHostQuickMatchDraft.fulfilled.type);
    assert.equal(request.url, "/api/host/tournament-offerings");
    assert.equal(request.method, "post");
    const body = JSON.parse(request.data);
    assert.equal(body.status, undefined);
    assert.equal(body.updatedBy, undefined);
    assert.equal(body.entryFeeMinor, 200);
    assert.equal(store.getState().hostQuickMatchProposal.proposal.status, "draft");
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("host proposal UI and route are verified-capability-gated", async () => {
  const [routes, guards, page, tournamentPage] = await Promise.all([
    readFile(new URL("../src/routes/dashboardRoutes.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/routes/RouteGuards.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/HostTournamentProposal.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/Tournament.jsx", import.meta.url), "utf8"),
  ]);

  assert.match(routes, /HOST_TOURNAMENT_PROPOSAL[\s\S]*access: "approvedHost"/);
  assert.match(guards, /ApprovedHostRoute[\s\S]*VerifiedAccountGate/);
  assert.match(tournamentPage, /hasApprovedHostAccess\(playerSummary\)/);
  assert.match(page, /supportedModes/);
  assert.match(page, /supportedMaps/);
  assert.doesNotMatch(page, /status:\s*"active"/);
});
