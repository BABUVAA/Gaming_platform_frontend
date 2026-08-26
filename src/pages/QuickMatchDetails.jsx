import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import CompetitionEntryDialog from "../components/competition/CompetitionEntryDialog.jsx";
import JoinProgress from "../components/competition/JoinProgress.jsx";
import InviteModal from "../components/feature/InviteModal.jsx";
import { getStoredErrorMessage } from "../api/apiError.js";
import { getGamePresentation } from "../config/gamePresentation.js";
import { ROUTES } from "../routes/routeConstants.js";
import { useMatchmakingStore } from "../store/hooks/useStore.js";
import { selectIsStaffUtilityMode } from "../store/selectors/playerSelectors.js";
import {
  selectPlayerQuickMatchDetail,
  selectPlayerQuickMatchDetailError,
  selectPlayerQuickMatchDetailStatus,
  selectPlayerQuickMatchLeaderboard,
  selectPlayerQuickMatchLeaderboardError,
  selectPlayerQuickMatchLeaderboardStatus,
} from "../store/selectors/quickMatchOfferingSelectors.js";
import {
  fetchPlayerQuickMatchLeaderboard,
  fetchPlayerQuickMatchOfferingById,
} from "../store/slices/quickMatchOfferingSlice.js";

const amount = (minor = 0) =>
  (minor / 100).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });

const QuickMatchDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("rewards");
  const [confirmingEntry, setConfirmingEntry] = useState(false);
  const [teamPickerOpen, setTeamPickerOpen] = useState(false);
  const [joinError, setJoinError] = useState("");
  const offering = useSelector((state) => selectPlayerQuickMatchDetail(state, id));
  const status = useSelector((state) => selectPlayerQuickMatchDetailStatus(state, id));
  const error = useSelector((state) => selectPlayerQuickMatchDetailError(state, id));
  const leaderboard = useSelector((state) => selectPlayerQuickMatchLeaderboard(state, id));
  const leaderboardStatus = useSelector((state) => selectPlayerQuickMatchLeaderboardStatus(state, id));
  const leaderboardError = useSelector((state) => selectPlayerQuickMatchLeaderboardError(state, id));
  const staffReadOnly = useSelector(selectIsStaffUtilityMode);
  const { joinQuickMatch, joiningOfferingId, joinStatus } = useMatchmakingStore();
  const isJoining = joinStatus === "loading" && joiningOfferingId === id;
  const latestRoomId = offering?.latestRoom?.id;

  useEffect(() => {
    const request = dispatch(fetchPlayerQuickMatchOfferingById(id));
    const timer = window.setInterval(
      () => dispatch(fetchPlayerQuickMatchOfferingById(id)),
      5000,
    );
    return () => {
      request.abort();
      window.clearInterval(timer);
    };
  }, [dispatch, id]);

  useEffect(() => {
    if (!latestRoomId) return undefined;
    const request = dispatch(fetchPlayerQuickMatchLeaderboard(id));
    const timer = window.setInterval(
      () => dispatch(fetchPlayerQuickMatchLeaderboard(id)),
      5000,
    );
    return () => {
      request.abort();
      window.clearInterval(timer);
    };
  }, [dispatch, id, latestRoomId]);

  if (!offering && ["idle", "loading"].includes(status)) {
    return <div className="h-72 animate-pulse rounded-3xl bg-slate-800" />;
  }

  if (!offering) {
    return (
      <section className="rounded-2xl border border-rose-400/20 p-6 text-rose-100">
        <p>{error || "This Quick Match is unavailable."}</p>
        <Link className="mt-4 inline-block font-bold text-cyan-200" to={ROUTES.TOURNAMENT}>
          Back to Compete
        </Link>
      </section>
    );
  }

  const presentation = getGamePresentation(offering.gameKey);
  const joined = offering.membership?.isJoined === true;
  const canJoin = !staffReadOnly && offering.eligibility?.joinAvailable === true;
  const joinLabel = offering.latestRoom?.status === "full" ? "Join Next Room" : "Join Now";

  const beginJoin = () => {
    setJoinError("");
    setConfirmingEntry(false);
    if (offering.teamSize > 1) {
      setTeamPickerOpen(true);
      return;
    }
    joinQuickMatch({ offeringId: offering._id })
      .unwrap()
      .then(() => {
        dispatch(fetchPlayerQuickMatchOfferingById(id));
        dispatch(fetchPlayerQuickMatchLeaderboard(id));
      })
      .catch((joinFailure) => setJoinError(getStoredErrorMessage(joinFailure)));
  };

  const rewards = offering.rewardPolicy === "placement"
    ? offering.placementRewards || []
    : [{ place: "Winner pool", amountMinor: offering.prizePoolMinor || 0 }];

  return (
    <main className="space-y-4 pb-8">
      <Link className="inline-flex text-xs font-bold text-slate-400 hover:text-cyan-200 sm:text-sm" to={ROUTES.TOURNAMENT}>
        Back to Compete
      </Link>

      <section className="relative overflow-hidden rounded-[24px] border border-cyan-300/20 bg-slate-950 shadow-[0_18px_44px_rgba(2,8,23,0.3)]">
        <img alt="" className="absolute inset-0 h-full w-full object-cover object-[68%_center] opacity-40" src={presentation.image} />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.54),rgba(2,6,23,0.94)_42%,rgba(2,6,23,0.99)_100%)]" />
        <div className="relative p-4 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
            {offering.game?.name || presentation.label}
          </p>
          <h1 className="mt-2 text-2xl font-black leading-tight text-white sm:text-3xl">
            {offering.title}
          </h1>
          <p className="mt-2 text-sm capitalize text-slate-400">
            {[offering.mode, offering.map, offering.region].filter(Boolean).join(" / ")}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
            <Fact label="Entry" value={offering.entryFeeMinor ? `₹${amount(offering.entryFeeMinor)}` : "Free"} />
            <Fact label="Reward" value={`₹${amount(offering.prizePoolMinor)}`} />
            <Fact label="Seats" value={String(offering.maxParticipants)} />
            <Fact label="Format" value={offering.teamSize === 1 ? "Solo" : `${offering.teamSize}-player team`} />
          </div>

          <div className="mt-4">
            <JoinProgress
              capacity={offering.joinProgress?.capacity || offering.maxParticipants}
              joined={offering.joinProgress?.joinedParticipants || 0}
              status="Current Room"
            />
          </div>

          {joined ? (
            <button className="mt-4 w-full cursor-default rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-2.5 text-sm font-black text-emerald-100 sm:w-auto" disabled type="button">
              Joined
            </button>
          ) : canJoin ? (
            <button className="mt-4 w-full rounded-xl bg-cyan-300 px-5 py-2.5 text-sm font-black text-slate-950 disabled:opacity-50 sm:w-auto" disabled={isJoining} onClick={() => setConfirmingEntry(true)} type="button">
              {isJoining ? "Joining..." : joinLabel}
            </button>
          ) : null}
          {joinError ? <p className="mt-3 text-xs font-bold text-rose-200">{joinError}</p> : null}
        </div>
      </section>

      <section className="rounded-[22px] border border-slate-800 bg-slate-950 p-4 sm:p-5">
        <div aria-label="Quick Match details" className="grid grid-cols-2 rounded-xl bg-slate-900 p-1" role="tablist">
          {["rewards", "leaderboard"].map((tab) => (
            <button
              aria-selected={activeTab === tab}
              className={`rounded-lg px-3 py-2 text-sm font-black capitalize ${activeTab === tab ? "bg-cyan-300 text-slate-950" : "text-slate-400 hover:text-white"}`}
              key={tab}
              onClick={() => setActiveTab(tab)}
              role="tab"
              type="button"
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "rewards" ? (
          <SimpleTable headers={["Place", "Reward (₹)"]}>
            {rewards.map((reward) => (
              <TableRow key={reward.place} left={typeof reward.place === "number" ? `#${reward.place}` : reward.place} right={amount(reward.amountMinor)} />
            ))}
          </SimpleTable>
        ) : latestRoomId ? (
          <>
            <SimpleTable headers={["Rank", "Player"]}>
              {(leaderboard?.players || []).map((player) => (
                <TableRow key={`${player.seat}-${player.username}`} left="-" right={player.username} />
              ))}
            </SimpleTable>
            {leaderboardStatus === "loading" && !leaderboard ? <p className="mt-3 text-sm text-slate-500">Loading players...</p> : null}
            {leaderboardError ? <p className="mt-3 text-sm text-rose-200">{leaderboardError}</p> : null}
          </>
        ) : (
          <p className="mt-3 text-sm text-slate-500">Join a Room to view its players.</p>
        )}
      </section>

      <CompetitionEntryDialog
        actionLabel={offering.teamSize > 1 ? "Choose team" : "Proceed & join"}
        currency={offering.currency}
        entryFeeMinor={offering.entryFeeMinor}
        isOpen={confirmingEntry}
        onClose={() => setConfirmingEntry(false)}
        onProceed={beginJoin}
        testMoney={offering.testMoney}
        teamSize={offering.teamSize}
        title={offering.title}
        type="Quick Match"
      />
      <InviteModal
        currency={offering.currency}
        entryFeeMinor={offering.entryFeeMinor}
        game={offering.gameKey}
        isOpen={teamPickerOpen}
        mode={offering.mode}
        onClose={() => setTeamPickerOpen(false)}
        onJoined={() => {
          dispatch(fetchPlayerQuickMatchOfferingById(id));
          dispatch(fetchPlayerQuickMatchLeaderboard(id));
        }}
        offeringId={offering._id}
        teamSize={offering.teamSize}
      />
    </main>
  );
};

const Fact = ({ label, value }) => (
  <div className="min-w-0 rounded-xl border border-white/10 bg-slate-950/65 p-3 backdrop-blur">
    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
    <p className="mt-1 truncate text-sm font-black capitalize text-white sm:text-base">{value}</p>
  </div>
);

const SimpleTable = ({ children, headers }) => (
  <div className="mt-3 overflow-hidden rounded-xl border border-slate-800">
    <div className="grid grid-cols-[1fr_auto] bg-slate-900/80 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-slate-500">
      <span>{headers[0]}</span><span>{headers[1]}</span>
    </div>
    {children}
  </div>
);

const TableRow = ({ left, right }) => (
  <div className="grid grid-cols-[1fr_auto] border-t border-slate-800 px-3 py-2.5 text-sm">
    <span className="font-black text-cyan-200">{left}</span>
    <span className="max-w-56 truncate font-bold text-slate-200">{right}</span>
  </div>
);

Fact.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.string.isRequired };
SimpleTable.propTypes = { children: PropTypes.node.isRequired, headers: PropTypes.arrayOf(PropTypes.string).isRequired };
TableRow.propTypes = { left: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired, right: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired };

export default QuickMatchDetails;
