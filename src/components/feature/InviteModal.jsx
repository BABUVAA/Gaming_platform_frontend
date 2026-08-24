import { useState } from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { getStoredErrorMessage } from "../../api/apiError";
import { ROUTES } from "../../routes/routeConstants";
import { useMatchmakingStore } from "../../store/hooks/useStore";

const normalizeGameKey = (game) =>
  String(game || "").toLowerCase() === "pubg"
    ? "bgmi"
    : String(game || "").toLowerCase();

const EMPTY_TEAMS = Object.freeze([]);

const InviteModal = ({
  game,
  isOpen,
  mode,
  onClose,
  onJoined,
  offeringId,
  teamSize,
}) => {
  const [errorMessage, setErrorMessage] = useState("");
  const [teamId, setTeamId] = useState("");
  const { joinQuickMatch, joinStatus, joiningOfferingId } =
    useMatchmakingStore();
  const teams = useSelector(
    (store) => store.player.profile?.profile?.teams || EMPTY_TEAMS
  );

  // Display only teams that can plausibly satisfy this offering. The server
  // repeats these checks because browser state is never a security boundary.
  const availableTeams = teams.filter(
    (team) =>
      team.players?.length === teamSize &&
      (!team.gameKey && !team.game
        ? true
        : normalizeGameKey(team.gameKey || team.game) ===
          normalizeGameKey(game)) &&
      (!team.teamSize || Number(team.teamSize) === Number(teamSize)) &&
      (!team.mode ||
        String(team.mode).toLowerCase() === String(mode).toLowerCase())
  );

  if (!isOpen) return null;

  const handleJoin = async () => {
    if (!teamId) {
      setErrorMessage("Choose a saved team first.");
      return;
    }

    setErrorMessage("");
    try {
      // The thunk submits the durable HTTP command. The backend still checks
      // the team roster, while Socket.IO distributes later live updates.
      const result = await joinQuickMatch({
        offeringId,
        teamId,
      }).unwrap();
      onJoined?.(result);
      onClose();
    } catch (error) {
      // Inline feedback keeps the dialog useful even when its toast is missed.
      setErrorMessage(getStoredErrorMessage(error));
    }
  };

  // Block a second queue submission until the active HTTP command completes.
  const isJoinRequestInFlight = joinStatus === "loading";
  const isJoiningThisMatch = joiningOfferingId === offeringId;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <button
          aria-label="Close team selection"
          className="absolute right-4 top-4 text-xl text-slate-400 hover:text-white"
          disabled={isJoinRequestInFlight}
          onClick={onClose}
          type="button"
        >
          x
        </button>

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
          {game} {mode}
        </p>
        <h2 className="mt-2 text-xl font-black text-white">Choose your team</h2>
        <p className="mt-1 text-sm text-slate-400">
          Select a saved team with exactly {teamSize} players.
        </p>

        <div className="mt-5 max-h-64 space-y-2 overflow-y-auto">
          {availableTeams.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 p-5 text-center">
              <p className="text-sm text-slate-400">
                No matching saved team is available yet.
              </p>
              <Link
                className="mt-4 inline-flex rounded-xl border border-cyan-300/60 px-4 py-2 text-sm font-bold text-cyan-200 transition hover:bg-cyan-300/10"
                onClick={onClose}
                to={`${ROUTES.CLAN}?tab=teams`}
              >
                Create Team
              </Link>
            </div>
          ) : (
            availableTeams.map((team) => {
              const selected = teamId === team._id;

              return (
                <button
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selected
                      ? "border-cyan-300 bg-cyan-300/10"
                      : "border-slate-700 bg-slate-800/70 hover:border-slate-500"
                  }`}
                  key={team._id}
                  onClick={() => {
                    setTeamId(team._id);
                    setErrorMessage("");
                  }}
                  type="button"
                >
                  <span className="block font-bold text-white">
                    {team.teamName}
                  </span>
                  <span className="mt-1 block text-xs text-slate-400">
                    {team.players.length} players
                  </span>
                </button>
              );
            })
          )}
        </div>

        {errorMessage && (
          <p className="mt-4 text-sm font-medium text-rose-300">
            {errorMessage}
          </p>
        )}

        <button
          className="mt-5 w-full rounded-2xl bg-cyan-300 py-3 font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!teamId || isJoinRequestInFlight}
          onClick={handleJoin}
          type="button"
        >
          {isJoiningThisMatch ? "Finding a room..." : "Join match queue"}
        </button>
      </div>
    </div>
  );
};

InviteModal.propTypes = {
  game: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  mode: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onJoined: PropTypes.func,
  offeringId: PropTypes.string.isRequired,
  teamSize: PropTypes.number.isRequired,
};

export default InviteModal;
