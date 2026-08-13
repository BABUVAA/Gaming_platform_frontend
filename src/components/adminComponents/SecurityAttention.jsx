import { useEffect } from "react";
import PropTypes from "prop-types";
import { FiAlertTriangle, FiRefreshCw, FiShield } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { fetchSecurityAttention } from "../../store/slices/securityAttentionSlice.js";

const labels = {
  PRIVILEGED_SIGNUP_FIELD_ATTEMPT: "Blocked privilege injection during signup",
  SESSION_FINGERPRINT_MISMATCH: "Session fingerprint changed",
  SESSION_REFRESH_REPLAY: "Refresh token replay detected",
};
const formatTime = (value) => new Date(value).toLocaleString();

const SecurityAttention = () => {
  const dispatch = useDispatch();
  const state = useSelector((root) => root.securityAttention);
  useEffect(() => { dispatch(fetchSecurityAttention({})); }, [dispatch]);
  return (
    <section className="space-y-5">
      <header className="flex flex-col gap-4 rounded-3xl border border-cyan-300/15 bg-cyan-300/5 p-5 md:flex-row md:items-end md:justify-between">
        <div><p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Security oversight</p><h1 className="mt-2 text-2xl font-black text-white">Security attention</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Review durable, privacy-preserving authentication risk signals. Raw credentials, tokens, IP addresses, and full identity hashes are never exposed.</p></div>
        <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-50" disabled={state.status === "loading"} onClick={() => dispatch(fetchSecurityAttention({}))} type="button"><FiRefreshCw />Refresh</button>
      </header>
      <div className="grid gap-3 sm:grid-cols-3"><Metric label="Signals in 24 hours" value={state.summary.last24Hours} /><Metric label="High severity" value={state.summary.highSeverityLast24Hours} warning /><Metric label="Retention" suffix=" days" value={state.summary.retentionDays} /></div>
      {state.error && <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-100">{String(state.error)}</div>}
      <div className="overflow-hidden rounded-2xl border border-slate-800">
        {state.events.map((event) => <article className="grid gap-3 border-t border-slate-800 bg-slate-950/50 p-4 first:border-t-0 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center" key={event.id}><span className={event.severity === "high" ? "grid h-10 w-10 place-items-center rounded-xl bg-rose-400/10 text-rose-300" : "grid h-10 w-10 place-items-center rounded-xl bg-amber-300/10 text-amber-200"}>{event.severity === "high" ? <FiAlertTriangle /> : <FiShield />}</span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-bold text-white">{labels[event.type] || event.type.replaceAll("_", " ")}</p><span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-black uppercase text-slate-300">{event.severity}</span></div><p className="mt-2 text-xs text-slate-500">Correlation: {event.correlation?.actor || event.correlation?.email || "not available"} / network {event.correlation?.network || "not available"}</p>{event.fields?.length > 0 && <p className="mt-1 text-xs text-slate-500">Blocked fields: {event.fields.join(", ")}</p>}</div><time className="text-xs text-slate-500">{formatTime(event.createdAt)}</time></article>)}
        {state.status === "loading" && state.events.length === 0 && <p className="p-6 text-sm text-slate-500">Loading security attention...</p>}
        {state.status !== "loading" && state.events.length === 0 && !state.error && <p className="p-6 text-sm text-slate-500">No retained security signals require review.</p>}
      </div>
      {state.page.hasMore && <button className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-bold text-slate-200 disabled:opacity-50" disabled={state.status === "loading_more"} onClick={() => dispatch(fetchSecurityAttention({ cursor: state.page.nextCursor }))} type="button">{state.status === "loading_more" ? "Loading..." : "Load older signals"}</button>}
    </section>
  );
};
const Metric = ({ label, suffix = "", value, warning = false }) => <div className="rounded-2xl border border-slate-800 bg-slate-950/55 p-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p><p className={warning ? "mt-2 text-3xl font-black text-rose-300" : "mt-2 text-3xl font-black text-white"}>{value}{suffix}</p></div>;
Metric.propTypes = { label: PropTypes.string.isRequired, suffix: PropTypes.string, value: PropTypes.number.isRequired, warning: PropTypes.bool };
export default SecurityAttention;
