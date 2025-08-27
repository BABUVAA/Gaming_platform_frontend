import React, { useState } from "react";
import { Link } from "react-router-dom";
import InviteModal from "../../feature/InviteModal";
import { useSocket } from "../../../context/socketContext";
import { useSelector } from "react-redux";
import ClanVerify from "../../feature/ClanVerify";

const TournamentCard = ({ tournament, disableFetch }) => {
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

  const [isModalOpen, setIsModalOpen] = useState(false); // InviteModal
  const [isClanVerifyOpen, setIsClanVerifyOpen] = useState(false); // ClanVerify
  const [clanStatus, setClanStatus] = useState(null);

  const { profile } = useSelector((store) => store.auth);
  const { wallet } = useSelector((store) => store.payment);
  const { socket } = useSocket();

  const hasGame = profile?.profile?.games?.some(
    (gameObj) => gameObj.game.link === game
  );

  const filledPercentage =
    mode === "solo"
      ? registeredPlayers
        ? (registeredPlayers.length / maxParticipants) * 100
        : 0
      : registeredTeams
      ? (registeredPlayers.length / (maxParticipants * teamSize)) * 100
      : 0;

  const handleJoinClick = (e) => {
    e.preventDefault();

    if (wallet.realMoney < entryFee) {
      alert("Charge your wallet first");
      return;
    }

    if (!hasGame && mode === "solo") {
      alert("Please connect your game.");
      return;
    }

    // Show ClanVerify only for CoC
    if (game.toLowerCase() === "coc") {
      setIsClanVerifyOpen(true);
    } else {
      // Directly join for other games
      const payload = { tournamentId: _id };
      socket.emit("join_tournament", payload);
    }
  };

  // Callback after clan verification succeeds
  const handleClanValidationSuccess = (clanData) => {
    setClanStatus(clanData); // save clan info
    setIsClanVerifyOpen(false);
    setIsModalOpen(true); // show invite modal after clan validation
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-md p-3 w-full transition-all hover:shadow-lg hover:-translate-y-0.5 duration-300">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-[10px] uppercase text-indigo-600 font-semibold">
              {game}
            </p>
            <h2 className="text-sm font-bold text-gray-900 line-clamp-2">
              {tournamentName}
            </h2>
          </div>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
              status === "registration_open"
                ? "bg-green-100 text-green-700"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            {status.replace("_", " ").toUpperCase()}
          </span>
        </div>

        {/* Key Info Chips */}
        <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 text-xs mb-3">
          <InfoChip label="Entry Fee" value={`₹${entryFee}`} color="green" />
          <InfoChip label="Prize Pool" value={`₹${prizePool}`} color="yellow" />
          <InfoChip label="Total Slots" value={maxParticipants} color="gray" />
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-700"
              style={{ width: `${filledPercentage}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-3 flex flex-row gap-2 items-center justify-between">
          {status === "registration_open" && (
            <button
              onClick={handleJoinClick}
              className="sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded text-xs font-medium transition-all"
            >
              Join
            </button>
          )}
          {!disableFetch && (
            <Link
              to={`/tournamentDeatils/${_id}`}
              className="text-xs text-indigo-600 hover:underline font-medium"
            >
              Details →
            </Link>
          )}
        </div>
      </div>

      {/* Clan Verify Modal */}
      {isClanVerifyOpen && (
        <ClanVerify
          isOpen={isClanVerifyOpen}
          onClose={() => setIsClanVerifyOpen(false)}
          onValidationSuccess={handleClanValidationSuccess}
        />
      )}

      {/* Invite Modal */}
      {isModalOpen && (
        <InviteModal
          tournamentId={_id}
          teamSize={teamSize}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          clanData={clanStatus} // pass clan info
        />
      )}
    </>
  );
};

// Chip Component
const InfoChip = ({ label, value, color }) => {
  const colorMap = {
    green: "text-green-600",
    yellow: "text-yellow-600",
    gray: "text-gray-800",
  };

  return (
    <div className="bg-gray-100 px-2 py-1 rounded text-center">
      <p className="text-[10px] text-gray-500">{label}</p>
      <p className={`text-xs font-semibold ${colorMap[color]}`}>{value}</p>
    </div>
  );
};

export default TournamentCard;
