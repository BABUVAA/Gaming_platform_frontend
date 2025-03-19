import React from "react";
import TournamentCard from "../ui/GameCard/TournamentCard";

const FeaturedTournaments = ({ tournaments }) => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-4">
        🔥 Featured Tournaments
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {tournaments.map((tournament) => (
          <TournamentCard key={tournament.id} tournament={tournament} />
        ))}
      </div>
    </div>
  );
};

export default FeaturedTournaments;
