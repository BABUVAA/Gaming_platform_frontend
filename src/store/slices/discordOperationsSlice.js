import { createSlice } from "@reduxjs/toolkit";
import createApiThunk from "../thunks/createApiThunk.js";

const selectData = (response) => response.data?.data || {};

export const fetchDiscordConnection = createApiThunk("discordOperations/fetchConnection", { path: "/api/discord/status", selectData, errorMessage: "Unable to load Discord connection." });
export const connectDiscord = createApiThunk("discordOperations/connect", { method: "post", path: "/api/discord/connect", selectData, errorMessage: "Unable to start Discord connection.", toast: { error: true } });
export const syncDiscordRoles = createApiThunk("discordOperations/sync", { method: "post", path: "/api/discord/sync", selectData, errorMessage: "Unable to synchronize Discord roles.", toast: { success: true, error: true } });

const emptyConnection = { connected: false, discordUsername: null, status: "disconnected", syncedRoles: 0, lastSyncedAt: null, syncCode: null };

const slice = createSlice({
  name: "discordOperations",
  initialState: { actionStatus: "idle", configured: false, connection: emptyConnection, error: null, loaded: false, serverUrl: "", status: "idle" },
  reducers: {},
  extraReducers: (builder) => builder
    .addCase(fetchDiscordConnection.pending, (state) => { state.status = "loading"; state.error = null; })
    .addCase(fetchDiscordConnection.fulfilled, (state, action) => { state.configured = Boolean(action.payload.configured); state.connection = action.payload.connection || emptyConnection; state.serverUrl = action.payload.serverUrl || ""; state.loaded = true; state.status = "succeeded"; })
    .addCase(fetchDiscordConnection.rejected, (state, action) => { state.status = action.meta.aborted ? "idle" : "failed"; state.error = action.meta.aborted ? null : action.payload?.message || action.error.message; })
    .addCase(connectDiscord.pending, (state) => { state.actionStatus = "loading"; state.error = null; })
    .addCase(connectDiscord.fulfilled, (state) => { state.actionStatus = "succeeded"; })
    .addCase(connectDiscord.rejected, (state, action) => { state.actionStatus = action.meta.aborted ? "idle" : "failed"; state.error = action.meta.aborted ? null : action.payload?.message || action.error.message; })
    .addCase(syncDiscordRoles.pending, (state) => { state.actionStatus = "loading"; state.error = null; })
    .addCase(syncDiscordRoles.fulfilled, (state, action) => { state.actionStatus = "succeeded"; state.connection = action.payload; })
    .addCase(syncDiscordRoles.rejected, (state, action) => { state.actionStatus = action.meta.aborted ? "idle" : "failed"; state.error = action.meta.aborted ? null : action.payload?.message || action.error.message; }),
});

export default slice;
