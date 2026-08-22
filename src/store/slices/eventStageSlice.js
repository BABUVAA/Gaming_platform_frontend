import { createSlice } from "@reduxjs/toolkit";
import createApiThunk from "../thunks/createApiThunk.js";

export const fetchEventExecutionRuns = createApiThunk(
  "eventStage/fetchRuns",
  {
    path: "/api/admin/events/execution-runs",
    getParams: ({ cursor } = {}) => ({
      limit: 25,
      ...(cursor ? { cursor } : {}),
    }),
    selectData: (response) =>
      response.data?.data || { nextCursor: null, runs: [] },
    errorMessage: "Unable to load Event execution runs.",
    toast: { error: true },
  },
);

export const fetchEventStages = createApiThunk(
  "eventStage/fetch",
  {
    path: ({ arg }) => `/api/admin/events/runs/${arg.runId}/stages`,
    getParams: ({ batchCursor }) => ({
      batchLimit: 25,
      ...(batchCursor ? { batchCursor } : {}),
    }),
    selectData: (response) =>
      response.data?.data || { run: null, stages: [] },
    errorMessage: "Unable to load Event stages.",
    toast: { error: true },
  },
);

export const fetchManagedEventStages = createApiThunk(
  "eventStage/fetchManaged",
  {
    path: ({ arg }) => `/api/staff/events/runs/${arg.runId}/stages`,
    getParams: ({ batchCursor }) => ({
      batchLimit: 25,
      ...(batchCursor ? { batchCursor } : {}),
    }),
    selectData: (response) => response.data?.data || { run: null, stages: [] },
    errorMessage: "Unable to load Event rounds.",
    toast: { error: true },
  },
);

export const configureManagedEventRound = createApiThunk(
  "eventStage/configureManagedRound",
  {
    method: "post",
    path: ({ arg }) => `/api/staff/events/runs/${arg.runId}/rounds/configure`,
    getBody: ({ definition }) => ({
      advanceCount: definition.finalRound ? 0 : definition.advanceCount,
      batchSpacingMinutes: definition.batchSpacingMinutes,
      checkInMinutesBefore: definition.checkInMinutesBefore,
      finalRound: definition.finalRound,
      participantsPerMatch: definition.participantsPerMatch,
      stageDelayMinutes: definition.stageDelayMinutes,
    }),
    selectData: (response) => response.data?.data,
    errorMessage: "Unable to configure the Event round.",
    toast: { success: true, error: true },
  },
  {
    condition: ({ runId }, { getState }) =>
      getState().eventStages.actionByRunId[runId] !== "loading",
  },
);

export const processManagedEventRound = createApiThunk(
  "eventStage/processManagedRound",
  {
    method: "post",
    path: ({ arg: runId }) => `/api/staff/events/runs/${runId}/rounds/process`,
    getBody: () => ({}),
    selectData: (response) => response.data?.data,
    errorMessage: "Unable to continue Event round processing.",
    toast: { success: true, error: true },
  },
  {
    condition: (runId, { getState }) =>
      getState().eventStages.actionByRunId[runId] !== "loading",
  },
);

export const fetchManagedRoundResults = createApiThunk(
  "eventStage/fetchManagedRoundResults",
  {
    path: ({ arg }) => `/api/staff/events/runs/${arg.runId}/rounds/${arg.stageNumber}/results`,
    getParams: ({ cursor, result }) => ({
      limit: 50,
      result,
      ...(cursor ? { cursor } : {}),
    }),
    selectData: (response) => response.data?.data || { items: [], nextCursor: null },
    errorMessage: "Unable to load promoted and eliminated players.",
    toast: { error: true },
  },
);

export const retryEventStageGeneration = createApiThunk(
  "eventStage/retryGeneration",
  {
    method: "post",
    path: ({ arg: runId }) =>
      `/api/admin/events/runs/${runId}/stages/retry`,
    getBody: () => ({}),
    selectData: (response) => response.data?.data,
    errorMessage: "Unable to retry first-stage generation.",
    toast: { success: true, error: true },
  },
  {
    condition: (runId, { getState }) =>
      getState().eventStages.actionByRunId[runId] !== "loading",
  },
);

export const cancelEventStageGeneration = createApiThunk(
  "eventStage/cancelGeneration",
  {
    method: "post",
    path: ({ arg }) =>
      `/api/admin/events/runs/${arg.runId}/cancel-generation`,
    getBody: ({ reason }) => ({ reason }),
    selectData: (response) => response.data?.data,
    errorMessage: "Unable to cancel the failed Event generation.",
    toast: { success: true, error: true },
  },
  {
    condition: ({ runId }, { getState }) =>
      getState().eventStages.actionByRunId[runId] !== "loading",
  },
);

export const fetchAdminEventStandings = createApiThunk(
  "eventStage/fetchStandings",
  {
    path: ({ arg }) => `/api/admin/events/runs/${arg.runId}/standings`,
    getParams: ({ cursor, eliminatedInStage, result }) => ({
      limit: 25,
      ...(cursor ? { cursor } : {}),
      ...(eliminatedInStage ? { eliminatedInStage } : {}),
      ...(result ? { result } : {}),
    }),
    selectData: (response) => response.data?.data,
    errorMessage: "Unable to load Event standings.",
    toast: { error: true },
  },
);

export const fetchEventPrizeRelease = createApiThunk(
  "eventStage/fetchPrizeRelease",
  {
    path: ({ arg }) => `/api/admin/events/runs/${arg}/prize-release`,
    selectData: (response) => response.data?.data?.release || null,
    errorMessage: "Unable to load the Event prize release.",
    toast: { error: true },
  },
);

export const releaseEventPrizes = createApiThunk(
  "eventStage/releasePrizes",
  {
    method: "post",
    path: ({ arg }) => `/api/admin/events/runs/${arg}/prize-release`,
    getBody: () => ({}),
    selectData: (response) => response.data?.data?.release || null,
    errorMessage: "Unable to release Event prizes.",
    toast: { success: true, error: true },
  },
  {
    condition: (runId, { getState }) =>
      getState().eventStages.prizeActionByRunId[runId] !== "loading",
  },
);

export const retryEventStageAdvancement = createApiThunk(
  "eventStage/retryAdvancement",
  {
    method: "post",
    path: ({ arg }) =>
      `/api/admin/events/runs/${arg.runId}/stages/${arg.stageNumber}/retry-advancement`,
    getBody: () => ({}),
    selectData: (response) => response.data?.data,
    errorMessage: "Unable to retry Event advancement.",
    toast: { success: true, error: true },
  },
  {
    condition: ({ runId }, { getState }) =>
      getState().eventStages.actionByRunId[runId] !== "loading",
  },
);

const appendUnique = (current = [], additions = []) => {
  const byId = new Map(current.map((run) => [run.id, run]));
  additions.forEach((run) => byId.set(run.id, run));
  return [...byId.values()];
};

const mergeStagePage = (currentOverview, nextOverview) => {
  if (!currentOverview) return nextOverview;

  const nextStages = new Map(
    (nextOverview.stages || []).map((stage) => [stage.id, stage]),
  );
  const stages = (currentOverview.stages || []).map((stage) => {
    const nextStage = nextStages.get(stage.id);
    if (!nextStage) return stage;
    nextStages.delete(stage.id);
    return {
      ...nextStage,
      batches: appendUnique(stage.batches, nextStage.batches),
    };
  });

  return {
    ...nextOverview,
    stages: [...stages, ...nextStages.values()].sort(
      (left, right) => left.number - right.number,
    ),
  };
};

const eventStageSlice = createSlice({
  name: "eventStage",
  initialState: {
    actionByRunId: {},
    errorByRunId: {},
    latestRequestByRunId: {},
    overviewByRunId: {},
    statusByRunId: {},
    standingsByRunId: {},
    standingsErrorByRunId: {},
    standingsRequestByRunId: {},
    standingsStatusByRunId: {},
    prizeActionByRunId: {},
    prizeByRunId: {},
    prizeErrorByRunId: {},
    prizeStatusByRunId: {},
    executionRuns: [],
    nextRunCursor: null,
    runError: null,
    runRequestId: null,
    runStatus: "idle",
    roundResultsByKey: {},
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEventExecutionRuns.pending, (state, action) => {
        state.runError = null;
        state.runRequestId = action.meta.requestId;
        state.runStatus = "loading";
      })
      .addCase(fetchEventExecutionRuns.fulfilled, (state, action) => {
        if (state.runRequestId !== action.meta.requestId) return;
        state.executionRuns = action.meta.arg?.cursor
          ? appendUnique(state.executionRuns, action.payload.runs)
          : action.payload.runs;
        state.nextRunCursor = action.payload.nextCursor || null;
        state.runRequestId = null;
        state.runStatus = "succeeded";
      })
      .addCase(fetchEventExecutionRuns.rejected, (state, action) => {
        if (state.runRequestId !== action.meta.requestId) return;
        state.runError = action.meta.aborted
          ? null
          : action.payload?.message || action.error.message;
        state.runRequestId = null;
        state.runStatus = action.meta.aborted ? "idle" : "failed";
      })
      .addCase(fetchEventStages.pending, (state, action) => {
        const { runId } = action.meta.arg;
        state.errorByRunId[runId] = null;
        state.latestRequestByRunId[runId] = action.meta.requestId;
        state.statusByRunId[runId] = "loading";
      })
      .addCase(fetchEventStages.fulfilled, (state, action) => {
        const { batchCursor, runId } = action.meta.arg;
        if (state.latestRequestByRunId[runId] !== action.meta.requestId) return;
        state.latestRequestByRunId[runId] = null;
        if (batchCursor) {
          state.overviewByRunId[runId] = mergeStagePage(
            state.overviewByRunId[runId],
            action.payload,
          );
        } else {
          state.overviewByRunId[runId] = action.payload;
        }
        state.statusByRunId[runId] = "succeeded";
      })
      .addCase(fetchEventStages.rejected, (state, action) => {
        const { runId } = action.meta.arg;
        if (state.latestRequestByRunId[runId] !== action.meta.requestId) return;
        state.latestRequestByRunId[runId] = null;
        state.statusByRunId[runId] = action.meta.aborted ? "idle" : "failed";
        if (!action.meta.aborted) {
          state.errorByRunId[runId] =
            action.payload?.message || action.error.message;
        }
      })
      .addCase(fetchManagedEventStages.pending, (state, action) => {
        const { runId } = action.meta.arg;
        state.errorByRunId[runId] = null;
        state.latestRequestByRunId[runId] = action.meta.requestId;
        state.statusByRunId[runId] = "loading";
      })
      .addCase(fetchManagedEventStages.fulfilled, (state, action) => {
        const { batchCursor, runId } = action.meta.arg;
        if (state.latestRequestByRunId[runId] !== action.meta.requestId) return;
        state.latestRequestByRunId[runId] = null;
        state.overviewByRunId[runId] = batchCursor
          ? mergeStagePage(state.overviewByRunId[runId], action.payload)
          : action.payload;
        state.statusByRunId[runId] = "succeeded";
      })
      .addCase(fetchManagedEventStages.rejected, (state, action) => {
        const { runId } = action.meta.arg;
        if (state.latestRequestByRunId[runId] !== action.meta.requestId) return;
        state.latestRequestByRunId[runId] = null;
        state.statusByRunId[runId] = action.meta.aborted ? "idle" : "failed";
        if (!action.meta.aborted) state.errorByRunId[runId] = action.payload?.message || action.error.message;
      })
      .addCase(configureManagedEventRound.pending, (state, action) => {
        state.actionByRunId[action.meta.arg.runId] = "loading";
      })
      .addCase(configureManagedEventRound.fulfilled, (state, action) => {
        const runId = action.meta.arg.runId;
        state.actionByRunId[runId] = "idle";
        state.overviewByRunId[runId] = action.payload;
        state.statusByRunId[runId] = "succeeded";
      })
      .addCase(configureManagedEventRound.rejected, (state, action) => {
        if (!action.meta.condition) state.actionByRunId[action.meta.arg.runId] = "idle";
      })
      .addCase(processManagedEventRound.pending, (state, action) => {
        state.actionByRunId[action.meta.arg] = "loading";
      })
      .addCase(processManagedEventRound.fulfilled, (state, action) => {
        const runId = action.meta.arg;
        state.actionByRunId[runId] = "idle";
        state.overviewByRunId[runId] = action.payload;
        state.statusByRunId[runId] = "succeeded";
      })
      .addCase(processManagedEventRound.rejected, (state, action) => {
        if (!action.meta.condition) state.actionByRunId[action.meta.arg] = "idle";
      })
      .addCase(fetchManagedRoundResults.pending, (state, action) => {
        const { result, runId, stageNumber } = action.meta.arg;
        const key = `${runId}:${stageNumber}:${result}`;
        state.roundResultsByKey[key] = { ...(state.roundResultsByKey[key] || { items: [] }), error: null, status: "loading" };
      })
      .addCase(fetchManagedRoundResults.fulfilled, (state, action) => {
        const { cursor, result, runId, stageNumber } = action.meta.arg;
        const key = `${runId}:${stageNumber}:${result}`;
        const current = state.roundResultsByKey[key]?.items || [];
        const rows = cursor ? [...current, ...action.payload.items] : action.payload.items;
        state.roundResultsByKey[key] = {
          error: null,
          items: [...new Map(rows.map((item) => [`${item.room}:${item.rank}:${item.player?.profileTag}`, item])).values()],
          nextCursor: action.payload.nextCursor || null,
          status: "succeeded",
        };
      })
      .addCase(fetchManagedRoundResults.rejected, (state, action) => {
        const { result, runId, stageNumber } = action.meta.arg;
        const key = `${runId}:${stageNumber}:${result}`;
        state.roundResultsByKey[key] = {
          ...(state.roundResultsByKey[key] || { items: [] }),
          error: action.meta.aborted ? null : action.payload?.message || action.error.message,
          status: action.meta.aborted ? "idle" : "failed",
        };
      })
      .addCase(fetchEventPrizeRelease.pending, (state, action) => {
        const runId = action.meta.arg;
        state.prizeErrorByRunId[runId] = null;
        state.prizeStatusByRunId[runId] = "loading";
      })
      .addCase(fetchEventPrizeRelease.fulfilled, (state, action) => {
        const runId = action.meta.arg;
        state.prizeByRunId[runId] = action.payload;
        state.prizeStatusByRunId[runId] = "succeeded";
      })
      .addCase(fetchEventPrizeRelease.rejected, (state, action) => {
        const runId = action.meta.arg;
        state.prizeStatusByRunId[runId] = action.meta.aborted ? "idle" : "failed";
        if (!action.meta.aborted) state.prizeErrorByRunId[runId] = action.payload?.message || action.error.message;
      })
      .addCase(releaseEventPrizes.pending, (state, action) => {
        state.prizeActionByRunId[action.meta.arg] = "loading";
      })
      .addCase(releaseEventPrizes.fulfilled, (state, action) => {
        const runId = action.meta.arg;
        state.prizeActionByRunId[runId] = "idle";
        state.prizeByRunId[runId] = action.payload;
      })
      .addCase(releaseEventPrizes.rejected, (state, action) => {
        if (!action.meta.condition) state.prizeActionByRunId[action.meta.arg] = "idle";
      })
      .addCase(retryEventStageGeneration.pending, (state, action) => {
        state.actionByRunId[action.meta.arg] = "loading";
      })
      .addCase(retryEventStageGeneration.fulfilled, (state, action) => {
        state.actionByRunId[action.meta.arg] = "idle";
      })
      .addCase(retryEventStageGeneration.rejected, (state, action) => {
        if (!action.meta.condition) {
          state.actionByRunId[action.meta.arg] = "idle";
        }
      })
      .addCase(cancelEventStageGeneration.pending, (state, action) => {
        state.actionByRunId[action.meta.arg.runId] = "loading";
      })
      .addCase(cancelEventStageGeneration.fulfilled, (state, action) => {
        const runId = action.meta.arg.runId;
        state.actionByRunId[runId] = "idle";
        const overview = state.overviewByRunId[runId];
        if (overview) {
          overview.run = { ...overview.run, ...action.payload.run };
          overview.generation.cancelAvailable = false;
        }
      })
      .addCase(cancelEventStageGeneration.rejected, (state, action) => {
        if (!action.meta.condition) {
          state.actionByRunId[action.meta.arg.runId] = "idle";
        }
      })
      .addCase(fetchAdminEventStandings.pending, (state, action) => {
        const { runId } = action.meta.arg;
        state.standingsErrorByRunId[runId] = null;
        state.standingsRequestByRunId[runId] = action.meta.requestId;
        state.standingsStatusByRunId[runId] = "loading";
      })
      .addCase(fetchAdminEventStandings.fulfilled, (state, action) => {
        const { cursor, eliminatedInStage, result, runId } = action.meta.arg;
        if (state.standingsRequestByRunId[runId] !== action.meta.requestId)
          return;
        const current = state.standingsByRunId[runId];
        state.standingsByRunId[runId] = {
          ...action.payload,
          filter: { eliminatedInStage: eliminatedInStage || "", result: result || "" },
          standings: cursor
            ? appendUniqueStandings(current?.standings, action.payload.standings)
            : action.payload.standings,
        };
        state.standingsRequestByRunId[runId] = null;
        state.standingsStatusByRunId[runId] = "succeeded";
      })
      .addCase(fetchAdminEventStandings.rejected, (state, action) => {
        const { runId } = action.meta.arg;
        if (state.standingsRequestByRunId[runId] !== action.meta.requestId)
          return;
        state.standingsRequestByRunId[runId] = null;
        state.standingsStatusByRunId[runId] = action.meta.aborted
          ? "idle"
          : "failed";
        if (!action.meta.aborted) {
          state.standingsErrorByRunId[runId] =
            action.payload?.message || action.error.message;
        }
      })
      .addCase(retryEventStageAdvancement.pending, (state, action) => {
        state.actionByRunId[action.meta.arg.runId] = "loading";
      })
      .addCase(retryEventStageAdvancement.fulfilled, (state, action) => {
        state.actionByRunId[action.meta.arg.runId] = "idle";
      })
      .addCase(retryEventStageAdvancement.rejected, (state, action) => {
        if (!action.meta.condition) {
          state.actionByRunId[action.meta.arg.runId] = "idle";
        }
      });
  },
});

const appendUniqueStandings = (current = [], additions = []) => {
  const rows = new Map(
    current.map((row) => [
      `${row.placement}:${row.player?.profileTag || row.player?.displayName}`,
      row,
    ]),
  );
  additions.forEach((row) =>
    rows.set(
      `${row.placement}:${row.player?.profileTag || row.player?.displayName}`,
      row,
    ),
  );
  return [...rows.values()];
};

export default eventStageSlice;
