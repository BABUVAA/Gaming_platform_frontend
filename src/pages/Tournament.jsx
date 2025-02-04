import React, { useEffect, useState } from "react";
import Fuse from "fuse.js";
import { TournamentCard } from "../components";
import { useDispatch } from "react-redux";
import { fetchTournaments } from "../store/tournamentSlice";
import Matchmaking from "../components/myComponents/MatchMaking";

const tournaments = [
  {
    id: 1,
    name: "Clash of Titans",
    game: "Clash of Clans",
    date: "2025-02-05",
    time: "18:00",
    type: "5v5",
    status: "Upcoming",
    category: "Monthly",
    image: "/coc_background.jpg",
    tags: ["Featured", "Leaderboard"],
    prizeAmount: 250.0,
    currentParticipants: 150,
    maxParticipants: 300,
  },
  {
    id: 2,
    name: "Battle Royale Showdown",
    game: "PUBG Mobile",
    date: "2025-02-10",
    time: "19:00",
    type: "Solo",
    status: "Ongoing",
    category: "Weekly",
    image: "/pubg_background.jpg",
    tags: ["Featured", "All Regions"],
    prizeAmount: 500.0,
    currentParticipants: 200,
    maxParticipants: 400,
  },
  {
    id: 3,
    name: "Fortnite Frenzy",
    game: "Fortnite",
    date: "2025-02-12",
    time: "20:00",
    type: "Duos",
    status: "Upcoming",
    category: "Special",
    image: "/coc_background.jpg",
    tags: ["Leaderboard", "All Servers"],
    prizeAmount: 300.0,
    currentParticipants: 100,
    maxParticipants: 200,
  },
  {
    id: 4,
    name: "Apex Legends Clash",
    game: "Apex Legends",
    date: "2025-02-15",
    time: "17:00",
    type: "Squad",
    status: "Ongoing",
    category: "Monthly",
    image: "/pubg_background.jpg",
    tags: ["All Regions", "All Platforms"],
    prizeAmount: 400.0,
    currentParticipants: 180,
    maxParticipants: 500,
  },
  {
    id: 5,
    name: "Minecraft Mayhem",
    game: "Minecraft",
    date: "2025-02-20",
    time: "16:00",
    type: "Solo",
    status: "Finished",
    category: "Event",
    image: "/coc_background.jpg",
    tags: ["Featured", "All Regions"],
    prizeAmount: 200.0,
    currentParticipants: 300,
    maxParticipants: 300,
  },
  {
    id: 6,
    name: "League Legends Championship",
    game: "League of Legends",
    date: "2025-02-25",
    time: "15:00",
    type: "Team",
    status: "Upcoming",
    category: "Seasonal",
    image: "/pubg_background.jpg",
    tags: ["Leaderboard", "All Servers"],
    prizeAmount: 600.0,
    currentParticipants: 120,
    maxParticipants: 350,
  },
  {
    id: 7,
    name: "Call of Duty: Modern Warfare",
    game: "Call of Duty",
    date: "2025-02-28",
    time: "14:00",
    type: "Squad",
    status: "Ongoing",
    category: "Special",
    image: "/coc_background.jpg",
    tags: ["Featured", "All Regions"],
    prizeAmount: 700.0,
    currentParticipants: 230,
    maxParticipants: 450,
  },
  {
    id: 8,
    name: "Valorant Vortex",
    game: "Valorant",
    date: "2025-03-05",
    time: "13:00",
    type: "Team",
    status: "Upcoming",
    category: "Monthly",
    image: "/pubg_background.jpg",
    tags: ["Leaderboard", "All Servers"],
    prizeAmount: 550.0,
    currentParticipants: 80,
    maxParticipants: 200,
  },
  {
    id: 9,
    name: "Rainbow Six Siege Faceoff",
    game: "Rainbow Six Siege",
    date: "2025-03-10",
    time: "12:00",
    type: "Squad",
    status: "Finished",
    category: "Event",
    image: "/pubg_background.jpg",
    tags: ["Featured", "All Platforms"],
    prizeAmount: 450.0,
    currentParticipants: 250,
    maxParticipants: 350,
  },
  {
    id: 10,
    name: "Overwatch Tournament",
    game: "Overwatch",
    date: "2025-03-15",
    time: "11:00",
    type: "Duos",
    status: "Ongoing",
    category: "Seasonal",
    image: "/pubg_background.jpg",
    tags: ["All Regions", "Leaderboard"],
    prizeAmount: 350.0,
    currentParticipants: 190,
    maxParticipants: 300,
  },
];

const Tournament = () => {
  const dispatch = useDispatch();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fuse = new Fuse(tournaments, {
    keys: ["name", "game", "type"],
    threshold: 0.3,
  });

  const results = search
    ? fuse.search(search).map((result) => result.item)
    : tournaments;
  const paginatedResults = results.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(results.length / itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    dispatch(fetchTournaments());
  }, []);

  return (
    <>
      <Matchmaking />
      <div className="p-4 md:p-8">
        <h1 className="text-2xl md:text-4xl font-bold text-center mb-8 text-indigo-700">
          Tournaments
        </h1>
        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tournaments..."
            className="w-full md:w-1/2 p-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Grid Layout - Display up to 10 Active Tournaments */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {paginatedResults.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>

        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="bg-gray-300 hover:bg-gray-400 text-black py-2 px-4 rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <p className="text-sm">
            Page {currentPage} of {totalPages}
          </p>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="bg-gray-300 hover:bg-gray-400 text-black py-2 px-4 rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
};

export default Tournament;
