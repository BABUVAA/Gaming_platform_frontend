import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { FiAlertTriangle, FiRefreshCw, FiShield } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { fetchGameAccountFraudCases, fetchSecurityAttention, resolveGameAccountFraudCase } from "../../store/slices/securityAttentionSlice.js";

const labels = {
  PRIVILEGED_SIGNUP_FIELD_ATTEMPT: "Blocked privilege injection during signup",
  SESSION_FINGERPRINT_MISMATCH: "Session fingerprint changed",
  SESSION_REFRESH_REPLAY: "Refresh token replay detected",
};
const formatTime = (value) => new Date(value).toLocaleString();

const SecurityAttention = () => {
  const dispatch = useDispatch();
  const state = useSelector((root) => root.securityAttention);
  const [selectedCase, setSelectedCase] = useState(null);
  const [note, setNote] = useState("");
  useEffect(() => { dispatch(fetchSecurityAttention({})); dispatch(fetchGameAccountFraudCases({ status: "open" })); }, [dispatch]);
  const decide = async (decision) => {
    try {
      await dispatch(resolveGameAccountFraudCase({ caseId: selectedCase.id, decision, note })).unwrap();
      setSelectedCase(null); setNote("");
    } catch {
      // The slice renders the server-owned error and keeps the decision open.
    }
  };
  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/55 p-3">
        <p className="inline-flex items-center gap-2 text-sm font-bold text-slate-300"><FiShield className="text-cyan-300" />Retained authentication signals</p>
        <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm font-bold text-slate-200 disabled:opacity-50" disabled={state.status === "loading"} onClick={() => dispatch(fetchSecurityAttention({}))} type="button"><FiRefreshCw />Refresh</button>
      </header>
      <div className="grid gap-3 sm:grid-cols-3"><Metric label="Signals in 24 hours" value={state.summary.last24Hours} /><Metric label="High severity" value={state.summary.highSeverityLast24Hours} warning /><Metric label="Retention" suffix=" days" value={state.summary.retentionDays} /></div>
      <section className="overflow-hidden rounded-2xl border border-rose-400/25 bg-slate-950/50">
        <div className="flex items-center justify-between border-b border-slate-800 p-4"><p className="font-black text-white">Game-account fraud review</p><span className="rounded-full bg-rose-400/10 px-2.5 py-1 text-xs font-bold text-rose-200">{state.fraudCases.length} open</span></div>
        {state.fraudCases.map((item) => <article className="grid gap-3 border-t border-slate-800 p-4 first:border-t-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center" key={item.id}><div><p className="font-bold text-white">{item.player?.username} · {item.game?.name}</p><p className="mt-1 text-xs text-slate-400">{item.request?.previousIdentity?.accountId ? `${item.request.previousIdentity.accountId} → ${item.request.accountId}` : `First verification · ${item.request?.accountId}`}</p><p className="mt-2 text-sm text-slate-300">{item.openingNote}</p></div><button className="rounded-xl border border-rose-400/40 px-4 py-2 text-sm font-black text-rose-200" onClick={() => { setSelectedCase(item); setNote(""); }} type="button">Review case</button></article>)}
        {state.fraudStatus === "loading" && state.fraudCases.length === 0 ? <p className="p-4 text-sm text-slate-500">Loading fraud cases...</p> : null}
        {state.fraudStatus !== "loading" && state.fraudCases.length === 0 ? <p className="p-4 text-sm text-slate-500">No game-account fraud cases are open.</p> : null}
      </section>
      {state.error && <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-100">{String(state.error)}</div>}
      <div className="overflow-hidden rounded-2xl border border-slate-800">
        {state.events.map((event) => <article className="grid gap-3 border-t border-slate-800 bg-slate-950/50 p-4 first:border-t-0 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center" key={event.id}><span className={event.severity === "high" ? "grid h-10 w-10 place-items-center rounded-xl bg-rose-400/10 text-rose-300" : "grid h-10 w-10 place-items-center rounded-xl bg-amber-300/10 text-amber-200"}>{event.severity === "high" ? <FiAlertTriangle /> : <FiShield />}</span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-bold text-white">{labels[event.type] || event.type.replaceAll("_", " ")}</p><span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-black uppercase text-slate-300">{event.severity}</span></div><p className="mt-2 text-xs text-slate-500">Correlation: {event.correlation?.actor || event.correlation?.email || "not available"} / network {event.correlation?.network || "not available"}</p>{event.fields?.length > 0 && <p className="mt-1 text-xs text-slate-500">Blocked fields: {event.fields.join(", ")}</p>}</div><time className="text-xs text-slate-500">{formatTime(event.createdAt)}</time></article>)}
        {state.status === "loading" && state.events.length === 0 && <p className="p-6 text-sm text-slate-500">Loading security attention...</p>}
        {state.status !== "loading" && state.events.length === 0 && !state.error && <p className="p-6 text-sm text-slate-500">No retained security signals require review.</p>}
      </div>
      {state.page.hasMore && <button className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-bold text-slate-200 disabled:opacity-50" disabled={state.status === "loading_more"} onClick={() => dispatch(fetchSecurityAttention({ cursor: state.page.nextCursor }))} type="button">{state.status === "loading_more" ? "Loading..." : "Load older signals"}</button>}
      {selectedCase ? <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-4"><div className="w-full max-w-xl rounded-t-3xl border border-slate-800 bg-[#07111f] p-5 sm:rounded-3xl"><h3 className="text-xl font-black text-white">Fraud decision</h3><p className="mt-2 text-sm text-slate-400">Clear removes the temporary freeze. Confirm permanently bans the account. No ledger balance is automatically confiscated.</p><textarea className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white" maxLength={1000} onChange={(event) => setNote(event.target.value)} placeholder="Required investigation finding" rows={4} value={note} />{state.fraudError ? <p className="mt-2 text-sm text-rose-200">{String(state.fraudError)}</p> : null}<div className="mt-4 grid grid-cols-2 gap-3"><button className="rounded-xl border border-emerald-400/40 px-4 py-3 font-black text-emerald-200" disabled={state.fraudStatus === "deciding" || note.trim().length < 10} onClick={() => decide("clear")} type="button">Clear player</button><button className="rounded-xl bg-rose-500 px-4 py-3 font-black text-white" disabled={state.fraudStatus === "deciding" || note.trim().length < 10} onClick={() => decide("confirm")} type="button">Permanent ban</button></div><button className="mt-3 w-full py-2 text-sm font-bold text-slate-400" onClick={() => setSelectedCase(null)} type="button">Cancel</button></div></div> : null}
    </section>
  );
};
const Metric = ({ label, suffix = "", value, warning = false }) => <div className="rounded-xl border border-slate-800 bg-slate-950/45 p-3"><p className="text-xs font-bold text-slate-500">{label}</p><p className={warning ? "mt-1 text-xl font-black text-rose-300" : "mt-1 text-xl font-black text-white"}>{value}{suffix}</p></div>;
Metric.propTypes = { label: PropTypes.string.isRequired, suffix: PropTypes.string, value: PropTypes.number.isRequired, warning: PropTypes.bool };
export default SecurityAttention;
