import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { getStoredErrorMessage } from "../../../api/apiError";
import { useMatchmakingStore } from "../../../store/hooks/useStore";
import InviteModal from "../../feature/InviteModal";
import { selectIsStaffUtilityMode } from "../../../store/selectors/playerSelectors";
import { STAFF_UTILITY_MESSAGE } from "../../../utils/staffUtilityMode";
import { buildTournamentOfferingPath } from "../../../routes/routeConstants";
import CompetitionEntryDialog from "../../competition/CompetitionEntryDialog.jsx";
import JoinProgress from "../../competition/JoinProgress.jsx";

const reasonLabels = {
  game_account_verification_required:
    "Verify this game account to become eligible.",
  payment_holds_not_available:
    "Paid entry is not available until wallet holds are enabled.",
  paid_entry_unavailable:
    "Paid entry remains unavailable while payment release checks are incomplete.",
  staff_read_only:
    "Staff accounts can view this offering but cannot join from the player dashboard.",
  queue_activation_pending: "Queue entry is being activated for this format.",
  already_joined: "You already joined this tournament room.",
};

const formatMinorAmount = (amount, currency) => {
  if (amount === 0) return "Free";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(amount / 100);
  } catch {
    return `${amount} ${currency} minor`;
  }
};

const getProgressStatus = (offering) => {
  const status = offering.execution?.status;
  if (status === "awaiting_operator") return "Waiting for operator";
  if (status === "operator_assigned") return "Waiting for schedule";
  if (status === "scheduled") return "Scheduled";
  if (status === "live") return "Live";
  if (["result_pending", "disputed"].includes(status)) return "Results pending";
  if (["verified", "settled"].includes(status)) return "Completed";
  return offering.joinProgress?.isFull
    ? "Match generating"
    : "Accepting players";
};

const QuickMatchCard = ({ offering, showDetails = true }) => {
  const [errorMessage, setErrorMessage] = useState("");
  const [isTeamPickerOpen, setIsTeamPickerOpen] = useState(false);
  const [isEntryConfirmationOpen, setIsEntryConfirmationOpen] = useState(false);
  const [joined, setJoined] = useState(false);
  const isStaffUtilityMode = useSelector(selectIsStaffUtilityMode);
  const { joinQuickMatch, joiningOfferingId, joinStatus } =
    useMatchmakingStore();
  const reasons = offering.eligibility?.reasons || [];
  const gameName = offering.game?.name || offering.gameKey;
  const isJoining =
    joinStatus === "loading" && joiningOfferingId === offering._id;
  const hasJoined = joined || offering.membership?.isJoined === true;

  useEffect(() => {
    setJoined(offering.membership?.isJoined === true);
  }, [offering.membership?.isJoined]);

  const confirmJoin = async () => {
    if (isStaffUtilityMode) return;
    setIsEntryConfirmationOpen(false);
    setErrorMessage("");
    if (offering.teamSize > 1) {
      setIsTeamPickerOpen(true);
      return;
    }

    try {
      const result = await joinQuickMatch({
        offeringId: offering._id,
      }).unwrap();
      setJoined(result.roomStatus !== "full");
    } catch (error) {
      setErrorMessage(getStoredErrorMessage(error));
    }
  };

  return (
    <>
      <article className="rounded-3xl border border-slate-800 bg-[linear-gradient(180deg,_rgba(15,23,42,0.9),_rgba(2,6,23,0.98))] p-5 shadow-[0_18px_50px_rgba(2,8,23,0.45)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300/80">
              {gameName}
            </p>
            <h2 className="mt-2 text-lg font-black text-white">
              {offering.title}
            </h2>
          </div>
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Active
          </span>
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <Detail
            label="Entry"
            value={formatMinorAmount(offering.entryFeeMinor, offering.currency)}
          />
          <Detail
            label="Prize"
            value={formatMinorAmount(
              offering.prizePoolMinor,
              offering.currency,
            )}
          />
          {offering.rewardPolicy === "placement" && offering.placementRewards?.length ? (
            <div className="col-span-3 rounded-lg bg-cyan-300/5 px-2 py-2 text-xs font-bold text-cyan-200">
              <dt className="sr-only">Place rewards</dt>
              <dd>
                {offering.placementRewards.slice(0, 3).map((row) => `#${row.place} ${formatMinorAmount(row.amountMinor, offering.currency)}`).join(" / ")}
                {offering.placementRewards.length > 3 ? ` / +${offering.placementRewards.length - 3} places` : ""}
              </dd>
            </div>
          ) : null}
          <Detail label="Seats" value={offering.maxParticipants} />
        </dl>

        <div className="mt-4">
          <JoinProgress
            capacity={
              offering.joinProgress?.capacity || offering.maxParticipants
            }
            joined={offering.joinProgress?.joinedParticipants || 0}
            status={getProgressStatus(offering)}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-300">
          {offering.testMoney ? (
            <span className="rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1.5 text-amber-100">
              PhonePe sandbox / test money
            </span>
          ) : null}
          {[offering.mode, offering.map, offering.region]
            .filter(Boolean)
            .map((fact, index) => (
              <span
                className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5"
                key={`${fact}-${index}`}
              >
                {fact}
              </span>
            ))}
          {offering.teamSize > 1 ? (
            <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5">
              Players per team: {offering.teamSize}
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {offering.schedulePolicy === "on_demand"
            ? "Starts when every seat is filled."
            : "Starts at the published schedule."}
        </p>

        <div className="mt-5 border-t border-slate-800 pt-4">
          {isStaffUtilityMode ? (
            <div className="space-y-2">
              <p className="text-xs leading-5 text-amber-100">
                {STAFF_UTILITY_MESSAGE}
              </p>
              <Link
                className="inline-flex text-sm font-bold text-cyan-200"
                to="/staff"
              >
                Open Staff Workspace
              </Link>
            </div>
          ) : hasJoined ? (
            <span className="inline-flex rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-2 text-sm font-black text-emerald-100">
              Joined
            </span>
          ) : offering.eligibility?.joinAvailable ? (
            joined ? (
              <span className="inline-flex rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-2 text-sm font-black text-emerald-100">
                Joined
              </span>
            ) : (
              <button
                className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 disabled:cursor-wait disabled:opacity-60"
                disabled={joinStatus === "loading"}
                onClick={() => setIsEntryConfirmationOpen(true)}
                type="button"
              >
                {isJoining ? "Joining..." : "Join Now"}
              </button>
            )
          ) : (
            <div className="space-y-2">
              {(reasons.length ? reasons : ["queue_activation_pending"]).map(
                (reason) => (
                  <p className="text-xs leading-5 text-amber-100" key={reason}>
                    {reasonLabels[reason] || "This queue is not available yet."}
                  </p>
                ),
              )}
              {reasons.includes("game_account_verification_required") && (
                <Link
                  className="inline-flex text-sm font-bold text-cyan-200"
                  to="/dashboard/game-accounts"
                >
                  Open game accounts
                </Link>
              )}
            </div>
          )}
          {errorMessage && (
            <p className="mt-3 text-xs leading-5 text-rose-200">
              {errorMessage}
            </p>
          )}
          {showDetails ? (
            <Link
              className="mt-3 inline-flex text-sm font-bold text-cyan-200 hover:text-cyan-100"
              to={buildTournamentOfferingPath(offering._id)}
            >
              View details
            </Link>
          ) : null}
        </div>
      </article>

      {!isStaffUtilityMode ? (
        <CompetitionEntryDialog
          actionLabel={offering.teamSize > 1 ? "Choose team" : "Proceed & join"}
          currency={offering.currency}
          entryFeeMinor={offering.entryFeeMinor}
          isOpen={isEntryConfirmationOpen}
          onClose={() => setIsEntryConfirmationOpen(false)}
          onProceed={confirmJoin}
          testMoney={offering.testMoney}
          teamSize={offering.teamSize}
          title={offering.title}
        />
      ) : null}

      {!isStaffUtilityMode ? (
        <InviteModal
          currency={offering.currency}
          entryFeeMinor={offering.entryFeeMinor}
          game={offering.gameKey}
          isOpen={isTeamPickerOpen}
          mode={offering.mode}
          onClose={() => setIsTeamPickerOpen(false)}
          onJoined={(result) => setJoined(result?.roomStatus !== "full")}
          offeringId={offering._id}
          teamSize={offering.teamSize}
        />
      ) : null}
    </>
  );
};

const Detail = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-3 text-center">
    <dt className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
      {label}
    </dt>
    <dd className="mt-1 text-sm font-bold text-white">{value}</dd>
  </div>
);

QuickMatchCard.propTypes = {
  offering: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    currency: PropTypes.string.isRequired,
    eligibility: PropTypes.shape({
      joinAvailable: PropTypes.bool.isRequired,
      reasons: PropTypes.arrayOf(PropTypes.string).isRequired,
    }).isRequired,
    entryFeeMinor: PropTypes.number.isRequired,
    execution: PropTypes.shape({
      lobbyRevealAt: PropTypes.string,
      scheduledFor: PropTypes.string,
      status: PropTypes.string.isRequired,
    }),
    game: PropTypes.shape({ name: PropTypes.string }),
    gameKey: PropTypes.string.isRequired,
    map: PropTypes.string,
    joinProgress: PropTypes.shape({
      capacity: PropTypes.number.isRequired,
      isFull: PropTypes.bool.isRequired,
      joinedParticipants: PropTypes.number.isRequired,
      percentage: PropTypes.number.isRequired,
      roomStatus: PropTypes.string.isRequired,
    }),
    maxParticipants: PropTypes.number.isRequired,
    membership: PropTypes.shape({
      isJoined: PropTypes.bool.isRequired,
      roomId: PropTypes.string,
      roomStatus: PropTypes.string,
    }),
    mode: PropTypes.string.isRequired,
    prizePoolMinor: PropTypes.number.isRequired,
    rewardPolicy: PropTypes.oneOf(["winner_split", "placement"]),
    placementRewards: PropTypes.arrayOf(PropTypes.shape({ place: PropTypes.number.isRequired, amountMinor: PropTypes.number.isRequired })),
    region: PropTypes.string.isRequired,
    schedulePolicy: PropTypes.oneOf(["on_demand", "scheduled"]).isRequired,
    teamSize: PropTypes.number.isRequired,
    testMoney: PropTypes.bool,
    title: PropTypes.string.isRequired,
  }).isRequired,
  showDetails: PropTypes.bool,
};

Detail.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default QuickMatchCard;
