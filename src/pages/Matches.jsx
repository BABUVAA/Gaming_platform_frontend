import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  FaArrowRight,
  FaClock,
  FaHeadset,
  FaShieldAlt,
  FaUsers,
} from "react-icons/fa";
import api from "../api/axios-api";
import { getApiErrorMessage } from "../api/apiError";
import {
  buildTournamentOfferingPath,
  ROUTES,
} from "../routes/routeConstants";
import { showToast, types } from "../store/slices/toastSlice";
import useSocket from "../context/useSocket";

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
    label: "Check-in open",
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

const getActivityTime = (activity) =>
  new Date(activity.createdAt || activity.scheduledFor || 0).getTime();

const Matches = () => {
  const dispatch = useDispatch();
  const { competitionRevision } = useSocket();
  const [activity, setActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadActivity = async () => {
      setIsLoading(true);
      const [queuesRequest, matchesRequest] = await Promise.allSettled([
        api.get("/api/matches/queues"),
        api.get("/api/matches"),
      ]);
      if (!isActive) return;

      const queues =
        queuesRequest.status === "fulfilled"
          ? queuesRequest.value.data?.data || []
          : [];
      const matches =
        matchesRequest.status === "fulfilled"
          ? matchesRequest.value.data?.data || []
          : [];

      // Queue and match responses share one presentation contract here. The
      // backend collections remain separate and can evolve independently.
      setActivity(
        [...queues, ...matches].sort(
          (first, second) =>
            getActivityTime(second) - getActivityTime(first),
        ),
      );

      const failedRequest =
        queuesRequest.status === "rejected"
          ? queuesRequest.reason
          : matchesRequest.status === "rejected"
            ? matchesRequest.reason
            : null;
      if (failedRequest) {
        dispatch(
          showToast({
            message: getApiErrorMessage(
              failedRequest,
              "Some match activity could not be loaded.",
            ),
            type: types.DANGER,
            position: "bottom-right",
          }),
        );
      }

      setIsLoading(false);
    };

    loadActivity();
    return () => {
      isActive = false;
    };
  }, [competitionRevision, dispatch]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-sky-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_30%),linear-gradient(135deg,_#0f172a,_#020617)] p-6 shadow-[0_24px_60px_rgba(2,8,23,0.5)]">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-300">
          My matches
        </p>
        <h1 className="mt-3 text-4xl font-black text-white md:text-5xl">
          Everything you joined, in one place.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
          Follow player availability and operator assignment without switching
          between tournament, event, and room pages.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5 shadow-[0_18px_50px_rgba(2,8,23,0.45)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                Current activity
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                Match timeline
              </h2>
            </div>
            <Link
              className="text-sm font-bold text-sky-200"
              to={ROUTES.TOURNAMENT}
            >
              Find tournaments
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {activity.map((item) => (
              <MatchActivityCard
                item={item}
                key={`${item.kind || "match"}-${item._id}`}
              />
            ))}

            {!isLoading && activity.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/60 p-6 text-center">
                <p className="font-bold text-white">No matches yet</p>
                <p className="mt-2 text-sm text-slate-400">
                  Join a tournament and your player queue will appear here.
                </p>
              </div>
            ) : null}

            {isLoading ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-400">
                Loading your matches...
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-5">
          <InfoPanel
            icon={<FaUsers />}
            title="Waiting for players"
            text="Your place is confirmed while matchmaking fills the remaining player slots."
          />
          <InfoPanel
            icon={<FaHeadset />}
            title="Assigning operator"
            text="When the room is full, an operator is assigned before any match action begins."
          />
          <InfoPanel
            icon={<FaShieldAlt />}
            title="Nothing starts early"
            text="Check-in and room access remain unavailable until the operator assignment stage is complete."
          />
        </div>
      </section>
    </div>
  );
};

const MatchActivityCard = ({ item }) => {
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

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
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
              <FaArrowRight />
            </Link>
            <span className="text-xs text-slate-500">
              Your place is confirmed while this room fills.
            </span>
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
          <Link
            className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-sky-200"
            to={`/dashboard/matches/${item._id}`}
          >
            Open match
            <FaArrowRight />
          </Link>
        </>
      )}
    </article>
  );
};

const InfoPanel = ({ icon, text, title }) => (
  <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5 shadow-[0_18px_50px_rgba(2,8,23,0.35)]">
    <div className="text-xl text-sky-300">{icon}</div>
    <h2 className="mt-3 text-xl font-black text-white">{title}</h2>
    <p className="mt-3 text-sm leading-7 text-slate-300">{text}</p>
  </div>
);

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
    status: PropTypes.string,
    title: PropTypes.string,
  }).isRequired,
};

InfoPanel.propTypes = {
  icon: PropTypes.node.isRequired,
  text: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
};

export default Matches;
