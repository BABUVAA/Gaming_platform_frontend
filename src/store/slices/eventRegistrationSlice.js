import { createSlice } from "@reduxjs/toolkit";
import createApiThunk from "../thunks/createApiThunk.js";

const playerParticipationOnly = {
  condition: (_arg, { getState }) =>
    getState()?.player?.summary?.role !== "staff",
};

export const selectEventProgression = (event, standingPage) => {
  if (standingPage?.status === "final" && standingPage.mine) {
    return {
      ...(standingPage.mine.prize ? { prize: standingPage.mine.prize } : {}),
      result: standingPage.mine.result,
      status: "results_finalized",
    };
  }
  return event.execution?.myBatch
    ? { myBatch: event.execution.myBatch }
    : null;
};

export const fetchPlayerEvents = createApiThunk(
  "eventRegistration/fetch",
  {
    path: "/api/player/events",
    selectData: (response) => response.data?.data?.events || [],
    errorMessage: "Unable to load Events.",
  },
);

export const fetchPlayerEventDetails = createApiThunk(
  "eventRegistration/fetchDetails",
  {
    path: ({ arg }) => `/api/player/events/${arg}`,
    selectData: (response) => response.data?.data?.event,
    errorMessage: "Unable to load this Event.",
  },
);

export const fetchPlayerEventStandings = createApiThunk(
  "eventRegistration/fetchStandings",
  {
    path: ({ arg }) => `/api/player/events/${arg.runId}/standings`,
    getParams: ({ cursor }) => ({
      limit: 10,
      ...(cursor ? { cursor } : {}),
    }),
    selectData: (response) => response.data?.data,
    errorMessage: "Unable to load Event standings.",
    toast: { error: true },
  },
);

export const fetchPlayerEventLeaderboard = createApiThunk(
  "eventRegistration/fetchLeaderboard",
  {
    path: ({ arg }) => `/api/player/events/${arg.runId}/leaderboard`,
    getParams: ({ cursor }) => ({
      limit: 10,
      ...(cursor ? { cursor } : {}),
    }),
    selectData: (response) => response.data?.data,
    errorMessage: "Unable to load the Event leaderboard.",
  },
);

export const registerForEvent = createApiThunk(
  "eventRegistration/register",
  {
    method: "post",
    path: ({ arg }) => `/api/player/events/${typeof arg === "string" ? arg : arg.runId}/register`,
    getBody: (arg) => typeof arg === "string" ? {} : ({
      ...(arg.teamId ? { teamId: arg.teamId } : {}),
      ...(arg.paymentMode ? { paymentMode: arg.paymentMode } : {}),
      ...(arg.rewardMode ? { rewardMode: arg.rewardMode } : {}),
    }),
    selectData: (response) => response.data?.data,
    errorMessage: "Unable to register for this Event.",
    onSuccess: ({ arg, thunkAPI }) => {
      thunkAPI.dispatch(fetchPlayerEvents());
      thunkAPI.dispatch(fetchPlayerEventLeaderboard({ runId: typeof arg === "string" ? arg : arg.runId }));
    },
    toast: { success: true, error: true },
  },
  playerParticipationOnly,
);

const finishAction = (state, action, status) => {
  const runId = typeof action.meta.arg === "string" ? action.meta.arg : action.meta.arg.runId;
  const event = state.events.find((item) => item.id === runId);
  if (event) {
    event.registration.mine = { ...action.payload.registration, status };
  }
  const detail = state.detailsById[runId];
  if (detail) detail.registration.mine = { ...action.payload.registration, status };
  state.actionById[runId] = "idle";
};

const eventRegistrationSlice = createSlice({
  name: "eventRegistration",
  initialState: {
    actionById: {},
    detailsById: {},
    detailsErrorById: {},
    detailsRequestById: {},
    detailsStatusById: {},
    error: null,
    events: [],
    leaderboardsById: {},
    leaderboardsErrorById: {},
    leaderboardsRequestById: {},
    leaderboardsStatusById: {},
    standingsById: {},
    standingsErrorById: {},
    standingsRequestById: {},
    standingsStatusById: {},
    status: "idle",
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlayerEvents.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchPlayerEvents.fulfilled, (state, action) => {
        state.events = action.payload;
        const visibleIds = new Set(action.payload.map((event) => event.id));
        Object.keys(state.standingsById).forEach((runId) => {
          const event = action.payload.find((item) => item.id === runId);
          if (!visibleIds.has(runId) || event?.status !== "completed") {
            delete state.standingsById[runId];
            delete state.standingsErrorById[runId];
            delete state.standingsRequestById[runId];
            delete state.standingsStatusById[runId];
          }
        });
        state.status = "succeeded";
      })
      .addCase(fetchPlayerEvents.rejected, (state, action) => {
        state.status = action.meta.aborted ? "idle" : "failed";
        state.error = action.payload?.message || action.error.message;
      })
      .addCase(fetchPlayerEventDetails.pending, (state, action) => {
        const runId = action.meta.arg;
        state.detailsErrorById[runId] = null;
        state.detailsRequestById[runId] = action.meta.requestId;
        state.detailsStatusById[runId] = "loading";
      })
      .addCase(fetchPlayerEventDetails.fulfilled, (state, action) => {
        const runId = action.meta.arg;
        if (state.detailsRequestById[runId] !== action.meta.requestId) return;
        state.detailsById[runId] = action.payload;
        state.detailsRequestById[runId] = null;
        state.detailsStatusById[runId] = "succeeded";
      })
      .addCase(fetchPlayerEventDetails.rejected, (state, action) => {
        const runId = action.meta.arg;
        if (state.detailsRequestById[runId] !== action.meta.requestId) return;
        state.detailsRequestById[runId] = null;
        state.detailsStatusById[runId] = action.meta.aborted ? "idle" : "failed";
        if (!action.meta.aborted) state.detailsErrorById[runId] = action.payload?.message || action.error.message;
      })
      .addCase(fetchPlayerEventStandings.pending, (state, action) => {
        const { runId } = action.meta.arg;
        state.standingsErrorById[runId] = null;
        state.standingsRequestById[runId] = action.meta.requestId;
        state.standingsStatusById[runId] = "loading";
      })
      .addCase(fetchPlayerEventStandings.fulfilled, (state, action) => {
        const { cursor, runId } = action.meta.arg;
        if (state.standingsRequestById[runId] !== action.meta.requestId) return;
        const previous = state.standingsById[runId];
        const standings = cursor
          ? appendStandingRows(previous?.standings, action.payload.standings)
          : action.payload.standings;
        state.standingsById[runId] = { ...action.payload, standings };
        state.standingsRequestById[runId] = null;
        state.standingsStatusById[runId] = "succeeded";
      })
      .addCase(fetchPlayerEventStandings.rejected, (state, action) => {
        const { runId } = action.meta.arg;
        if (state.standingsRequestById[runId] !== action.meta.requestId) return;
        state.standingsRequestById[runId] = null;
        state.standingsStatusById[runId] = action.meta.aborted
          ? "idle"
          : "failed";
        if (!action.meta.aborted) {
          state.standingsErrorById[runId] =
            action.payload?.message || action.error.message;
        }
      })
      .addCase(fetchPlayerEventLeaderboard.pending, (state, action) => {
        const { runId } = action.meta.arg;
        state.leaderboardsErrorById[runId] = null;
        state.leaderboardsRequestById[runId] = action.meta.requestId;
        state.leaderboardsStatusById[runId] = "loading";
      })
      .addCase(fetchPlayerEventLeaderboard.fulfilled, (state, action) => {
        const { cursor, runId } = action.meta.arg;
        if (state.leaderboardsRequestById[runId] !== action.meta.requestId) return;
        const previous = state.leaderboardsById[runId];
        const items = cursor
          ? appendLeaderboardRows(previous?.items, action.payload.items)
          : action.payload.items;
        state.leaderboardsById[runId] = { ...action.payload, items };
        state.leaderboardsRequestById[runId] = null;
        state.leaderboardsStatusById[runId] = "succeeded";
      })
      .addCase(fetchPlayerEventLeaderboard.rejected, (state, action) => {
        const { runId } = action.meta.arg;
        if (state.leaderboardsRequestById[runId] !== action.meta.requestId) return;
        state.leaderboardsRequestById[runId] = null;
        state.leaderboardsStatusById[runId] = action.meta.aborted
          ? "idle"
          : "failed";
        if (!action.meta.aborted) {
          state.leaderboardsErrorById[runId] =
            action.payload?.message || action.error.message;
        }
      })
      .addCase(registerForEvent.pending, (state, action) => {
        const runId = typeof action.meta.arg === "string" ? action.meta.arg : action.meta.arg.runId;
        state.actionById[runId] = "loading";
      })
      .addCase(registerForEvent.fulfilled, (state, action) => {
        finishAction(state, action, action.payload.registration.status);
      })
      .addCase(registerForEvent.rejected, (state, action) => {
        const runId = typeof action.meta.arg === "string" ? action.meta.arg : action.meta.arg.runId;
        state.actionById[runId] = "idle";
      });
  },
});

function appendStandingRows(current = [], additions = []) {
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
}

function appendLeaderboardRows(current = [], additions = []) {
  const rows = new Map(current.map((row) => [row.id, row]));
  additions.forEach((row) => rows.set(row.id, row));
  return [...rows.values()];
}

export default eventRegistrationSlice.reducer;
