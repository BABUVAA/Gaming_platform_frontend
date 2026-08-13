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

export const registerForEvent = createApiThunk(
  "eventRegistration/register",
  {
    method: "post",
    path: ({ arg }) => `/api/player/events/${arg}/register`,
    getBody: () => ({}),
    selectData: (response) => response.data?.data,
    errorMessage: "Unable to register for this Event.",
    onSuccess: ({ thunkAPI }) => thunkAPI.dispatch(fetchPlayerEvents()),
    toast: { success: true, error: true },
  },
  playerParticipationOnly,
);

export const cancelEventRegistration = createApiThunk(
  "eventRegistration/cancel",
  {
    method: "delete",
    path: ({ arg }) => `/api/player/events/${arg}/register`,
    getBody: () => undefined,
    selectData: (response) => response.data?.data,
    errorMessage: "Unable to cancel this Event registration.",
    onSuccess: ({ thunkAPI }) => thunkAPI.dispatch(fetchPlayerEvents()),
    toast: { success: true, error: true },
  },
  playerParticipationOnly,
);

const finishAction = (state, action, status) => {
  const event = state.events.find((item) => item.id === action.meta.arg);
  if (event) {
    event.registration.mine = { ...action.payload.registration, status };
  }
  state.actionById[action.meta.arg] = "idle";
};

const eventRegistrationSlice = createSlice({
  name: "eventRegistration",
  initialState: {
    actionById: {},
    error: null,
    events: [],
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
      .addCase(registerForEvent.pending, (state, action) => {
        state.actionById[action.meta.arg] = "loading";
      })
      .addCase(registerForEvent.fulfilled, (state, action) => {
        finishAction(state, action, action.payload.registration.status);
      })
      .addCase(registerForEvent.rejected, (state, action) => {
        state.actionById[action.meta.arg] = "idle";
      })
      .addCase(cancelEventRegistration.pending, (state, action) => {
        state.actionById[action.meta.arg] = "loading";
      })
      .addCase(cancelEventRegistration.fulfilled, (state, action) => {
        finishAction(state, action, "cancelled");
      })
      .addCase(cancelEventRegistration.rejected, (state, action) => {
        state.actionById[action.meta.arg] = "idle";
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

export default eventRegistrationSlice.reducer;
