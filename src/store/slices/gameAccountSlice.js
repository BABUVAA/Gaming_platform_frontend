import { createSlice } from "@reduxjs/toolkit";
import createApiThunk from "../thunks/createApiThunk.js";

export const fetchLinkedGameAccounts = createApiThunk(
  "gameAccounts/fetchLinked",
  {
    path: "/api/users/game-accounts",
    selectData: (response) => {
      const accounts = response.data?.data;
      if (!Array.isArray(accounts)) {
        throw new Error("Game-account response must contain an array.");
      }
      return accounts;
    },
    errorMessage: "Unable to load your connected accounts.",
  },
);

export const connectVerifiedGameAccount = createApiThunk(
  "gameAccounts/connectVerified",
  {
    method: "post",
    path: "/api/users/game-accounts/connect",
    getBody: ({ gameKey, playerTag, replacement, token }) => ({
      gameKey,
      playerTag,
      replacement: replacement === true,
      token,
    }),
    selectData: (response) => response.data?.data,
    errorMessage: "Unable to verify this game account.",
  },
);

const gameAccountSlice = createSlice({
  name: "gameAccounts",
  initialState: {
    items: [],
    status: "idle",
    error: null,
    connectStatus: "idle",
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLinkedGameAccounts.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchLinkedGameAccounts.fulfilled, (state, action) => {
        state.items = action.payload;
        state.status = "succeeded";
      })
      .addCase(fetchLinkedGameAccounts.rejected, (state, action) => {
        if (action.meta.aborted || action.meta.condition) return;
        state.status = "failed";
        state.error = action.payload || action.error?.message;
      })
      .addCase(connectVerifiedGameAccount.pending, (state) => {
        state.connectStatus = "loading";
      })
      .addCase(connectVerifiedGameAccount.fulfilled, (state) => {
        state.connectStatus = "succeeded";
      })
      .addCase(connectVerifiedGameAccount.rejected, (state) => {
        state.connectStatus = "failed";
      });
  },
});

export default gameAccountSlice.reducer;
