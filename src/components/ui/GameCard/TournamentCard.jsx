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
    map,
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
  const { socket } = useSocket();

  const hasGame = profile?.profile?.games?.some(
    (gameObj) => gameObj.game.link === game
  );

  // const filledPercentage =
  //   mode !== "solo"
  //     ? (registeredTeams?.length / maxParticipants) * 100
  //     : (registeredPlayers?.length / maxParticipants) * 100;
  const filledPercentage = 0;

  const handleJoinClick = (e) => {
    e.preventDefault();
    if (mode !== "solo") {
      setIsModalOpen(true);
    } else if (hasGame) {
      const payload = {
        tournamentId: _id,
      };
      console.log(payload);
      socket.emit("join_tournament", payload);
    } else {
      alert("Please connect your game.");
    }
  };

  return (
    <>
      <div className="bg-white shadow-lg rounded-xl p-5 w-full max-w-4xl mx-auto transition hover:shadow-2xl">
        {/* Header: Game + Status */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-sm text-indigo-500 font-semibold uppercase">
              {game}
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
              {tournamentName}
            </h2>
          </div>
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-md ${
              status === "registration_open"
                ? "bg-green-100 text-green-700"
                : "bg-gray-300 text-gray-600"
            }`}
          >
            {status.replace("_", " ").toUpperCase()}
          </span>
        </div>

        {/* Key Info Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm mb-4">
          <div className="bg-gray-100 px-3 py-2 rounded-md text-center">
            <p className="text-xs text-gray-500">Entry Fee</p>
            <p className="font-semibold text-green-600">₹{entryFee}</p>
          </div>
          <div className="bg-gray-100 px-3 py-2 rounded-md text-center">
            <p className="text-xs text-gray-500">Prize Pool</p>
            <p className="font-semibold text-yellow-600">₹{prizePool}</p>
          </div>
          <div className="bg-gray-100 px-3 py-2 rounded-md text-center">
            <p className="text-xs text-gray-500">Total Slots</p>
            <p className="font-medium text-black">{maxParticipants}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-700"
              style={{ width: `${filledPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {/* {mode !== "solo"
              ? maxParticipants - registeredTeams?.length === 0
                ? "Tournament Full"
                : `${maxParticipants - registeredTeams?.length} Spots left`
              : maxParticipants - registeredPlayers?.length === 0
              ? "Tournament Full"
              : `${maxParticipants - registeredPlayers?.length} Spots left`} */}
          </p>
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          {status === "registration_open" && (
            <button
              onClick={handleJoinClick}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md font-medium text-sm w-full sm:w-auto"
            >
              Join Tournament
            </button>
          )}
          <Link
            to={`/tournamentDeatils/${_id}`}
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            View Full Details →
          </Link>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <InviteModal
            tournamentId={_id}
            maxParticipants={maxParticipants}
            teamSize={teamSize}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </div>
    </>
  );
};

export default TournamentCard;
