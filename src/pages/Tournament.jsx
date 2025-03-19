import React, { useState } from "react";

import { searchTournaments } from "../utils/search";
import HeroSection from "../components/feature/HeroSection";
import FeaturedTournaments from "../components/feature/FeaturedTournaments";

// Sample Data (Replace with API)
const tournaments = [
  {
    id: 1,
    name: "BGMI Showdown",
    game: "BGMI",
    prizeAmount: 5000,
    entryFee: 50,
    image: "bgmi.jpg",
    currentParticipants: 80,
    maxParticipants: 100,
  },
  {
    id: 2,
    name: "Valorant Masters",
    game: "Valorant",
    prizeAmount: 8000,
    entryFee: 100,
    image: "valorant.jpg",
    currentParticipants: 50,
    maxParticipants: 100,
  },
];

const TournamentPage = () => {
  const [filteredTournaments, setFilteredTournaments] = useState(tournaments);

  const handleSearch = (query) => {
    setFilteredTournaments(searchTournaments(query, tournaments));
  };

  return (
    <div className="bg-black min-h-screen text-white">
      <HeroSection onSearch={handleSearch} />
      <FeaturedTournaments tournaments={filteredTournaments} />
    </div>
  );
};

export default TournamentPage;
