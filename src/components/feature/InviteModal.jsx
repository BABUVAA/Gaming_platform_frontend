import { useState } from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import useSocket from "../../context/useSocket";

const normalizeGameKey = (game) =>
  String(game || "").toLowerCase() === "pubg"
    ? "bgmi"
    : String(game || "").toLowerCase();

const InviteModal = ({
  game,
  isOpen,
  mode,
  onClose,
  teamSize,
  tournamentId,
}) => {
  const [errorMessage, setErrorMessage] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [teamId, setTeamId] = useState("");
  const { connected, socket } = useSocket();
  const teams = useSelector(
    (store) => store.player.profile?.profile?.teams || []
  );

  // Display only teams that can plausibly satisfy this offering. The server
  // repeats these checks because browser state is never a security boundary.
  const availableTeams = teams.filter(
    (team) =>
      team.players?.length === teamSize &&
      (!team.game || normalizeGameKey(team.game) === normalizeGameKey(game)) &&
      (!team.mode ||
        String(team.mode).toLowerCase() === String(mode).toLowerCase())
  );

  if (!isOpen) return null;

  const handleJoin = () => {
    if (!teamId) {
      setErrorMessage("Choose a saved team first.");
      return;
    }

    if (!socket || !connected) {
      setErrorMessage("Live matchmaking is reconnecting. Please try again.");
      return;
    }

    setErrorMessage("");
    setIsJoining(true);

    // Socket.IO acknowledgements make the modal reflect the durable server
    // result rather than assuming that emitting an event means it succeeded.
    socket
      .timeout(10000)
      .emit(
        "join_tournament",
        { teamId, tournamentId },
        (timeoutError, response) => {
          setIsJoining(false);

          if (timeoutError) {
            setErrorMessage("Matchmaking took too long. Please try again.");
            return;
          }

          if (!response?.success) {
            setErrorMessage(
              response?.error?.message || "Unable to join this match."
            );
            return;
          }

          onClose();
        }
      );
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <button
          aria-label="Close team selection"
          className="absolute right-4 top-4 text-xl text-slate-400 hover:text-white"
          disabled={isJoining}
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
            <div className="rounded-2xl border border-dashed border-slate-700 p-5 text-sm text-slate-400">
              No matching saved team is available yet.
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
          disabled={!teamId || isJoining}
          onClick={handleJoin}
          type="button"
        >
          {isJoining ? "Finding a room..." : "Join match queue"}
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
  teamSize: PropTypes.number.isRequired,
  tournamentId: PropTypes.string.isRequired,
};

export default InviteModal;
