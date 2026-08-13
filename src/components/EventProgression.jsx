import PropTypes from "prop-types";
import { Link } from "react-router-dom";

const labels = {
  awaiting_dispute_window: "Awaiting dispute window",
  disputed: "Result disputed",
  advancing: "Preparing next stage",
  next_stage_ready: "Next stage ready",
  results_finalized: "Results finalized",
  completed: "Competition completed",
};

const humanize = (value) =>
  labels[value] || value?.replaceAll("_", " ") || "Waiting for results";

const formatDate = (value) => {
  if (!value) return "Schedule pending";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Schedule pending"
    : date.toLocaleString();
};

const EventProgression = ({ progression, standings = [] }) => {
  if (!progression && standings.length === 0) return null;

  const ownBatch = progression?.myBatch || progression?.nextBatch;

  return (
    <section className="mt-4 space-y-3 rounded-2xl border border-cyan-300/20 bg-cyan-300/5 p-4">
      {progression ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-black capitalize text-white">
              {humanize(progression.status)}
            </p>
            {progression.stageNumber ? (
              <p className="mt-1 text-xs text-slate-400">
                Stage {progression.stageNumber}
                {progression.stageStatus
                  ? ` / ${humanize(progression.stageStatus)}`
                  : ""}
              </p>
            ) : null}
          </div>
          {progression.result ? (
            <span className="rounded-full border border-cyan-300/25 px-3 py-1 text-xs font-bold capitalize text-cyan-100">
              {humanize(progression.result)}
            </span>
          ) : null}
        </div>
      ) : null}

      {progression?.prize ? (
        <div className="rounded-xl border border-emerald-300/25 bg-emerald-300/10 p-3 text-sm text-emerald-50">
          <p className="font-black">Placement reward</p>
          <p className="mt-1 text-xs text-emerald-100/80">
            INR {(progression.prize.amountMinor / 100).toFixed(2)} / {progression.prize.status === "released" ? "available to withdraw" : "pending governance release"}
          </p>
        </div>
      ) : null}

      {ownBatch ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <p className="text-sm font-bold text-white">
            Stage {ownBatch.stageNumber} / Batch {ownBatch.ordinal}
          </p>
          <p className="mt-1 text-xs capitalize text-slate-400">
            {humanize(ownBatch.matchStatus)} / {formatDate(ownBatch.scheduledFor)}
          </p>
          {ownBatch.matchId ? (
            <Link
              className="mt-3 inline-block rounded-xl bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950"
              to={`/dashboard/matches/${ownBatch.matchId}`}
            >
              Open your Match
            </Link>
          ) : null}
        </div>
      ) : null}

      {standings.length > 0 ? (
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">
            Standings
          </p>
          <ol className="mt-2 space-y-2">
            {standings.map((standing) => (
              <li
                className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-2 rounded-xl bg-slate-950/60 px-3 py-2 text-sm"
                key={`${standing.placement}-${standing.player.profileTag || standing.player.displayName}`}
              >
                <span className="font-black text-cyan-200">
                  #{standing.placement}
                </span>
                <span className="min-w-0 truncate font-bold text-white">
                  {standing.player.displayName}
                  {standing.player.profileTag ? (
                    <span className="ml-2 font-normal text-slate-500">
                      {standing.player.profileTag}
                    </span>
                  ) : null}
                </span>
                <span className="capitalize text-slate-400">
                  {humanize(standing.result)}
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  );
};

const batchShape = PropTypes.shape({
  matchId: PropTypes.string,
  matchStatus: PropTypes.string,
  ordinal: PropTypes.number.isRequired,
  scheduledFor: PropTypes.string,
  stageNumber: PropTypes.number.isRequired,
});

EventProgression.propTypes = {
  progression: PropTypes.shape({
    myBatch: batchShape,
    nextBatch: batchShape,
    result: PropTypes.string,
    prize: PropTypes.shape({
      amountMinor: PropTypes.number.isRequired,
      status: PropTypes.oneOf(["pending", "released"]).isRequired,
    }),
    stageNumber: PropTypes.number,
    stageStatus: PropTypes.string,
    status: PropTypes.string,
  }),
  standings: PropTypes.arrayOf(
    PropTypes.shape({
      placement: PropTypes.number.isRequired,
      player: PropTypes.shape({
        displayName: PropTypes.string.isRequired,
        profileTag: PropTypes.string,
      }).isRequired,
      result: PropTypes.string.isRequired,
    }),
  ),
};

export default EventProgression;
