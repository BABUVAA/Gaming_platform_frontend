import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  FiArrowLeft,
  FiClock,
  FiMapPin,
  FiShield,
  FiUsers,
  FiAward,
  FiInfo,
} from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import QuickMatchCard from "../components/ui/GameCard/QuickMatchCard";
import { getGamePresentation } from "../config/gamePresentation";
import { ROUTES } from "../routes/routeConstants";
import {
  selectPlayerQuickMatchDetail,
  selectPlayerQuickMatchDetailError,
  selectPlayerQuickMatchDetailStatus,
  selectPlayerQuickMatchLeaderboard,
  selectPlayerQuickMatchLeaderboardError,
  selectPlayerQuickMatchLeaderboardStatus,
} from "../store/selectors/quickMatchOfferingSelectors";
import { fetchPlayerQuickMatchOfferingById, fetchPlayerQuickMatchLeaderboard } from "../store/slices/quickMatchOfferingSlice";

const QuickMatchDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("overview");
  const offering = useSelector((state) =>
    selectPlayerQuickMatchDetail(state, id),
  );
  const status = useSelector((state) =>
    selectPlayerQuickMatchDetailStatus(state, id),
  );
  const error = useSelector((state) =>
    selectPlayerQuickMatchDetailError(state, id),
  );
  const leaderboard = useSelector((state) => selectPlayerQuickMatchLeaderboard(state, id));
  const leaderboardStatus = useSelector((state) => selectPlayerQuickMatchLeaderboardStatus(state, id));
  const leaderboardError = useSelector((state) => selectPlayerQuickMatchLeaderboardError(state, id));

  useEffect(() => {
    const request = dispatch(fetchPlayerQuickMatchOfferingById(id));
    const refreshTimer = window.setInterval(
      () => dispatch(fetchPlayerQuickMatchOfferingById(id)),
      5000,
    );
    return () => {
      request.abort();
      window.clearInterval(refreshTimer);
    };
  }, [dispatch, id]);

  useEffect(() => {
    if (!offering?.membership?.isJoined) return undefined;
    const request = dispatch(fetchPlayerQuickMatchLeaderboard(id));
    const timer = window.setInterval(() => dispatch(fetchPlayerQuickMatchLeaderboard(id)), 5000);
    return () => { request.abort(); window.clearInterval(timer); };
  }, [dispatch, id, offering?.membership?.isJoined]);

  if (!offering && ["idle", "loading"].includes(status)) {
    return (
      <div className="animate-pulse space-y-5">
        <div className="h-10 w-40 rounded-xl bg-slate-800" />
        <div className="h-80 rounded-[32px] bg-slate-800" />
      </div>
    );
  }

  if (!offering) {
    return (
      <section className="mx-auto max-w-xl rounded-[28px] border border-rose-400/20 bg-rose-500/10 p-8 text-center">
        <h1 className="text-2xl font-black text-white">
          Tournament unavailable
        </h1>
        <p className="mt-3 text-sm leading-6 text-rose-100">
          {error ||
            "This tournament is no longer active or could not be found."}
        </p>
        <Link
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950"
          to={ROUTES.TOURNAMENT}
        >
          <FiArrowLeft /> Browse tournaments
        </Link>
      </section>
    );
  }

  const presentation = getGamePresentation(offering.gameKey);

  return (
    <div className="space-y-6 pb-8">
      <Link
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white"
        to={ROUTES.TOURNAMENT}
      >
        <FiArrowLeft /> Back to tournaments
      </Link>

      <section className="relative overflow-hidden rounded-[34px] border border-slate-700 bg-slate-950 shadow-[0_24px_70px_rgba(2,8,23,0.45)]">
        <img
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-20"
          src={presentation.image}
        />
        <div className="relative grid gap-8 bg-gradient-to-r from-slate-950 via-slate-950/95 to-slate-950/65 p-6 md:p-9 lg:grid-cols-[1fr_22rem]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
              {offering.game?.name || presentation.label}
            </p>
            <h1 className="mt-3 text-3xl font-black text-white md:text-5xl">
              {offering.title}
            </h1>
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-200">
              <Fact icon={FiUsers} text={`${offering.maxParticipants} seats`} />
              <Fact
                icon={FiShield}
                text={
                  offering.teamSize === 1
                    ? "Solo"
                    : `${offering.teamSize} players per team`
                }
              />
              <Fact
                icon={FiMapPin}
                text={[offering.mode, offering.map, offering.region]
                  .filter(Boolean)
                  .join(" / ")}
              />
              <Fact
                icon={FiClock}
                text={
                  offering.execution?.scheduledFor
                    ? `Scheduled ${formatSchedule(offering.execution.scheduledFor)}`
                    : offering.schedulePolicy === "on_demand"
                    ? "Starts when full"
                    : "Published schedule"
                }
              />
            </div>
          </div>
          <QuickMatchCard offering={offering} showDetails={false} />
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-slate-700 bg-slate-900/70">
        <div className="flex gap-1 border-b border-slate-800 p-2">
          <Tab active={activeTab === "overview"} icon={FiInfo} label="Overview" onClick={() => setActiveTab("overview")} />
          {offering.membership?.isJoined ? (
            <Tab active={activeTab === "leaderboard"} icon={FiAward} label="Leaderboard" onClick={() => setActiveTab("leaderboard")} />
          ) : null}
        </div>

        {activeTab === "overview" ? (
          <div className="grid gap-5 p-5 md:grid-cols-3 md:p-7">
            <OverviewBlock title="Tournament">
              <p>{offering.mode} / {offering.map || "No map"}</p>
              <p>{offering.teamSize === 1 ? "Solo entry" : `${offering.teamSize} players per team`}</p>
              <p>{offering.region}</p>
            </OverviewBlock>
            <OverviewBlock title="Rules">
              <p>Room locks when {offering.maxParticipants} seats fill.</p>
              <p>Game Manager schedules the Match after operator assignment.</p>
              <p>Room ID and password unlock 10 minutes before start.</p>
            </OverviewBlock>
            <OverviewBlock title="Rewards">
              {offering.rewardPolicy === "placement" ? offering.placementRewards.map((row) => (
                <p key={row.place}>#{row.place} / {formatMoney(row.amountMinor, offering.currency)}</p>
              )) : <p>Prize pool / {formatMoney(offering.prizePoolMinor, offering.currency)}</p>}
            </OverviewBlock>
          </div>
        ) : (
          <div className="p-5 md:p-7">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div><h2 className="text-lg font-black text-white">Joined players</h2><p className="text-xs text-slate-500">Seat order, not final rank</p></div>
              <span className="text-sm font-bold text-cyan-200">{leaderboard?.joinedCount || 0}/{leaderboard?.capacity || offering.maxParticipants}</span>
            </div>
            {leaderboardStatus === "loading" && !leaderboard ? <p className="text-sm text-slate-400">Loading players...</p> : null}
            {leaderboardError ? <p className="text-sm text-rose-200">{leaderboardError}</p> : null}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {(leaderboard?.players || []).map((player) => (
                <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2.5" key={`${player.seat}-${player.username}`}>
                  <span className="w-8 text-center text-xs font-black text-cyan-300">#{player.seat}</span>
                  <span className="truncate text-sm font-bold text-slate-200">{player.username}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

const formatMoney = (amountMinor, currency) => new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format((amountMinor || 0) / 100);
const formatSchedule = (value) => new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
}).format(new Date(value));

const Tab = ({ active, icon: Icon, label, onClick }) => (
  <button className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black ${active ? "bg-cyan-300 text-slate-950" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`} onClick={onClick} type="button"><Icon />{label}</button>
);

Tab.propTypes = { active: PropTypes.bool.isRequired, icon: PropTypes.elementType.isRequired, label: PropTypes.string.isRequired, onClick: PropTypes.func.isRequired };

const OverviewBlock = ({ children, title }) => <div><h2 className="text-sm font-black uppercase tracking-[0.16em] text-cyan-300">{title}</h2><div className="mt-3 space-y-2 text-sm text-slate-300">{children}</div></div>;
OverviewBlock.propTypes = { children: PropTypes.node.isRequired, title: PropTypes.string.isRequired };

const Fact = ({ icon: Icon, text }) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
    <Icon className="text-cyan-300" /> {text}
  </span>
);

Fact.propTypes = {
  icon: PropTypes.elementType.isRequired,
  text: PropTypes.string.isRequired,
};

export default QuickMatchDetails;
