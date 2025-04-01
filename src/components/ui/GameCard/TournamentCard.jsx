import React from "react";
import { Link } from "react-router-dom";

const TournamentCard = ({ tournament }) => {
  const {
    id,
    game,
    title,
    playersJoined,
    totalPlayers,
    entryFee,
    prizePool,
    status,
    mode,
    startTime,
    thumbnail = "/profile-pic.png",
  } = tournament;
  console.log("tournamentCard", tournament);
  // Calculate players joined percentage
  const filledPercentage = (playersJoined / totalPlayers) * 100;

  // Dynamic Status Badge
  const getStatusBadge = () => {
    if (status === "live") return "Live Now 🔴";
    if (playersJoined >= totalPlayers * 0.9) return "Almost Full ⚡";
    if (startTime) return `Starts in ${startTime}`;
    return "Open for Registration";
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-xl transition transform hover:-translate-y-1">
      {/* Thumbnail */}
      <Link to={`/tournament/${id}`}>
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-40 object-cover rounded-lg"
        />
      </Link>

      {/* Tournament Info */}
      <div className="mt-4 text-white">
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="text-gray-400 text-sm">
          {game} • {mode}
        </p>

        {/* Players Bar */}
        <div className="mt-2 flex items-center space-x-2">
          <div className="w-full bg-gray-700 rounded-full h-3 relative">
            <div
              className="bg-green-500 h-3 rounded-full"
              style={{ width: `${filledPercentage}%` }}
            ></div>
          </div>
          <span className="text-gray-300 text-xs">
            {playersJoined}/{totalPlayers} Players
          </span>
        </div>

        {/* Entry Fee & Prize */}
        <div className="flex justify-between items-center mt-3">
          <div>
            <p className="text-sm text-yellow-400">💰 Entry: ₹{entryFee}</p>
            <p className="text-sm text-green-400">🏆 Prize: ₹{prizePool}</p>
          </div>
          <span className="text-xs px-3 py-1 bg-gray-600 text-white rounded-lg">
            {getStatusBadge()}
          </span>
        </div>

        {/* Join Now Button */}
        <Link
          to={`/tournament/${id}`}
          className="block mt-3 bg-blue-600 hover:bg-blue-700 text-center text-white font-semibold py-2 rounded-lg transition"
        >
          Join Now
        </Link>
      </div>
    </div>
  );
};

export default TournamentCard;
