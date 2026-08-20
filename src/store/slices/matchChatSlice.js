import { createSlice } from "@reduxjs/toolkit";
import createApiThunk from "../thunks/createApiThunk.js";

const base = ({ audience, matchId }) => audience === "operator" ? `/api/operator/matches/${matchId}/chat` : `/api/matches/${matchId}/chat`;
const keyOf = ({ audience, matchId }) => `${audience}:${matchId}`;

export const fetchMatchChat = createApiThunk("matchChat/fetch", {
  path: ({ arg }) => base(arg),
  getParams: ({ cursor } = {}) => ({ limit: 30, ...(cursor ? { cursor } : {}) }),
  selectData: (response) => response.data?.data || { messages: [], page: {} },
  errorMessage: "Unable to load Match chat.",
});

export const sendMatchChatMessage = createApiThunk("matchChat/send", {
  method: "post",
  path: ({ arg }) => base(arg),
  getBody: ({ message }) => ({ message }),
  selectData: (response) => response.data?.data?.message,
  errorMessage: "Unable to send this message.",
  toast: { error: true },
}, { condition: (arg, { getState }) => getState().matchChat.byMatch[keyOf(arg)]?.sendStatus !== "loading" });

const matchChatSlice = createSlice({
  name: "matchChat",
  initialState: { byMatch: {} },
  reducers: {},
  extraReducers: (builder) => builder
    .addCase(fetchMatchChat.pending, (state, action) => {
      const key = keyOf(action.meta.arg); const current = state.byMatch[key] || { messages: [] };
      state.byMatch[key] = { ...current, error: null, requestId: action.meta.requestId, status: "loading" };
    })
    .addCase(fetchMatchChat.fulfilled, (state, action) => {
      const key = keyOf(action.meta.arg); const current = state.byMatch[key] || { messages: [] };
      if (current.requestId !== action.meta.requestId) return;
      const rows = new Map((action.meta.arg.cursor ? current.messages : []).map((message) => [message.id, message]));
      action.payload.messages.forEach((message) => rows.set(message.id, message));
      state.byMatch[key] = { ...current, error: null, messages: [...rows.values()].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)), nextCursor: action.payload.page?.nextCursor || null, requestId: null, status: "succeeded" };
    })
    .addCase(fetchMatchChat.rejected, (state, action) => {
      const key = keyOf(action.meta.arg); const current = state.byMatch[key] || { messages: [] };
      if (current.requestId !== action.meta.requestId) return;
      state.byMatch[key] = { ...current, error: action.meta.aborted ? null : action.payload?.message || action.error.message, requestId: null, status: action.meta.aborted ? "idle" : "failed" };
    })
    .addCase(sendMatchChatMessage.pending, (state, action) => {
      const key = keyOf(action.meta.arg); state.byMatch[key] = { ...(state.byMatch[key] || { messages: [] }), sendStatus: "loading" };
    })
    .addCase(sendMatchChatMessage.fulfilled, (state, action) => {
      const key = keyOf(action.meta.arg); const current = state.byMatch[key] || { messages: [] };
      if (!current.messages.some((message) => message.id === action.payload.id)) current.messages.push(action.payload);
      current.sendStatus = "succeeded";
    })
    .addCase(sendMatchChatMessage.rejected, (state, action) => {
      if (action.meta.condition) return;
      const key = keyOf(action.meta.arg); state.byMatch[key] = { ...(state.byMatch[key] || { messages: [] }), sendStatus: "failed" };
    }),
});

export default matchChatSlice.reducer;
