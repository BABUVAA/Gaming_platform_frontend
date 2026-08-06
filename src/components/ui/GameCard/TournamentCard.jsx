import { useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { buildTournamentOfferingPath } from "../../../routes/routeConstants";
import InviteModal from "../../feature/InviteModal";
import { useSelector } from "react-redux";
import { useMatchmakingStore } from "../../../store/hooks/useStore";

const TournamentCard = ({ tournament, disableFetch }) => {
  const {
    _id,
    tournamentName,
    game,
    mode,
    maxParticipants,
    teamSize,
    entryFee,
    prizePool,
    status,
  } = tournament;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const { joinQuickMatch, joinStatus, joiningOfferingId } =
    useMatchmakingStore();

  const { profile } = useSelector((store) => store.player);

  const hasGame = profile?.profile?.games?.some(
    (gameObj) =>
      gameObj.game?.link === game &&
      gameObj.verificationStatus === "verified"
  );

  const handleJoinClick = async (event) => {
    event.preventDefault();

    // This check gives immediate guidance, while the backend repeats the same
    // eligibility validation for every player in the submitted roster.
    if (!hasGame) {
      alert("Please verify your game account first.");
      return;
    }

    if (mode !== "solo") {
      setIsModalOpen(true);
      return;
    }

    try {
      // The store thunk owns the HTTP command, toast, and normalized error.
      // Socket.IO only refreshes live queue and match data after success.
      await joinQuickMatch({ offeringId: _id }).unwrap();
    } catch {
      // The configured thunk toast already gives the player the failure reason.
    }
  };

  // Disable every join control while the store submits one command. A player
  // must receive the first queue result before they can choose another match.
  const isJoinRequestInFlight = joinStatus === "loading";
  const isJoiningThisMatch = joiningOfferingId === _id;

  return (
    <>
      <div className="group rounded-3xl border border-slate-800 bg-[linear-gradient(180deg,_rgba(15,23,42,0.9),_rgba(2,6,23,0.98))] p-4 shadow-[0_18px_50px_rgba(2,8,23,0.45)] transition hover:-translate-y-1 hover:border-slate-700">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300/80">
              {game}
            </p>
            <h2 className="mt-2 text-lg font-black text-white line-clamp-2">
              {tournamentName}
            </h2>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
              status === "registration_open"
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-slate-800 text-slate-300"
            }`}
          >
            {status.replace("_", " ")}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <InfoChip label="Entry" value={`Rs ${entryFee}`} />
          <InfoChip label="Prize" value={`Rs ${prizePool}`} />
          <InfoChip label="Slots" value={maxParticipants} />
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
          <span>{mode.toUpperCase()}</span>
          <span>Up to {maxParticipants} players</span>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          {status === "registration_open" && (
            <button
              onClick={handleJoinClick}
              disabled={isJoinRequestInFlight}
              className="rounded-2xl bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-60"
            >
              {isJoiningThisMatch ? "Joining..." : "Join Now"}
            </button>
          )}
          {!disableFetch && (
            <Link
              to={buildTournamentOfferingPath(_id)}
              className="text-sm font-semibold text-cyan-200"
            >
              View details
            </Link>
          )}
        </div>
      </div>

      {isModalOpen && (
        <InviteModal
          tournamentId={_id}
          teamSize={teamSize}
          game={game}
          mode={mode}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};

const InfoChip = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-3 text-center">
    <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
      {label}
    </p>
    <p className="mt-1 text-sm font-bold text-white">{value}</p>
  </div>
);

TournamentCard.propTypes = {
  tournament: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    tournamentName: PropTypes.string.isRequired,
    game: PropTypes.string.isRequired,
    mode: PropTypes.string.isRequired,
    maxParticipants: PropTypes.number.isRequired,
    teamSize: PropTypes.number,
    entryFee: PropTypes.number,
    prizePool: PropTypes.number,
    status: PropTypes.string.isRequired,
  }).isRequired,
  disableFetch: PropTypes.bool,
};

InfoChip.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default TournamentCard;
