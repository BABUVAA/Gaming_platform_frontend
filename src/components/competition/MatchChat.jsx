import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import { fetchMatchChat, sendMatchChatMessage } from "../../store/slices/matchChatSlice.js";
import useSocket from "../../context/useSocket.js";

const MatchChat = ({ audience, matchId }) => {
  const dispatch = useDispatch();
  const { competitionRevision } = useSocket();
  const [draft, setDraft] = useState("");
  const key = `${audience}:${matchId}`;
  const chat = useSelector((state) => state.matchChat.byMatch[key]) || { messages: [], status: "idle" };
  useEffect(() => { const request = dispatch(fetchMatchChat({ audience, matchId })); return () => request.abort(); }, [audience, competitionRevision, dispatch, matchId]);
  const send = async (event) => {
    event.preventDefault(); const message = draft.trim(); if (!message) return;
    const action = await dispatch(sendMatchChatMessage({ audience, matchId, message }));
    if (sendMatchChatMessage.fulfilled.match(action)) setDraft("");
  };
  return <section className="mt-4 rounded-2xl border border-violet-300/20 bg-violet-300/5 p-4"><div className="flex items-center justify-between"><h4 className="font-black text-white">Match chat</h4><button className="text-xs font-bold text-cyan-200" onClick={() => dispatch(fetchMatchChat({ audience, matchId }))} type="button">Refresh</button></div><div className="mt-3 max-h-72 space-y-2 overflow-y-auto">{chat.messages.map((item) => <div className="rounded-xl bg-slate-950/70 px-3 py-2" key={item.id}><div className="flex justify-between gap-2 text-xs"><strong className="text-cyan-100">{item.author.username}{item.authorRole === "match_operator" ? " / Operator" : ""}</strong><span className="text-slate-600">{new Date(item.createdAt).toLocaleTimeString()}</span></div><p className="mt-1 break-words text-sm text-slate-200">{item.message}</p></div>)}{chat.status === "loading" && !chat.messages.length ? <p className="text-sm text-slate-500">Loading conversation...</p> : null}{chat.status !== "loading" && !chat.messages.length ? <p className="text-sm text-slate-500">No messages yet.</p> : null}</div>{chat.nextCursor ? <button className="mt-3 text-xs font-bold text-slate-300" onClick={() => dispatch(fetchMatchChat({ audience, cursor: chat.nextCursor, matchId }))} type="button">Load older messages</button> : null}<form className="mt-3 flex gap-2" onSubmit={send}><input className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" maxLength={500} onChange={(event) => setDraft(event.target.value)} placeholder="Message players and operator" value={draft} /><button className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 disabled:opacity-50" disabled={!draft.trim() || chat.sendStatus === "loading"} type="submit">Send</button></form>{chat.error ? <p className="mt-2 text-xs text-rose-200">{chat.error}</p> : null}</section>;
};
MatchChat.propTypes = { audience: PropTypes.oneOf(["operator", "player"]).isRequired, matchId: PropTypes.string.isRequired };
export default MatchChat;
