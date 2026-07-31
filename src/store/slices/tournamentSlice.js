import { createSlice } from "@reduxjs/toolkit";
import { isCacheFresh, PUBLIC_CACHE_TTL } from "../cachePolicy";
import createApiThunk from "../thunks/createApiThunk";

const normalizeDetailRequest = (request) =>
  typeof request === "string"
    ? { resourceId: request, resourceKind: "offering", force: false }
    : {
        resourceId: request?.resourceId || request?.tournamentId,
        resourceKind:
          request?.resourceKind === "event" ? "event" : "offering",
        force: request?.force || false,
      };

export const fetchTournaments = createApiThunk(
  "tournament/fetchTournaments",
  {
    path: "/api/tournaments/offerings",
    selectData: (response) => {
      const tournaments =
        response.data?.data?.offerings || response.data?.tournaments;

      if (
        !tournaments ||
        typeof tournaments !== "object" ||
        Array.isArray(tournaments)
      ) {
        throw new Error("Tournament list response must contain a map.");
      }

      return { tournaments, fetchedAt: Date.now() };
    },
    errorMessage: "Failed to fetch tournaments.",
  },
  {
    condition: ({ force = false } = {}, { getState }) => {
      const tournamentState = getState().tournament;

      if (tournamentState.listStatus === "loading") return false;
      if (force) return true;

      return !isCacheFresh(
        tournamentState.lastFetchedAt,
        PUBLIC_CACHE_TTL.TOURNAMENTS,
      );
    },
  },
);

export const fetchTournamentById = createApiThunk(
  "tournament/fetchTournamentById",
  {
    request: ({ api, arg, signal }) => {
      const { resourceId, resourceKind } = normalizeDetailRequest(arg);

      if (!resourceId) {
        // Use an Axios-shaped error so the common normalizer retains the
        // client-validation status and message in the rejected payload.
        const missingIdError = new Error("Tournament ID is required.");
        missingIdError.response = {
          status: 400,
          data: { message: "Tournament ID is required." },
        };
        throw missingIdError;
      }

      const resourcePath =
        resourceKind === "event" ? "events" : "types";
      return api.get(
        `/api/tournaments/${resourcePath}/${resourceId}`,
        { signal },
      );
    },
    selectData: (response) => ({
      tournament: response.data?.data || response.data,
      fetchedAt: Date.now(),
    }),
    errorMessage: "Failed to fetch tournament details.",
  },
  {
    condition: (request, { getState }) => {
      const { resourceId, resourceKind, force } =
        normalizeDetailRequest(request);
      const tournamentState = getState().tournament;

      if (!resourceId) return true;
      if (
        tournamentState.detailStatus === "loading" &&
        tournamentState.requestedTournamentId === resourceId &&
        tournamentState.requestedDetailKind === resourceKind
      ) {
        return false;
      }
      if (force) return true;

      return !(
        tournamentState.selectedTournament?._id === resourceId &&
        tournamentState.selectedDetailKind === resourceKind &&
        isCacheFresh(
          tournamentState.selectedTournamentFetchedAt,
          PUBLIC_CACHE_TTL.TOURNAMENT_DETAILS,
        )
      );
    },
  },
);

const initialState = {
  tournaments: {},
  listStatus: "idle",
  listError: null,
  lastFetchedAt: null,
  selectedTournament: null,
  selectedTournamentFetchedAt: null,
  detailStatus: "idle",
  detailError: null,
  detailRequestId: null,
  requestedTournamentId: null,
  requestedDetailKind: null,
  selectedDetailKind: null,
};

const tournamentSlice = createSlice({
  name: "tournament",
  initialState,
  reducers: {
    upsertTournament(state, action) {
      const tournament = action.payload;
      if (!tournament?._id) return;

      state.tournaments[tournament._id] = {
        ...state.tournaments[tournament._id],
        ...tournament,
      };

      // Keep the open detail screen synchronized with matching socket events.
      if (state.selectedTournament?._id === tournament._id) {
        state.selectedTournament = {
          ...state.selectedTournament,
          ...tournament,
        };
      }
    },
    removeTournament(state, action) {
      const tournamentId = action.payload;
      if (!tournamentId) return;

      delete state.tournaments[tournamentId];
      if (state.selectedTournament?._id === tournamentId) {
        state.selectedTournament = null;
        state.selectedTournamentFetchedAt = null;
        state.detailStatus = "idle";
        state.detailError = null;
        state.detailRequestId = null;
        state.requestedTournamentId = null;
        state.requestedDetailKind = null;
        state.selectedDetailKind = null;
      }
    },
    clearSelectedTournament(state) {
      state.selectedTournament = null;
      state.selectedTournamentFetchedAt = null;
      state.detailStatus = "idle";
      state.detailError = null;
      state.detailRequestId = null;
      state.requestedTournamentId = null;
      state.requestedDetailKind = null;
      state.selectedDetailKind = null;
    },
    invalidateTournamentList(state) {
      state.lastFetchedAt = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTournaments.pending, (state) => {
        state.listStatus = "loading";
        state.listError = null;
      })
      .addCase(fetchTournaments.fulfilled, (state, action) => {
        state.listStatus = "succeeded";
        state.tournaments = action.payload.tournaments;
        state.lastFetchedAt = action.payload.fetchedAt;
      })
      .addCase(fetchTournaments.rejected, (state, action) => {
        // A condition rejection represents a deduplicated caller, not the
        // completion of the request that is already loading.
        if (action.meta.condition) return;
        if (action.meta.aborted) {
          state.listStatus = "idle";
          return;
        }

        state.listStatus = "failed";
        state.listError = action.payload || "Failed to fetch tournaments.";
      })
      .addCase(fetchTournamentById.pending, (state, action) => {
        state.detailStatus = "loading";
        state.detailError = null;
        state.detailRequestId = action.meta.requestId;
        state.requestedTournamentId = normalizeDetailRequest(
          action.meta.arg,
        ).resourceId;
        state.requestedDetailKind = normalizeDetailRequest(
          action.meta.arg,
        ).resourceKind;
      })
      .addCase(fetchTournamentById.fulfilled, (state, action) => {
        // A slower request for a previous route must not replace details for the
        // tournament the user navigated to most recently.
        if (state.detailRequestId !== action.meta.requestId) return;

        const { tournament, fetchedAt } = action.payload;
        state.selectedTournament = tournament;
        state.selectedTournamentFetchedAt = fetchedAt;
        state.selectedDetailKind = normalizeDetailRequest(
          action.meta.arg,
        ).resourceKind;
        state.detailStatus = "succeeded";
        state.detailRequestId = null;
        state.requestedTournamentId = null;
        state.requestedDetailKind = null;

        if (tournament?.kind !== "event" && tournament?._id) {
          state.tournaments[tournament._id] = {
            ...state.tournaments[tournament._id],
            ...tournament,
          };
        }
      })
      .addCase(fetchTournamentById.rejected, (state, action) => {
        if (state.detailRequestId !== action.meta.requestId) return;

        if (action.meta.aborted || action.meta.condition) {
          state.detailStatus = "idle";
          state.detailRequestId = null;
          state.requestedTournamentId = null;
          state.requestedDetailKind = null;
          return;
        }

        state.detailStatus = "failed";
        state.detailError =
          action.payload || "Failed to fetch tournament details.";
        state.detailRequestId = null;
        state.requestedTournamentId = null;
        state.requestedDetailKind = null;
      });
  },
});

export const tournamentAction = tournamentSlice.actions;
export default tournamentSlice;
