import { useEffect } from "react";
import { FiActivity, FiAlertTriangle, FiClock, FiRadio, FiRefreshCw, FiUsers } from "react-icons/fi";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { ROUTES } from "../routes/routeConstants";
import { fetchManagedGameOperations } from "../store/slices/gameManagementSlice";

const formatSchedule = (value) => {
  if (!value) return "Schedule pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Schedule pending";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", hour: "numeric", minute: "2-digit", month: "short" }).format(date);
};

const formatAction = (entry) => {
  if (entry.command) return entry.command.replaceAll("_", " ");
  return entry.action?.replaceAll("_", " ").toLowerCase() || "operation updated";
};

const Metric = ({ label, value, warning = false }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
    <p className={warning ? "mt-2 text-3xl font-black text-amber-300" : "mt-2 text-3xl font-black text-white"}>{value}</p>
  </div>
);

Metric.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  warning: PropTypes.bool,
};

const GameManagerDashboard = () => {
  const dispatch = useDispatch();
  const { error, operations, status } = useSelector((state) => state.gameManagement);

  useEffect(() => {
    // This read model contains only games inside the active assignment scope.
    dispatch(fetchManagedGameOperations());
  }, [dispatch]);

  const total = operations.reduce(
    (summary, item) => ({
      activeMatches: summary.activeMatches + item.metrics.activeMatches,
      attentionNeeded: summary.attentionNeeded + item.metrics.attentionNeeded,
      liveMatches: summary.liveMatches + item.metrics.liveMatches,
      operators: summary.operators + item.operators.length,
    }),
    { activeMatches: 0, attentionNeeded: 0, liveMatches: 0, operators: 0 },
  );

  return (
    <main className="min-h-screen bg-[#040914] p-3 text-slate-100 md:p-5">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <header className="overflow-hidden rounded-[30px] border border-slate-800 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.15),_transparent_32%),#07111f] p-6 md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Staff workspace</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-white md:text-4xl">Game operations</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Monitor the health of your assigned games, operator workload, and Event readiness. Platform configuration remains read-only here.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-bold text-slate-200" to={ROUTES.STAFF}>All workspaces</Link>
              <button className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-60" disabled={status === "loading"} onClick={() => dispatch(fetchManagedGameOperations())} type="button"><FiRefreshCw /> Refresh</button>
            </div>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Active matches" value={total.activeMatches} />
          <Metric label="Live now" value={total.liveMatches} />
          <Metric label="Needs attention" value={total.attentionNeeded} warning />
          <Metric label="Assigned operators" value={total.operators} />
        </section>

        {error && <section className="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-100">{error}</section>}
        {status === "loading" && operations.length === 0 && <section className="rounded-3xl border border-slate-800 bg-[#07111f] p-8 text-slate-400">Loading assigned game operations...</section>}
        {status !== "loading" && operations.length === 0 && !error && <section className="rounded-3xl border border-slate-800 bg-[#07111f] p-8 text-slate-400">No active game scope is available for this assignment. Ask a Platform Admin to review the assignment.</section>}

        <section className="grid gap-5 xl:grid-cols-2">
          {operations.map((item) => (
            <article className="rounded-3xl border border-slate-800 bg-[#07111f] p-5 md:p-6" key={item.game._id}>
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">{item.game.status}</p><h2 className="mt-2 text-2xl font-black text-white">{item.game.name}</h2><p className="mt-1 text-sm text-slate-500">{item.game.link}</p></div>
                {item.metrics.attentionNeeded > 0 && <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-xs font-bold text-amber-200"><FiAlertTriangle /> {item.metrics.attentionNeeded} needs attention</span>}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <Metric label="Awaiting operator" value={item.metrics.awaitingOperator} warning={item.metrics.awaitingOperator > 0} />
                <Metric label="Live matches" value={item.metrics.liveMatches} />
                <Metric label="Active Event runs" value={item.eventReadiness.activeRuns} />
                <Metric label="Upcoming Event runs" value={item.eventReadiness.upcomingRuns} />
              </div>

              <div className="mt-6 border-t border-slate-800 pt-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Attention queue</p>
                <div className="mt-3 space-y-2">
                  {(item.attention || []).map((match) => (
                    <div className="rounded-xl border border-amber-300/20 bg-amber-300/5 px-3 py-3" key={match._id}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-100">{match.title}</p>
                          <p className="mt-1 text-xs text-amber-200">{match.reason}</p>
                        </div>
                        <span className="shrink-0 text-xs font-bold capitalize text-slate-400">{match.status.replaceAll("_", " ")}</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        {formatSchedule(match.scheduledFor)} / {match.assignedOperator?.username || "Unassigned"}
                      </p>
                    </div>
                  ))}
                  {(item.attention || []).length === 0 && <p className="text-sm text-slate-500">No delayed or disputed work needs attention.</p>}
                </div>
              </div>

              <div className="mt-6 border-t border-slate-800 pt-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Operator workload</p>
                <div className="mt-3 space-y-2">
                  {item.operators.map(({ activeMatches, operator }) => <div className="flex items-center justify-between rounded-xl bg-slate-950/70 px-3 py-3" key={operator._id}><span className="inline-flex items-center gap-2 text-sm font-bold text-slate-200"><FiUsers className="text-cyan-300" />{operator.username}</span><span className="text-sm text-slate-400">{activeMatches} active</span></div>)}
                  {item.operators.length === 0 && <p className="text-sm text-slate-500">No assigned operator workload yet.</p>}
                </div>
              </div>

              <div className="mt-6 border-t border-slate-800 pt-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Operational history</p>
                <div className="mt-3 space-y-2">
                  {(item.recentActivity || []).map((entry) => (
                    <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-800 px-3 py-3" key={entry._id}>
                      <div className="min-w-0">
                        <p className="text-sm font-bold capitalize text-slate-200">{formatAction(entry)}</p>
                        <p className="mt-1 truncate text-xs text-slate-500">{entry.operator?.username || "System"}{entry.toStatus ? ` / ${entry.toStatus.replaceAll("_", " ")}` : ""}</p>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs text-slate-500"><FiClock />{formatSchedule(entry.createdAt)}</span>
                    </div>
                  ))}
                  {(item.recentActivity || []).length === 0 && <p className="text-sm text-slate-500">No recent operator actions for this game.</p>}
                </div>
              </div>

              <div className="mt-6 border-t border-slate-800 pt-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Recent match activity</p>
                <div className="mt-3 space-y-2">
                  {item.recentMatches.map((match) => <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 px-3 py-3" key={match._id}><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-200">{match.title}</p><p className="mt-1 text-xs text-slate-500">{formatSchedule(match.scheduledFor)}</p></div><span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-cyan-200"><FiRadio />{match.status.replaceAll("_", " ")}</span></div>)}
                  {item.recentMatches.length === 0 && <p className="text-sm text-slate-500">No match activity for this game.</p>}
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-cyan-300/15 bg-cyan-300/5 p-5 text-sm text-slate-300"><p className="inline-flex items-center gap-2 font-black text-white"><FiActivity className="text-cyan-300" /> Scope boundary</p><p className="mt-2 leading-6">This workspace supervises assigned games only. Game rules, staff assignments, Event approval, and match commands stay with their authorized roles.</p></section>
      </div>
    </main>
  );
};

export default GameManagerDashboard;
