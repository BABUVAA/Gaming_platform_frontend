import React from "react";

const TournamentCard = ({ tournament }) => {
  return (
    <div className="bg-gray-800 text-white p-4 rounded-lg hover:shadow-lg transition">
      <img src={tournament.image} alt={tournament.name} className="rounded-md mb-2" />
      <h3 className="text-lg font-bold">{tournament.name}</h3>
      <p className="text-sm">Game: {tournament.game}</p>
      <p className="text-sm">💰 Prize: ₹{tournament.prizeAmount}</p>
      <p className="text-sm">Players: {tournament.currentParticipants}/{tournament.maxParticipants}</p>
      <button className="bg-blue-500 px-4 py-2 mt-2 w-full rounded-md hover:bg-blue-700 transition">
        Join Now
      </button>
    </div>
  );
};

export default TournamentCard;
