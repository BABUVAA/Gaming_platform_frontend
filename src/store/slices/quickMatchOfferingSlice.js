import { createSlice } from "@reduxjs/toolkit";
import createApiThunk from "../thunks/createApiThunk.js";

export const fetchQuickMatchOfferings = createApiThunk(
  "quickMatchOfferings/fetchAll",
  {
    path: "/api/admin/quick-match-offerings",
    selectData: (response) => response.data?.data?.offerings || [],
    errorMessage: "Unable to load Quick Match offerings.",
    toast: { error: true },
  },
);

export const fetchPlayerQuickMatchOfferings = createApiThunk(
  "quickMatchOfferings/fetchPlayerDiscovery",
  {
    path: "/api/player/quick-matches",
    selectData: (response) => response.data?.data || [],
    errorMessage: "Unable to load available tournaments.",
  },
);

export const fetchPlayerQuickMatchOfferingById = createApiThunk(
  "quickMatchOfferings/fetchPlayerDetail",
  {
    path: ({ arg }) => `/api/player/quick-matches/${arg}`,
    selectData: (response) =>
      response.data?.data?.offering || response.data?.data,
    errorMessage: "Unable to load this tournament.",
  },
);

export const createQuickMatchOffering = createApiThunk(
  "quickMatchOfferings/create",
  {
    method: "post",
    path: "/api/admin/quick-match-offerings",
    selectData: (response) => response.data?.data?.offering,
    errorMessage: "Unable to create this Quick Match offering.",
    toast: { success: true, error: true },
  },
);

export const updateQuickMatchOffering = createApiThunk(
  "quickMatchOfferings/update",
  {
    method: "patch",
    path: ({ arg }) => `/api/admin/quick-match-offerings/${arg.offeringId}`,
    getBody: (payload) => {
      const changes = { ...payload };
      delete changes.offeringId;
      return changes;
    },
    selectData: (response) => response.data?.data?.offering,
    errorMessage: "Unable to update this Quick Match offering.",
    toast: { success: true, error: true },
  },
);

const upsertOffering = (offerings, offering) => {
  const index = offerings.findIndex((item) => item._id === offering?._id);
  if (index >= 0) offerings[index] = offering;
  else if (offering) offerings.unshift(offering);
};

const quickMatchOfferingSlice = createSlice({
  name: "quickMatchOfferings",
  initialState: {
    error: null,
    offerings: [],
    playerError: null,
    playerDetails: {},
    playerDetailErrorsById: {},
    playerDetailRequestIdsById: {},
    playerDetailStatusById: {},
    playerOfferings: [],
    playerStatus: "idle",
    status: "idle",
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuickMatchOfferings.pending, (state) => {
        state.error = null;
        state.status = "loading";
      })
      .addCase(fetchQuickMatchOfferings.fulfilled, (state, action) => {
        state.offerings = action.payload;
        state.status = "succeeded";
      })
      .addCase(fetchQuickMatchOfferings.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
        state.status = "failed";
      })
      .addCase(fetchPlayerQuickMatchOfferings.pending, (state) => {
        state.playerError = null;
        state.playerStatus = "loading";
      })
      .addCase(fetchPlayerQuickMatchOfferings.fulfilled, (state, action) => {
        state.playerOfferings = Array.isArray(action.payload)
          ? action.payload
          : [];
        state.playerStatus = "succeeded";
      })
      .addCase(fetchPlayerQuickMatchOfferings.rejected, (state, action) => {
        state.playerError = action.payload || action.error.message;
        state.playerStatus = action.meta.aborted ? "idle" : "failed";
      })
      .addCase(fetchPlayerQuickMatchOfferingById.pending, (state, action) => {
        state.playerDetailErrorsById[action.meta.arg] = null;
        state.playerDetailRequestIdsById[action.meta.arg] =
          action.meta.requestId;
        state.playerDetailStatusById[action.meta.arg] = "loading";
      })
      .addCase(fetchPlayerQuickMatchOfferingById.fulfilled, (state, action) => {
        if (
          state.playerDetailRequestIdsById[action.meta.arg] !==
          action.meta.requestId
        ) {
          return;
        }
        state.playerDetailRequestIdsById[action.meta.arg] = null;
        if (action.payload?._id) {
          state.playerDetails[action.meta.arg] = action.payload;
          state.playerDetailStatusById[action.meta.arg] = "succeeded";
        } else {
          state.playerDetailStatusById[action.meta.arg] = "failed";
          state.playerDetailErrorsById[action.meta.arg] = {
            message: "Tournament detail response is invalid.",
          };
        }
      })
      .addCase(fetchPlayerQuickMatchOfferingById.rejected, (state, action) => {
        if (
          state.playerDetailRequestIdsById[action.meta.arg] !==
          action.meta.requestId
        ) {
          return;
        }
        state.playerDetailRequestIdsById[action.meta.arg] = null;
        state.playerDetailStatusById[action.meta.arg] = action.meta.aborted
          ? "idle"
          : "failed";
        state.playerDetailErrorsById[action.meta.arg] = action.meta.aborted
          ? null
          : action.payload || action.error;
      })
      .addCase(createQuickMatchOffering.fulfilled, (state, action) => {
        upsertOffering(state.offerings, action.payload);
      })
      .addCase(updateQuickMatchOffering.fulfilled, (state, action) => {
        upsertOffering(state.offerings, action.payload);
      });
  },
});

export default quickMatchOfferingSlice;
