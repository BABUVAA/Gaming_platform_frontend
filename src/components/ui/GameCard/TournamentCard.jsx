import React, { useState } from "react";
import { Link } from "react-router-dom";
import InviteModal from "../../feature/InviteModal";
import { useSocket } from "../../../context/socketContext";
import { useSelector } from "react-redux";

const TournamentCard = ({ tournament }) => {
  const {
    _id,
    tournamentName,
    game,
    mode,
    registeredPlayers,
    registeredTeams,
    maxParticipants,
    teamSize,
    entryFee,
    prizePool,
    status,
  } = tournament;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const { profile } = useSelector((store) => store.auth);

  const hasGame = profile.profile.games.some((gameObj) =>
    Object.values(gameObj).includes(game)
  );

  const { socket } = useSocket();
  let filledPercentage =
    mode !== "solo"
      ? (registeredTeams?.length / maxParticipants) * 100
      : (registeredPlayers?.length / maxParticipants) * 100;

  const handleJoinClick = (e) => {
    e.preventDefault(); // prevent navigation
    if (mode !== "solo") setIsModalOpen(true);
    else if (hasGame) {
      const payload = {
        tournamentId: _id,
      };
      socket.emit("join_tournament", payload);
    } else {
      alert("please connect your game");
    }
  };

  return (
    <>
      <div className="bg-white shadow-md rounded-xl p-4 w-full max-w-2xl mx-auto flex flex-col sm:flex-row justify-between gap-4 transition-all hover:shadow-xl">
        {/* Left */}
        <div className="flex-1">
          <div className="mb-1 text-sm text-gray-600 font-medium">{game}</div>
          <div className="text-xl font-bold text-gray-900">
            {tournamentName}
          </div>

          <div className="mt-2 text-xs text-gray-500">🏆 Prize Pool</div>
          <div className="text-2xl font-extrabold text-black">₹{prizePool}</div>

          <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${filledPercentage}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {mode !== "solo"
              ? maxParticipants - registeredTeams?.length
              : registeredPlayers.length}{" "}
            Spots left
          </div>
        </div>

        {/* Right */}
        <div className="flex flex-col justify-center items-center sm:items-end gap-2">
          <div className="text-sm text-gray-500">Entry</div>
          <div className="text-lg font-bold text-green-600">₹{entryFee}</div>
          <div className="text-xs text-gray-500">{maxParticipants} Spots</div>

          {status === "registration_open" && (
            <button
              onClick={handleJoinClick}
              className="mt-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-md transition-all"
            >
              Join Now
            </button>
          )}
          {/* Navigate link (optional) */}
          <Link
            to={`/tournamentDeatils/${_id}`}
            className="mt-1 text-xs text-blue-600 hover:underline"
          >
            View Details
          </Link>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <InviteModal
          tournamentId={tournament._id}
          maxParticipants={maxParticipants}
          teamSize={teamSize}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};

export default TournamentCard;
