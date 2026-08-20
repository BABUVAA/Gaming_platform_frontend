import PropTypes from "prop-types";

const JoinProgress = ({
  capacity,
  joined,
  label = "Join progress",
  status,
}) => {
  const safeCapacity = Math.max(0, Number(capacity) || 0);
  const safeJoined = Math.min(
    Math.max(0, Number(joined) || 0),
    safeCapacity || Number(joined) || 0,
  );
  const percentage =
    safeCapacity > 0
      ? Math.min(100, Math.round((safeJoined / safeCapacity) * 100))
      : 0;

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-950/45 p-3">
      <div className="flex items-center justify-between gap-3 text-xs font-bold">
        <span className="text-slate-400">{label}</span>
        <span className="text-white">
          {safeJoined.toLocaleString("en-IN")} /{" "}
          {safeCapacity.toLocaleString("en-IN")}
        </span>
      </div>
      <div
        aria-label={`${label}: ${percentage}%`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={percentage}
        className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800"
        role="progressbar"
      >
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#22d3ee,#fbbf24)] transition-[width] duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        <span>{percentage}% filled</span>
        {status ? <span>{String(status).replaceAll("_", " ")}</span> : null}
      </div>
    </div>
  );
};

JoinProgress.propTypes = {
  capacity: PropTypes.number.isRequired,
  joined: PropTypes.number.isRequired,
  label: PropTypes.string,
  status: PropTypes.string,
};

export default JoinProgress;
