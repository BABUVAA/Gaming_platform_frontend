import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FaClock,
  FaHeadset,
} from "react-icons/fa";
import { FiRefreshCw } from "react-icons/fi";
import { getGamePresentation } from "../config/gamePresentation.js";
import { buildTournamentOfferingPath } from "../routes/routeConstants";
import {
  fetchMorePlayerMatchActivity,
  fetchPlayerMatchActivity,
} from "../store/slices/matchActivitySlice.js";
import {
  selectMatchActivity,
  selectMatchActivityError,
  selectMatchActivityMoreStatus,
  selectMatchActivityPages,
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
    label: "Room filling",
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
  const activityPages = useSelector(selectMatchActivityPages);
  const moreStatus = useSelector(selectMatchActivityMoreStatus);
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
  const visibleMatches = activeTab === "live" ? liveMatches : completedMatches;

  const refresh = () => dispatch(fetchPlayerMatchActivity());
  const loadMore = () => dispatch(fetchMorePlayerMatchActivity({
    matchCursor: activityPages.matches?.nextCursor,
    queueCursor: activityPages.queues?.nextCursor,
  }));
  const hasMore = Boolean(
    activityPages.matches?.hasMore || activityPages.queues?.hasMore,
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
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-white">Matches</h1>
        <button
          aria-label="Refresh matches"
          className="grid h-9 w-9 place-items-center rounded-xl border border-slate-700 text-slate-300 transition hover:border-cyan-300/50 hover:text-cyan-200 disabled:opacity-50"
          disabled={isLoading}
          onClick={refresh}
          type="button"
        >
          <FiRefreshCw className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      {isLoading && activity.length === 0 ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="h-48 animate-pulse rounded-2xl bg-slate-900" />
          <div className="hidden h-48 animate-pulse rounded-2xl bg-slate-900 lg:block" />
        </div>
      ) : null}

      {activityStatus === "failed" ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-500/30 bg-rose-950/30 p-4 text-sm text-rose-200">
          <span>{activityError || "Unable to load your matches."}</span>
          <button
            className="shrink-0 font-black text-white"
            onClick={refresh}
            type="button"
          >
            Retry
          </button>
        </div>
      ) : null}

      {!(isLoading && activity.length === 0) ? (
        <section className="rounded-[22px] border border-slate-800 bg-slate-950 p-3 sm:p-4">
          <div
            aria-label="My matches"
            className="grid grid-cols-2 rounded-xl bg-slate-900 p-1"
            role="tablist"
          >
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
            {visibleMatches.map((item) => (
              <MatchActivityCard
                item={item}
                key={`${item.kind || "match"}-${item._id}`}
                now={now}
              />
            ))}
            {visibleMatches.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-800 px-4 py-8 text-center text-sm text-slate-500 lg:col-span-2">
                {activeTab === "live"
                  ? isStaffUtilityMode
                    ? "No active matches are visible."
                    : "No active matches yet."
                  : "No completed matches yet."}
              </p>
            ) : null}
          </div>
          {hasMore ? (
            <button
              className="mt-4 w-full rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-black text-slate-200 hover:border-cyan-300/40 hover:text-cyan-100 disabled:opacity-50"
              disabled={moreStatus === "loading"}
              onClick={loadMore}
              type="button"
            >
              {moreStatus === "loading" ? "Loading..." : "Load older matches"}
            </button>
          ) : null}
        </section>
      ) : null}
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
  const scheduledAt = item.scheduledFor ? new Date(item.scheduledFor).getTime() : null;
  const revealAt = item.lobbyRevealAt ? new Date(item.lobbyRevealAt).getTime() : null;
  const isScheduledPhase = ["scheduled", "lobby_ready"].includes(item.status);
  const countdown = isScheduledPhase && revealAt && now < revealAt
    ? `Lobby opens in ${formatCountdown(revealAt - now)}`
    : isScheduledPhase && scheduledAt && now < scheduledAt
      ? `Starts in ${formatCountdown(scheduledAt - now)}`
      : null;
  const presentation = getGamePresentation(item.game);
  const sourceLabel = isQueue
    ? "Quick Match"
    : item.source === "event"
      ? `Event${item.event?.stage ? ` / Round ${item.event.stage}` : ""}${item.event?.batch ? ` / Room ${item.event.batch}` : ""}`
      : "Quick Match";
  const scheduleLabel = item.scheduledFor
    ? new Date(item.scheduledFor).toLocaleString([], {
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        month: "short",
      })
    : "Schedule pending";
  const liveMessage = item.status === "live"
    ? "Match is live"
    : ["lobby_ready"].includes(item.status)
      ? "Room details available"
      : item.status === "result_pending"
        ? "Waiting for official result"
        : isScheduledPhase && scheduledAt && now >= scheduledAt
          ? "Start delayed · waiting for operator"
          : countdown;

  return (
    <article className="group relative min-h-48 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
      <img
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center opacity-20 transition duration-300 group-hover:scale-[1.02] group-hover:opacity-25"
        src={presentation.image}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.99)_0%,rgba(2,6,23,0.94)_58%,rgba(2,6,23,0.72)_100%)]" />
      <div className="relative p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-cyan-300">
              {sourceLabel}
            </p>
            <h3 className="mt-1 truncate text-lg font-black text-white">
              {item.title || "Tournament match"}
            </h3>
            <p className="mt-1 truncate text-xs capitalize text-slate-400">
              {[
                presentation.label,
                item.mode,
                item.map && item.map !== "none" ? item.map : null,
              ]
                .filter(Boolean)
                .join(" / ")}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${status.style}`}
          >
            {status.label}
          </span>
        </div>

      {isQueue ? (
        <div className="mt-4">
          <p className="text-sm font-black text-slate-200">Waiting for the room to fill</p>
          <Link
            className="mt-4 inline-flex rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-xs font-black text-cyan-100 hover:bg-cyan-300 hover:text-slate-950"
            to={buildTournamentOfferingPath(item.offeringId)}
          >
            View Quick Match
          </Link>
        </div>
        ) : (
        <>
          <div className="mt-4 grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
            <span className="inline-flex items-center gap-2">
              <FaClock className="text-sky-300" />
              {scheduleLabel}
            </span>
            <span className="inline-flex items-center gap-2">
              <FaHeadset className="text-sky-300" />
              {item.assignedOperator?.profile?.username ||
                "Assigning operator"}
            </span>
          </div>
          {liveMessage ? <p className="mt-3 text-sm font-black text-cyan-100">{liveMessage}</p> : null}
          <Link
            className="mt-4 inline-flex rounded-lg bg-cyan-300 px-3 py-2 text-xs font-black text-slate-950 hover:bg-cyan-200"
            to={`/dashboard/matches/${item._id}`}
          >
            Open match
          </Link>
        </>
        )}
      </div>
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
    map: PropTypes.string,
    status: PropTypes.string,
    source: PropTypes.string,
    event: PropTypes.shape({
      batch: PropTypes.number,
      stage: PropTypes.number,
      title: PropTypes.string,
    }),
    title: PropTypes.string,
  }).isRequired,
  now: PropTypes.number.isRequired,
};

export default Matches;
