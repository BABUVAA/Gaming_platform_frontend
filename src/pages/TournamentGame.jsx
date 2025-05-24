import React from "react";
import { useParams } from "react-router-dom";
import { TournamentCard } from "../components";

// Game-specific data
const gameData = {
  coc: {
    name: "Clash of Clans",
    icon: "/coc_title.png",
    downloadLink: "https://supercell.com/en/games/clashofclans/",
    promoImages: [
      "https://i.imgur.com/pyOONqm.png",
      "https://i.imgur.com/vDWK9dy.png",
      "https://i.imgur.com/iE39Hdm.png",
    ],
  },
  bgmi: {
    name: "BGMI",
    icon: "/pubg_title.png",
    downloadLink: "https://www.battlegroundsmobileindia.com/",
    promoImages: [
      "https://i.imgur.com/AeNKfaR.png",
      "https://i.imgur.com/60tq4bk.png",
      "https://i.imgur.com/60tq4bk.png",
    ],
  },
};

// Dummy tournament data (replace with real data or fetch from backend)
const dummyTournaments = [
  {
    _id: "1",
    title: "BGMI Mega Match",
    game: "bgmi",
    status: "featured",
    entryFee: 10,
    prize: 100,
    date: "2025-05-25",
  },
  {
    _id: "2",
    title: "BGMI Squad War",
    game: "bgmi",
    status: "registration_open",
    entryFee: 20,
    prize: 200,
    date: "2025-05-26",
  },
  {
    _id: "3",
    title: "Clash Mayhem",
    game: "coc",
    status: "active",
    entryFee: 5,
    prize: 50,
    date: "2025-05-22",
  },
  {
    _id: "4",
    title: "Clash Brawl",
    game: "coc",
    status: "registration_open",
    entryFee: 10,
    prize: 150,
    date: "2025-05-23",
  },
];

const TournamentGame = () => {
  const { game } = useParams();

  // Check if the game exists
  if (!gameData[game]) {
    return (
      <h2 className="text-center text-3xl text-red-500 mt-10">
        Game Not Found!
      </h2>
    );
  }

  const { name, icon, downloadLink, promoImages } = gameData[game];

  // Filter tournaments for this game
  const gameTournaments = dummyTournaments.filter((t) => t.game === game);

  // Categorize tournaments
  const categorizedTournaments = {
    featured: gameTournaments.filter((t) => t.status === "featured"),
    registration_open: gameTournaments.filter(
      (t) => t.status === "registration_open"
    ),
    active: gameTournaments.filter((t) => t.status === "active"),
  };

  const categoryList = [
    {
      label: "🔥 Featured Matches",
      tournaments: categorizedTournaments.featured,
    },
    {
      label: "🎯 Registration Open",
      tournaments: categorizedTournaments.registration_open,
    },
    { label: "🎮 Ongoing Matches", tournaments: categorizedTournaments.active },
  ];

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      {/* Banner Section */}
      <div className="relative w-full bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 py-8 md:py-12 text-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center px-4">
          <h2 className="text-3xl md:text-4xl font-bold flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <img src={icon} alt={name} className="w-10 h-10 md:w-12 md:h-12" />
            <span>{name}</span>
          </h2>
          <a
            href={downloadLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center px-4 md:px-6 py-2 md:py-3 bg-yellow-400 text-gray-900 font-bold rounded-lg hover:bg-yellow-500 transition-all text-sm md:text-base"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 md:w-6 md:h-6 mr-2"
              viewBox="0 0 24 24"
            >
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="2.3"
                d="M12 17V3m-6 8l6 6l6-6m1 10H5"
              ></path>
            </svg>
            Download Game
          </a>
        </div>
      </div>

      {/* Promo Images */}
      <div className="w-[85vw] overflow-hidden">
        <div className="flex overflow-x-auto space-x-2 md:space-x-4 py-6 px-4 scrollbar-hide">
          {promoImages.map((img, index) => (
            <div
              key={index}
              className="flex-none w-36 md:w-52 rounded-lg overflow-hidden shadow-lg"
            >
              <img
                src={img}
                alt={`promo ${index}`}
                className="w-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Tournament Categories */}
      <div className="max-w-6xl mx-auto px-4 mt-10 space-y-10 pb-16">
        {categoryList.map(
          (category, idx) =>
            category.tournaments.length > 0 && (
              <CategorySection
                key={idx}
                label={category.label}
                tournaments={category.tournaments}
              />
            )
        )}
      </div>
    </div>
  );
};

// Reusable Category Section
const CategorySection = ({ label, tournaments }) => (
  <section className="py-10" id="featured-tournaments">
    <h2 className="text-3xl font-bold text-white mb-6">{label}</h2>
    {tournaments.length === 0 ? (
      <p className="text-gray-400 text-center">
        No featured tournaments available
      </p>
    ) : (
      <div className="flex flex-row flex-wrap justify-center gap-4">
        {tournaments.map((tournament) => (
          <TournamentCard key={tournament._id} tournament={tournament} />
        ))}
      </div>
    )}
  </section>
);

export default TournamentGame;
