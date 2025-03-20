import React from "react";

const TournamentCard = ({ tournament }) => {
  console.log(tournament);
  return (
    <div className="bg-gray-800 text-white p-4 rounded-lg hover:shadow-lg transition">
      <img
        src={tournament.image}
        alt={tournament.name}
        className="rounded-md mb-2 w-full h-32 object-cover"
      />
      <h3 className="text-lg font-bold">{tournament.name}</h3>
      <p className="text-sm">🎮 {tournament.game}</p>
      <p className="text-sm">💰 Prize: ₹{tournament.prizeAmount}</p>
      <p className="text-sm">
        👥 {tournament.currentParticipants}/{tournament.maxParticipants} Players
      </p>
      <button className="bg-blue-500 px-4 py-2 mt-2 w-full rounded-md hover:bg-blue-700 transition">
        Join Now
      </button>
    </div>
  );
};

const TournamentList = (tournaments) => {
  console.log(tournaments);
  return (
    <div className="p-4">
      {/* Desktop View - Table Format */}
      <div className="hidden md:block">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-900 text-white">
              <th className="p-3">Tournament</th>
              <th className="p-3">Game</th>
              <th className="p-3">Prize Pool</th>
              <th className="p-3">Players</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {/* {tournaments.map((tournament) => (
              <tr key={tournament.id} className="border-b border-gray-700">
                <td className="p-3">{tournament.name}</td>
                <td className="p-3">{tournament.game}</td>
                <td className="p-3">₹{tournament.prizeAmount}</td>
                <td className="p-3">
                  {tournament.currentParticipants}/{tournament.maxParticipants}
                </td>
                <td className="p-3">
                  <button className="bg-blue-500 px-3 py-1 rounded-md hover:bg-blue-700">
                    Join Now
                  </button>
                </td>
              </tr>
            ))} */}
          </tbody>
        </table>
      </div>

      {/* Mobile View - Card Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4">
        {/* {tournaments.map((tournament) => (
          <TournamentCard key={tournament.id} tournament={tournament} />
        ))} */}
      </div>
    </div>
  );
};

export default TournamentList;
