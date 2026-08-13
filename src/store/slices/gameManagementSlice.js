import { createSlice } from "@reduxjs/toolkit";
import createApiThunk from "../thunks/createApiThunk.js";

// Game Manager data stays separate from the admin catalog. This endpoint is
// read-only operational visibility, not a path to change game configuration.
export const fetchManagedGameOperations = createApiThunk(
  "gameManagement/fetchManagedGameOperations",
  {
    path: "/api/staff/games/operations",
    selectData: (response) => response.data?.data?.operations || [],
    errorMessage: "Unable to load assigned game operations.",
    toast: { error: true },
  },
);

const gameManagementSlice = createSlice({
  name: "gameManagement",
  initialState: { error: null, operations: [], status: "idle" },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchManagedGameOperations.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchManagedGameOperations.fulfilled, (state, action) => {
        state.operations = action.payload;
        state.status = "succeeded";
      })
      .addCase(fetchManagedGameOperations.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
        state.status = "failed";
      });
  },
});

export default gameManagementSlice;
