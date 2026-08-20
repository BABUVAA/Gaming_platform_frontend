import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchGameManagerEventMatches,
  fetchGameManagerEventOperations,
  fetchGameManagerEventRegistrations,
  fetchGameManagerEventStandings,
} from "../../store/slices/gameManagementSlice.js";

const label = (value) => String(value || "unknown").replaceAll("_", " ");
const date = (value) => value ? new Date(value).toLocaleString() : "Pending";

const GameManagerEventDetails = ({ event, onClose }) => {
  const dispatch = useDispatch();
  const [tab, setTab] = useState("registrations");
  const state = useSelector((root) => root.gameManagement);
  const runId = event.id;
  const operations = state.eventOperations[runId];
  const registrations = state.eventRegistrations[runId] || { items: [] };
  const matches = state.eventMatches[runId] || { items: [] };
  const standings = state.eventStandings[runId] || { standings: [] };

  useEffect(() => {
    const requests = [dispatch(fetchGameManagerEventOperations({ runId }))];
    if (tab === "registrations") requests.push(dispatch(fetchGameManagerEventRegistrations({ runId })));
    if (tab === "matches") requests.push(dispatch(fetchGameManagerEventMatches({ runId })));
    if (tab === "standings") requests.push(dispatch(fetchGameManagerEventStandings({ runId })));
    return () => requests.forEach((request) => request.abort());
  }, [dispatch, runId, tab]);

  return (
    <section className="rounded-3xl border border-cyan-300/20 bg-[#07111f] p-5 xl:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">Event oversight</p><h2 className="mt-1 text-2xl font-black text-white">{event.title}</h2><p className="mt-1 text-sm capitalize text-slate-400">{label(event.status)} / {event.registeredCount.toLocaleString("en-IN")} registered</p></div>
        <button className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300" onClick={onClose} type="button">Close</button>
      </div>
      {operations?.summary ? <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4"><Metric name="Registered" value={operations.summary.registrations.registered} /><Metric name="Rooms" value={operations.summary.matches.total} /><Metric name="Unassigned" value={operations.summary.matches.awaitingOperator} /><Metric name="Live" value={operations.summary.matches.inProgress} /></div> : null}
      <div className="mt-5 flex flex-wrap gap-2 border-b border-slate-800 pb-3">{["registrations", "matches", "standings"].map((item) => <button className={tab === item ? "rounded-xl bg-cyan-300 px-4 py-2 text-sm font-black capitalize text-slate-950" : "rounded-xl px-4 py-2 text-sm font-bold capitalize text-slate-400"} key={item} onClick={() => setTab(item)} type="button">{item}</button>)}</div>
      {tab === "registrations" ? <><div className="mt-4 overflow-hidden rounded-2xl border border-slate-800">{registrations.items.map((entry) => <div className="grid gap-2 border-t border-slate-800 px-4 py-3 first:border-t-0 sm:grid-cols-[1fr_auto_auto]" key={entry.id}><span><strong className="block text-sm text-white">{entry.player?.username || "Player"}</strong><small className="text-slate-500">{entry.player?.profileTag}</small></span><span className="capitalize text-cyan-200">{label(entry.status)}</span><span className="text-xs text-slate-500">{date(entry.enteredAt)}</span></div>)}{!registrations.items.length ? <p className="p-4 text-sm text-slate-500">No registration records.</p> : null}</div><LoadMore page={registrations.page} onClick={() => dispatch(fetchGameManagerEventRegistrations({ runId, cursor: registrations.page.nextCursor }))} /></> : null}
      {tab === "matches" ? <><div className="mt-4 grid gap-3">{matches.items.map((item) => <article className="rounded-2xl border border-slate-800 p-4" key={item.batch.id}><div className="flex justify-between gap-3"><strong className="text-white">Round {item.stage?.number} / Room {item.batch.ordinal}</strong><span className="capitalize text-cyan-200">{label(item.match?.status || item.batch.status)}</span></div><div className="mt-2 grid gap-2 text-xs text-slate-400 sm:grid-cols-3"><span>{item.batch.participantCount} players</span><span>{item.match?.checkedInCount || 0} checked in</span><span>{item.match?.assignedOperator?.username || "Unassigned"}</span></div></article>)}{!matches.items.length ? <p className="text-sm text-slate-500">No generated rooms.</p> : null}</div><LoadMore page={matches.page} onClick={() => dispatch(fetchGameManagerEventMatches({ runId, cursor: matches.page.nextCursor }))} /></> : null}
      {tab === "standings" ? <><div className="mt-4 overflow-hidden rounded-2xl border border-slate-800">{standings.standings.map((row) => <div className="grid grid-cols-[3rem_1fr_auto] gap-3 border-t border-slate-800 px-4 py-3 first:border-t-0" key={`${row.placement}:${row.player?.profileTag}`}><strong className="text-cyan-200">#{row.placement}</strong><span><strong className="block text-white">{row.player?.displayName || "Player"}</strong><small className="text-slate-500">{row.player?.profileTag}</small></span><span className="capitalize text-slate-400">{label(row.result)}</span></div>)}{!standings.standings.length ? <p className="p-4 text-sm text-slate-500">Standings appear after verified results.</p> : null}</div><LoadMore page={standings.page} onClick={() => dispatch(fetchGameManagerEventStandings({ runId, cursor: standings.page.nextCursor }))} /></> : null}
      <p className="mt-4 text-xs text-slate-500">Read-only assigned-game view. Lobby credentials, chat, wallets and result evidence are excluded.</p>
    </section>
  );
};

const LoadMore = ({ onClick, page }) => page?.hasMore && page.nextCursor ? <button className="mt-4 rounded-xl border border-cyan-300/30 px-4 py-2 text-sm font-black text-cyan-200" onClick={onClick} type="button">Load more</button> : null;
LoadMore.propTypes = { onClick: PropTypes.func.isRequired, page: PropTypes.shape({ hasMore: PropTypes.bool, nextCursor: PropTypes.string }) };

const Metric = ({ name, value }) => <div className="rounded-2xl border border-slate-800 p-4"><p className="text-xs uppercase text-slate-500">{name}</p><p className="mt-1 text-2xl font-black text-white">{value}</p></div>;
Metric.propTypes = { name: PropTypes.string.isRequired, value: PropTypes.number.isRequired };
GameManagerEventDetails.propTypes = { event: PropTypes.shape({ id: PropTypes.string.isRequired, registeredCount: PropTypes.number.isRequired, status: PropTypes.string.isRequired, title: PropTypes.string.isRequired }).isRequired, onClose: PropTypes.func.isRequired };

export default GameManagerEventDetails;
