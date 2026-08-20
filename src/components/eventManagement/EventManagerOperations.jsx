import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchManagedEventMatches,
  fetchManagedEventOperations,
  fetchManagedEventRegistrations,
  fetchManagedEventStandings,
  fetchEligibleEventOperators,
  assignManagedEventOperator,
} from "../../store/slices/eventManagementSlice.js";

const formatDate = (value) => {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleString();
};

const labelStatus = (value) => String(value || "unknown").replaceAll("_", " ");

const EventManagerOperations = ({ onClose, runId }) => {
  const dispatch = useDispatch();
  const [view, setView] = useState("registrations");
  const [registrationFilter, setRegistrationFilter] = useState("all");
  const state = useSelector((root) => root.eventManagement);
  const operations = state.operationsByRunId[runId];
  const operationsStatus = state.operationsStatusByRunId[runId] || "idle";
  const operationsError = state.operationsErrorByRunId[runId];
  const registrations = state.registrationsByRunId[runId] || { items: [], status: "idle" };
  const matches = state.matchesByRunId[runId] || { items: [], status: "idle" };
  const standings = state.standingsByRunId[runId] || { standings: [] };
  const operators = state.eligibleOperatorsByRunId[runId] || [];

  useEffect(() => {
    const request = dispatch(fetchManagedEventOperations(runId));
    return () => request.abort();
  }, [dispatch, runId]);

  useEffect(() => {
    if (view !== "registrations") return undefined;
    const request = dispatch(fetchManagedEventRegistrations({ runId, status: registrationFilter }));
    return () => request.abort();
  }, [dispatch, registrationFilter, runId, view]);

  useEffect(() => {
    if (view !== "matches") return undefined;
    const request = dispatch(fetchManagedEventMatches({ runId }));
    return () => request.abort();
  }, [dispatch, runId, view]);

  useEffect(() => {
    if (view !== "matches") return undefined;
    const request = dispatch(fetchEligibleEventOperators(runId));
    return () => request.abort();
  }, [dispatch, runId, view]);

  useEffect(() => {
    if (view !== "standings") return undefined;
    const request = dispatch(fetchManagedEventStandings({ runId }));
    return () => request.abort();
  }, [dispatch, runId, view]);

  const summary = operations?.summary;

  return (
    <section className="rounded-3xl border border-cyan-300/20 bg-[#07111f] p-5" id="event-operations">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">Event details</p>
          <h2 className="mt-1 text-xl font-black text-white">{operations?.run?.title || "Loading Event..."}</h2>
          {operations?.run ? (
            <p className="mt-1 text-xs capitalize text-slate-400">
              {labelStatus(operations.run.status)} / starts {formatDate(operations.run.startsAt)}
            </p>
          ) : null}
        </div>
        <button className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300" onClick={onClose} type="button">Close details</button>
      </div>

      {operationsError ? <p className="mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-100">{operationsError}</p> : null}
      {operationsStatus === "loading" && !operations ? <p className="mt-4 text-sm text-slate-400">Loading operational summary...</p> : null}

      {summary ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Registered" value={summary.registrations.registered} />
          <SummaryCard label="Waitlisted" value={summary.registrations.waitlisted} />
          <SummaryCard label="Match rooms" value={summary.matches.total} />
          <SummaryCard label="Result attention" value={summary.matches.resultAttention + summary.matches.disputed} />
        </div>
      ) : null}

      <div className="mt-5 flex gap-2 border-b border-slate-800 pb-3" role="tablist" aria-label="Event operational details">
        <DetailTab active={view === "registrations"} label="Registrations" onClick={() => setView("registrations")} />
        <DetailTab active={view === "matches"} label="Matches" onClick={() => setView("matches")} />
        <DetailTab active={view === "standings"} label="Standings" onClick={() => setView("standings")} />
      </div>

      {view === "registrations" ? (
        <div className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-black text-white">Player entries</p>
            <select
              aria-label="Registration status"
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
              onChange={(event) => setRegistrationFilter(event.target.value)}
              value={registrationFilter}
            >
              <option value="all">All statuses</option>
              <option value="registered">Registered</option>
              <option value="waitlisted">Waitlisted</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="mt-3 overflow-hidden rounded-2xl border border-slate-800">
            {registrations.items.map((entry) => (
              <div className="grid gap-2 border-t border-slate-800 px-4 py-3 first:border-t-0 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center" key={entry.id}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">{entry.player?.username || "Player"}</p>
                  <p className="truncate text-xs text-slate-500">{entry.player?.profileTag || "No profile tag"}</p>
                </div>
                <span className="w-fit rounded-full border border-slate-700 px-2 py-1 text-[10px] font-black uppercase text-cyan-200">{labelStatus(entry.status)}</span>
                <time className="text-xs text-slate-500">{formatDate(entry.enteredAt)}</time>
              </div>
            ))}
            {registrations.status === "loading" && registrations.items.length === 0 ? <p className="p-4 text-sm text-slate-400">Loading registrations...</p> : null}
            {registrations.status !== "loading" && registrations.items.length === 0 ? <p className="p-4 text-sm text-slate-500">No registrations in this view.</p> : null}
          </div>
          {registrations.error ? <p className="mt-3 text-sm text-rose-200">{registrations.error}</p> : null}
          {registrations.nextCursor ? (
            <button className="mt-3 rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200 disabled:opacity-50" disabled={registrations.status === "loading"} onClick={() => dispatch(fetchManagedEventRegistrations({ cursor: registrations.nextCursor, runId, status: registrationFilter }))} type="button">Load more registrations</button>
          ) : null}
        </div>
      ) : view === "matches" ? (
        <div className="mt-4">
          <p className="text-sm font-black text-white">Generated Match rooms</p>
          <div className="mt-3 grid gap-3">
            {matches.items.map((item) => (
              <article className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4" key={item.batch.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-white">Round {item.stage?.number || "-"} / Room {item.batch.ordinal}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.match?.title || "Match record pending"}</p>
                  </div>
                  <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-black uppercase text-cyan-200">{labelStatus(item.match?.status || item.batch.status)}</span>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-slate-400 sm:grid-cols-2 xl:grid-cols-4">
                  <p><span className="text-slate-600">Players:</span> {item.batch.participantCount}</p>
                  <p><span className="text-slate-600">Checked in:</span> {item.match?.checkedInCount || 0}</p>
                  <p><span className="text-slate-600">Operator:</span> {item.match?.assignedOperator?.username || "Unassigned"}</p>
                  <p><span className="text-slate-600">Scheduled:</span> {formatDate(item.match?.scheduledFor)}</p>
                </div>
                {item.match?.status === "awaiting_operator" ? <label className="mt-3 block text-xs font-bold text-slate-400">Assign operator<select className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" defaultValue="" onChange={(event) => event.target.value && dispatch(assignManagedEventOperator({ matchId: item.match.id, operatorId: event.target.value, runId }))}><option value="">Choose an operator</option>{operators.map((operator) => <option key={operator.id} value={operator.id}>{operator.username} / {operator.activeMatches} active</option>)}</select></label> : null}
                {item.match?.finalScore ? <p className="mt-3 border-t border-slate-800 pt-3 text-sm text-slate-300">Result: {item.match.finalScore}</p> : null}
              </article>
            ))}
            {matches.status === "loading" && matches.items.length === 0 ? <p className="text-sm text-slate-400">Loading Matches...</p> : null}
            {matches.status !== "loading" && matches.items.length === 0 ? <p className="text-sm text-slate-500">No Match rooms have been generated yet.</p> : null}
          </div>
          {matches.error ? <p className="mt-3 text-sm text-rose-200">{matches.error}</p> : null}
          {matches.nextCursor ? (
            <button className="mt-3 rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200 disabled:opacity-50" disabled={matches.status === "loading"} onClick={() => dispatch(fetchManagedEventMatches({ cursor: matches.nextCursor, runId }))} type="button">Load more Matches</button>
          ) : null}
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-sm font-black text-white">Sporting standings</p>
          <div className="mt-3 overflow-hidden rounded-2xl border border-slate-800">
            {standings.standings.map((row) => <div className="grid grid-cols-[3rem_1fr_auto] gap-3 border-t border-slate-800 px-4 py-3 first:border-t-0" key={`${row.placement}:${row.player?.profileTag}`}><strong className="text-cyan-200">#{row.placement}</strong><span><strong className="block text-white">{row.player?.displayName || "Player"}</strong><small className="text-slate-500">{row.player?.profileTag}</small></span><span className="capitalize text-slate-400">{labelStatus(row.result)}</span></div>)}
            {!standings.standings.length ? <p className="p-4 text-sm text-slate-500">Standings appear after verified Match results.</p> : null}
          </div>
          {standings.nextCursor ? <button className="mt-3 rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200" onClick={() => dispatch(fetchManagedEventStandings({ cursor: standings.nextCursor, runId }))} type="button">Load more standings</button> : null}
        </div>
      )}
    </section>
  );
};

const SummaryCard = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-black text-white">{value}</p>
  </div>
);

const DetailTab = ({ active, label, onClick }) => (
  <button aria-selected={active} className={active ? "rounded-xl bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950" : "rounded-xl px-4 py-2 text-sm font-bold text-slate-400 hover:bg-slate-900"} onClick={onClick} role="tab" type="button">{label}</button>
);

DetailTab.propTypes = { active: PropTypes.bool.isRequired, label: PropTypes.string.isRequired, onClick: PropTypes.func.isRequired };
SummaryCard.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.number.isRequired };
EventManagerOperations.propTypes = { onClose: PropTypes.func.isRequired, runId: PropTypes.string.isRequired };

export default EventManagerOperations;
