import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FaClock,
  FaHeadset,
} from "react-icons/fa";
import { buildTournamentOfferingPath } from "../routes/routeConstants";
import { fetchPlayerMatchActivity } from "../store/slices/matchActivitySlice.js";
import {
  selectMatchActivity,
  selectMatchActivityError,
  selectMatchActivityStatus,
} from "../store/selectors/matchActivitySelectors.js";
import useSocket from "../context/useSocket";
import { selectIsStaffUtilityMode } from "../store/selectors/playerSelectors";

const STATUS_PRESENTATION = Object.freeze({
  awaiting_operator: {
    label: "Assigning operator",
    style: "bg-amber-100 text-amber-800",
  },
  cancelled: {
    label: "Cancelled",
    style: "bg-rose-100 text-rose-800",
  },
  check_in: {
    label: "Schedule pending",
    style: "bg-amber-100 text-amber-800",
  },
  disputed: {
    label: "Under review",
    style: "bg-rose-100 text-rose-800",
  },
  live: {
    label: "Live",
    style: "bg-emerald-100 text-emerald-800",
  },
  lobby_ready: {
    label: "Room ready",
    style: "bg-sky-100 text-sky-800",
  },
  operator_assigned: {
    label: "Operator assigned",
    style: "bg-cyan-100 text-cyan-800",
  },
  result_pending: {
    label: "Result review",
    style: "bg-orange-100 text-orange-800",
  },
  scheduled: {
    label: "Scheduled",
    style: "bg-slate-700 text-slate-200",
  },
  settled: {
    label: "Completed",
    style: "bg-violet-100 text-violet-800",
  },
  verified: {
    label: "Result verified",
    style: "bg-cyan-100 text-cyan-800",
  },
  waiting_for_players: {
    label: "Waiting for players",
    style: "bg-slate-700 text-slate-200",
  },
});

const COMPLETED_STATUSES = new Set(["cancelled", "settled", "verified"]);

const Matches = () => {
  const dispatch = useDispatch();
  const { competitionRevision } = useSocket();
  const activity = useSelector(selectMatchActivity);
  const activityError = useSelector(selectMatchActivityError);
  const activityStatus = useSelector(selectMatchActivityStatus);
  const isLoading = activityStatus === "loading";
  const isStaffUtilityMode = useSelector(selectIsStaffUtilityMode);
  const [activeTab, setActiveTab] = useState("live");
  const [now, setNow] = useState(() => Date.now());
  const liveMatches = useMemo(
    () => activity.filter((item) => !COMPLETED_STATUSES.has(item.status)),
    [activity],
  );
  const completedMatches = useMemo(
    () => activity.filter((item) => COMPLETED_STATUSES.has(item.status)),
    [activity],
  );

  useEffect(() => {
    const request = dispatch(fetchPlayerMatchActivity());
    return () => request.abort();
  }, [competitionRevision, dispatch]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-white">Matches</h1>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-400">
          Loading matches...
        </div>
      ) : null}

      {activityStatus === "failed" ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-950/30 p-5 text-sm text-rose-200">
          {activityError || "Unable to load your matches."}
        </div>
      ) : null}

      <section className="rounded-[22px] border border-slate-800 bg-slate-950 p-4 sm:p-5">
        <div className="grid grid-cols-2 rounded-xl bg-slate-900 p-1" role="tablist" aria-label="My matches">
          {[
            ["live", "Live Matches", liveMatches.length],
            ["completed", "Completed", completedMatches.length],
          ].map(([value, label, count]) => (
            <button
              aria-selected={activeTab === value}
              className={`rounded-lg px-3 py-2 text-sm font-black ${activeTab === value ? "bg-cyan-300 text-slate-950" : "text-slate-400 hover:text-white"}`}
              key={value}
              onClick={() => setActiveTab(value)}
              role="tab"
              type="button"
            >
              {label} · {count}
            </button>
          ))}
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {(activeTab === "live" ? liveMatches : completedMatches).map((item) => (
            <MatchActivityCard item={item} now={now} key={`${item.kind || "match"}-${item._id}`} />
          ))}
          {(activeTab === "live" ? liveMatches : completedMatches).length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-800 p-4 text-sm text-slate-500">
              {activeTab === "live"
                ? isStaffUtilityMode
                  ? "No active matches are visible."
                  : "No active matches yet."
                : "No completed matches yet."}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
};

const MatchActivityCard = ({ item, now }) => {
  const isQueue = item.kind === "queue";
  const status =
    STATUS_PRESENTATION[item.status] ||
    {
      label: item.status?.replaceAll("_", " ") || "Match",
      style: "bg-slate-700 text-slate-200",
    };
  const fillPercentage =
    isQueue && item.maxPlayers > 0
      ? Math.min(100, (item.joinedPlayers / item.maxPlayers) * 100)
      : 0;
  const scheduledAt = item.scheduledFor ? new Date(item.scheduledFor).getTime() : null;
  const revealAt = item.lobbyRevealAt ? new Date(item.lobbyRevealAt).getTime() : null;
  const countdown = item.status === "scheduled" && revealAt && now < revealAt
    ? `Lobby opens in ${formatCountdown(revealAt - now)}`
    : item.status === "scheduled" && scheduledAt && now < scheduledAt
      ? `Starts in ${formatCountdown(scheduledAt - now)}`
      : null;

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-300">
            {item.game || "Game"} - {item.mode || "Format"}
          </p>
          <h3 className="mt-1 text-lg font-bold text-white">
            {item.title || "Tournament match"}
          </h3>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${status.style}`}
        >
          {status.label}
        </span>
      </div>

      {isQueue ? (
        <div className="mt-5">
          <div className="flex justify-between text-xs font-bold text-slate-400">
            <span>{item.joinedPlayers} players joined</span>
            <span>{item.maxPlayers} needed</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#22d3ee,#fbbf24)]"
              style={{ width: `${fillPercentage}%` }}
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Link
              className="inline-flex items-center gap-2 text-sm font-bold text-sky-200"
              to={buildTournamentOfferingPath(item.offeringId)}
            >
              View tournament
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-400">
            <span className="inline-flex items-center gap-2">
              <FaClock className="text-sky-300" />
              {item.scheduledFor
                ? new Date(item.scheduledFor).toLocaleString()
                : "Schedule pending"}
            </span>
            <span className="inline-flex items-center gap-2">
              <FaHeadset className="text-sky-300" />
              {item.assignedOperator?.profile?.username ||
                "Assigning operator"}
            </span>
          </div>
          {countdown ? <p className="mt-3 text-sm font-black text-cyan-200">{countdown}</p> : null}
          <Link
            className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-sky-200"
            to={`/dashboard/matches/${item._id}`}
          >
            Open match
          </Link>
        </>
      )}
    </article>
  );
};

const formatCountdown = (milliseconds) => {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return [hours, minutes, remainder].map((value) => String(value).padStart(2, "0")).join(":");
};

MatchActivityCard.propTypes = {
  item: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    assignedOperator: PropTypes.shape({
      profile: PropTypes.shape({
        username: PropTypes.string,
      }),
    }),
    createdAt: PropTypes.string,
    game: PropTypes.string,
    joinedPlayers: PropTypes.number,
    kind: PropTypes.string,
    maxPlayers: PropTypes.number,
    mode: PropTypes.string,
    offeringId: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    scheduledFor: PropTypes.string,
    lobbyRevealAt: PropTypes.string,
    status: PropTypes.string,
    title: PropTypes.string,
  }).isRequired,
  now: PropTypes.number.isRequired,
};

export default Matches;
