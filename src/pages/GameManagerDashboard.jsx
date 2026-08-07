import { useEffect } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import { fetchManagedGameOperations } from "../store/slices/gameManagementSlice";

const ACTIVE_MATCH_STATUSES = new Set([
  "operator_assigned",
  "scheduled",
  "check_in",
  "lobby_ready",
  "live",
  "result_pending",
  "disputed",
]);

const GameManagerDashboard = () => {
  const dispatch = useDispatch();
  const { operations = [], status } = useSelector(
    (state) => state.gameManagement,
  );

  useEffect(() => {
    // The server returns only games assigned to this Game Manager role.
    dispatch(fetchManagedGameOperations());
  }, [dispatch]);

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 text-slate-100 md:p-6">
      <header className="rounded-[30px] border border-slate-800 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.14),transparent_42%)] p-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
          Assigned game operations
        </p>
        <h1 className="mt-2 text-3xl font-black text-white">Game Manager</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
          Monitor room health, operator workload, and Event readiness for your
          assigned games. Platform Admin owns all game, staff, template, and
          Event approval changes.
        </p>
      </header>

      {status === "loading" && (
        <p className="text-sm text-slate-400">Loading game operations...</p>
      )}
      {status !== "loading" && operations.length === 0 && (
        <p className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/80 p-7 text-sm text-slate-400">
          No games are assigned to your Game Manager role yet. A Platform Admin
          can add an assigned game scope in Role Management.
        </p>
      )}
      <section className="space-y-6">
        {operations.map((operation) => (
          <GameOperationsCard key={operation.game._id} operation={operation} />
        ))}
      </section>
    </main>
  );
};

const GameOperationsCard = ({ operation }) => {
  const { eventReadiness, game, metrics, operators, recentMatches } = operation;

  return (
    <article className="overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950/90">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 bg-slate-900/45 p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
            {game.link}
          </p>
          <h2 className="mt-1 text-2xl font-black text-white">{game.name}</h2>
          <p className="mt-2 text-sm text-slate-400">
            Operational visibility only. Match Operators own room actions.
          </p>
        </div>
        <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-bold capitalize text-slate-300">
          {game.status}
        </span>
      </header>

      <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Needs attention" tone="rose" value={metrics.attentionNeeded} />
        <Metric label="Waiting for operator" tone="amber" value={metrics.awaitingOperator} />
        <Metric label="Active rooms" tone="cyan" value={metrics.activeMatches} />
        <Metric label="Live now" tone="emerald" value={metrics.liveMatches} />
      </div>

      <div className="grid gap-5 border-t border-slate-800 p-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
            Event readiness
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <ReadinessItem label="Active templates" value={eventReadiness.activeTemplates} />
            <ReadinessItem label="Draft proposals" value={eventReadiness.draftTemplates} />
            <ReadinessItem label="Upcoming runs" value={eventReadiness.upcomingRuns} />
            <ReadinessItem label="Running now" value={eventReadiness.activeRuns} />
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            Templates and Event Runs require Platform Admin approval before
            they become player-facing work.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
            Operator workload
          </p>
          <div className="mt-3 space-y-2">
            {operators.map((item) => (
              <div className="flex items-center justify-between rounded-xl bg-slate-950/65 px-3 py-2" key={item.operator._id}>
                <span className="truncate text-sm font-bold text-white">{item.operator.username}</span>
                <span className="text-xs font-bold text-slate-400">{item.activeMatches} active</span>
              </div>
            ))}
            {operators.length === 0 && (
              <p className="text-sm text-slate-500">No operator workload is recorded for this game yet.</p>
            )}
          </div>
        </section>
      </div>

      <section className="border-t border-slate-800 p-5">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">Recent rooms</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {recentMatches.map((match) => <MatchCard key={match._id} match={match} />)}
          {recentMatches.length === 0 && <p className="text-sm text-slate-500">No rooms have been created for this game yet.</p>}
        </div>
      </section>
    </article>
  );
};

const Metric = ({ label, tone, value }) => {
  const tones = {
    amber: "border-amber-300/20 bg-amber-300/5 text-amber-200",
    cyan: "border-cyan-300/20 bg-cyan-300/5 text-cyan-200",
    emerald: "border-emerald-300/20 bg-emerald-300/5 text-emerald-200",
    rose: "border-rose-300/20 bg-rose-300/5 text-rose-200",
  };
  return <div className={`rounded-2xl border p-4 ${tones[tone]}`}><p className="text-2xl font-black">{value}</p><p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em]">{label}</p></div>;
};

const ReadinessItem = ({ label, value }) => <div className="rounded-xl bg-slate-950/65 p-3"><p className="text-lg font-black text-white">{value}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p></div>;

const MatchCard = ({ match }) => <article className="rounded-2xl border border-slate-800 bg-slate-900/45 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-bold text-white">{match.title}</p><p className="mt-1 text-xs text-slate-500">{match.mode} / {match.map || "Map pending"}</p></div><span className={ACTIVE_MATCH_STATUSES.has(match.status) ? "text-xs font-bold text-cyan-200" : "text-xs font-bold text-slate-500"}>{match.status.replaceAll("_", " ")}</span></div><p className="mt-3 text-xs text-slate-400">{match.assignedOperator?.profile?.username || "No operator assigned"} · {match.participants?.length || 0} players</p></article>;

const metricShape = PropTypes.shape({ activeMatches: PropTypes.number.isRequired, attentionNeeded: PropTypes.number.isRequired, awaitingOperator: PropTypes.number.isRequired, liveMatches: PropTypes.number.isRequired }).isRequired;
const operationShape = PropTypes.shape({ game: PropTypes.shape({ _id: PropTypes.string.isRequired, link: PropTypes.string.isRequired, name: PropTypes.string.isRequired, status: PropTypes.string.isRequired }).isRequired, metrics: metricShape, eventReadiness: PropTypes.shape({ activeRuns: PropTypes.number.isRequired, activeTemplates: PropTypes.number.isRequired, draftTemplates: PropTypes.number.isRequired, upcomingRuns: PropTypes.number.isRequired }).isRequired, operators: PropTypes.array.isRequired, recentMatches: PropTypes.array.isRequired }).isRequired;
GameOperationsCard.propTypes = { operation: operationShape };
Metric.propTypes = { label: PropTypes.string.isRequired, tone: PropTypes.oneOf(["amber", "cyan", "emerald", "rose"]).isRequired, value: PropTypes.number.isRequired };
ReadinessItem.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.number.isRequired };
MatchCard.propTypes = { match: PropTypes.object.isRequired };

export default GameManagerDashboard;
