import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { configureStore } from "@reduxjs/toolkit";
import api from "../src/api/axios-api.js";
import gameManagementReducer, { fetchGameManagerEventMatches, fetchGameManagerEventOperations, fetchGameManagerEventRegistrations, fetchGameManagerEventStandings } from "../src/store/slices/gameManagementSlice.js";
import eventManagementSlice, { assignManagedEventOperator, fetchEligibleEventOperators } from "../src/store/slices/eventManagementSlice.js";
import matchChatReducer, { fetchMatchChat, sendMatchChatMessage } from "../src/store/slices/matchChatSlice.js";

const response = (config, data) => ({ config, data, headers: {}, status: 200, statusText: "OK" });
const body = (config) => typeof config.data === "string" ? JSON.parse(config.data) : config.data;

test("Game Manager Event oversight uses only scoped bounded read routes", async () => {
  const original = api.defaults.adapter; const requests = [];
  api.defaults.adapter = async (config) => { requests.push(config); return response(config, { data: config.url.endsWith("operations") ? { summary: {} } : config.url.endsWith("standings") ? { standings: [] } : { items: [], page: {} } }); };
  try {
    const store = configureStore({ reducer: { gameManagement: gameManagementReducer.reducer } }); const runId = "run-1";
    await store.dispatch(fetchGameManagerEventOperations({ runId })); await store.dispatch(fetchGameManagerEventRegistrations({ runId })); await store.dispatch(fetchGameManagerEventRegistrations({ runId, cursor: "opaque-page" })); await store.dispatch(fetchGameManagerEventMatches({ runId })); await store.dispatch(fetchGameManagerEventStandings({ runId }));
    assert.deepEqual(requests.map(({ method, url }) => [method, url]), [["get", `/api/staff/games/events/${runId}/operations`], ["get", `/api/staff/games/events/${runId}/registrations`], ["get", `/api/staff/games/events/${runId}/registrations`], ["get", `/api/staff/games/events/${runId}/matches`], ["get", `/api/staff/games/events/${runId}/standings`]]);
    requests.slice(1).forEach((request) => assert.equal(request.params.limit, 25));
    assert.equal(requests[2].params.cursor, "opaque-page");
  } finally { api.defaults.adapter = original; }
});

test("Event Manager assignment accepts only Match, Run, and eligible operator identity", async () => {
  const original = api.defaults.adapter; const requests = [];
  api.defaults.adapter = async (config) => { requests.push(config); return response(config, config.method === "get" ? { data: { operators: [] } } : { data: { assignment: { matchId: "match-1", operator: { id: "operator-1" }, status: "operator_assigned" } } }); };
  try {
    const store = configureStore({ reducer: { eventManagement: eventManagementSlice.reducer } });
    await store.dispatch(fetchEligibleEventOperators("run-1")); await store.dispatch(assignManagedEventOperator({ matchId: "match-1", operatorId: "operator-1", runId: "run-1" }));
    assert.deepEqual(requests.map(({ method, url }) => [method, url]), [["get", "/api/staff/events/runs/run-1/operators"], ["patch", "/api/staff/events/runs/run-1/matches/match-1/operator"]]);
    assert.deepEqual(body(requests[1]), { operatorId: "operator-1" });
  } finally { api.defaults.adapter = original; }
});

test("player and operator Match chat send only bounded message text", async () => {
  const original = api.defaults.adapter; const requests = [];
  api.defaults.adapter = async (config) => { requests.push(config); return response(config, config.method === "get" ? { data: { messages: [], page: {} } } : { data: { message: { id: "message-1", author: { username: "User" }, authorRole: "player", createdAt: new Date().toISOString(), message: body(config).message } } }); };
  try {
    const store = configureStore({ reducer: { matchChat: matchChatReducer } });
    await store.dispatch(fetchMatchChat({ audience: "player", matchId: "match-1" })); await store.dispatch(sendMatchChatMessage({ audience: "player", matchId: "match-1", message: "Ready" })); await store.dispatch(fetchMatchChat({ audience: "operator", matchId: "match-1" }));
    assert.deepEqual(requests.map(({ method, url }) => [method, url]), [["get", "/api/matches/match-1/chat"], ["post", "/api/matches/match-1/chat"], ["get", "/api/operator/matches/match-1/chat"]]);
    assert.deepEqual(body(requests[1]), { message: "Ready" });
  } finally { api.defaults.adapter = original; }
});

test("role dashboards expose Event operations without crossing privacy boundaries", async () => {
  const [eventManager, gameManager, operator, player] = await Promise.all([
    readFile(new URL("../src/components/eventManagement/EventManagerOperations.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/gameManagement/GameManagerEventDetails.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/Operations.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/MatchRoom.jsx", import.meta.url), "utf8"),
  ]);
  assert.match(eventManager, /Assign operator/); assert.match(eventManager, /Sporting standings/);
  assert.match(gameManager, /Registrations|registrations/); assert.match(gameManager, /Lobby credentials, chat, wallets/);
  assert.match(operator, /MatchChat audience="operator"/); assert.match(operator, /RankedResultEditor/);
  assert.match(player, /MatchChat audience="player"/); assert.doesNotMatch(gameManager, /roomPassword|proofNote|email/);
});
