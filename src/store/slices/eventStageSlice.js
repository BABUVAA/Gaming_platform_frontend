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

export const closeEventRegistration = createApiThunk(
  "eventStage/closeRegistration",
  {
    method: "post",
    path: ({ arg: runId }) =>
      `/api/admin/events/runs/${runId}/close-registration`,
    getBody: () => ({}),
    selectData: (response) => response.data?.data,
    errorMessage: "Unable to close registration and generate Stage 1.",
    toast: { success: true, error: true },
  },
  {
    condition: (runId, { getState }) =>
      getState().eventStages.actionByRunId[runId] !== "loading",
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
      .addCase(closeEventRegistration.pending, (state, action) => {
        state.actionByRunId[action.meta.arg] = "loading";
      })
      .addCase(closeEventRegistration.fulfilled, (state, action) => {
        const runId = action.meta.arg;
        state.actionByRunId[runId] = "idle";
        state.overviewByRunId[runId] = {
          run: action.payload.run,
          stages: action.payload.stage ? [action.payload.stage] : [],
          generation: { status: "completed", retryAvailable: false },
        };
        state.statusByRunId[runId] = "succeeded";
      })
      .addCase(closeEventRegistration.rejected, (state, action) => {
        if (!action.meta.condition) {
          state.actionByRunId[action.meta.arg] = "idle";
        }
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
