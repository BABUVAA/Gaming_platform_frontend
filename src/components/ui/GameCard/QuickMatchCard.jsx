import { useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { getStoredErrorMessage } from "../../../api/apiError";
import { useMatchmakingStore } from "../../../store/hooks/useStore";
import InviteModal from "../../feature/InviteModal";
import { selectIsStaffUtilityMode } from "../../../store/selectors/playerSelectors";
import { STAFF_UTILITY_MESSAGE } from "../../../utils/staffUtilityMode";

const reasonLabels = {
  game_account_verification_required:
    "Verify this game account to become eligible.",
  payment_holds_not_available:
    "Paid entry is not available until wallet holds are enabled.",
  staff_read_only:
    "Staff accounts can view this offering but cannot join from the player dashboard.",
  queue_activation_pending: "Queue entry is being activated for this format.",
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

const QuickMatchCard = ({ offering }) => {
  const [errorMessage, setErrorMessage] = useState("");
  const [isTeamPickerOpen, setIsTeamPickerOpen] = useState(false);
  const [joined, setJoined] = useState(false);
  const isStaffUtilityMode = useSelector(selectIsStaffUtilityMode);
  const { joinQuickMatch, joiningOfferingId, joinStatus } =
    useMatchmakingStore();
  const reasons = offering.eligibility?.reasons || [];
  const gameName = offering.game?.name || offering.gameKey;
  const isJoining =
    joinStatus === "loading" && joiningOfferingId === offering._id;

  const handleJoin = async () => {
    if (isStaffUtilityMode) return;
    setErrorMessage("");
    if (offering.teamSize > 1) {
      setIsTeamPickerOpen(true);
      return;
    }

    try {
      await joinQuickMatch({
        offeringId: offering._id,
        source: "quick_match",
      }).unwrap();
      setJoined(true);
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
            value={formatMinorAmount(
              offering.entryFeeMinor,
              offering.currency,
            )}
          />
          <Detail
            label="Prize"
            value={formatMinorAmount(
              offering.prizePoolMinor,
              offering.currency,
            )}
          />
          <Detail label="Seats" value={offering.maxParticipants} />
        </dl>

        <p className="mt-4 text-sm text-slate-300">
          {offering.mode}
          {offering.map ? ` · ${offering.map}` : ""} · {offering.teamSize}
          -player{offering.teamSize === 1 ? " entry" : " team"} ·{" "}
          {offering.region}
        </p>
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
              <Link className="inline-flex text-sm font-bold text-cyan-200" to="/staff">
                Open Staff Workspace
              </Link>
            </div>
          ) : offering.eligibility?.joinAvailable ? (
            joined ? (
              <p className="text-sm font-semibold text-emerald-200">
                Queue joined. Follow progress in My Matches.
              </p>
            ) : (
              <button
                className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 disabled:cursor-wait disabled:opacity-60"
                disabled={joinStatus === "loading"}
                onClick={handleJoin}
                type="button"
              >
                {isJoining
                  ? "Joining..."
                  : offering.teamSize > 1
                    ? "Choose team"
                    : "Join queue"}
              </button>
            )
          ) : (
            <div className="space-y-2">
              {(reasons.length ? reasons : ["queue_activation_pending"]).map(
                (reason) => (
                  <p className="text-xs leading-5 text-amber-100" key={reason}>
                    {reasonLabels[reason] ||
                      "This queue is not available yet."}
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
        </div>
      </article>

      {!isStaffUtilityMode ? (
        <InviteModal
          game={offering.gameKey}
          isOpen={isTeamPickerOpen}
          mode={offering.mode}
          onClose={() => setIsTeamPickerOpen(false)}
          onJoined={() => setJoined(true)}
          source="quick_match"
          teamSize={offering.teamSize}
          tournamentId={offering._id}
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
    game: PropTypes.shape({ name: PropTypes.string }),
    gameKey: PropTypes.string.isRequired,
    map: PropTypes.string,
    maxParticipants: PropTypes.number.isRequired,
    mode: PropTypes.string.isRequired,
    prizePoolMinor: PropTypes.number.isRequired,
    region: PropTypes.string.isRequired,
    schedulePolicy: PropTypes.oneOf(["on_demand", "scheduled"]).isRequired,
    teamSize: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
  }).isRequired,
};

Detail.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default QuickMatchCard;
