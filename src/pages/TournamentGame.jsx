import React from "react";
import { useParams, Link } from "react-router-dom";
import Matchmaking from "../components/myComponents/MatchMaking";

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

const TournamentGame = () => {
  const { game } = useParams();

  // If the game doesn't exist in the data, show 404
  if (!gameData[game]) {
    return (
      <h2 className="text-center text-3xl text-red-500 mt-10">
        Game Not Found!
      </h2>
    );
  }

  const { name, icon, downloadLink, promoImages } = gameData[game];

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

      {/* Promo Images Section */}
      <div className="w-[95vw] overflow-hidden">
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

      {/* Quick Match Section */}
      <div className="max-w-4xl mb-16 mx-auto mt-8 md:mt-12 p-4 md:p-6 bg-gray-800 rounded-lg shadow-lg text-center">
        <h3 className="text-xl md:text-2xl font-bold border-b border-gray-600 pb-2">
          Quick Match for {name}
        </h3>
        <p className="text-gray-400 mt-4 text-sm md:text-base">
          Find and join a quick match instantly.
        </p>
        <div className="mt-6 w-full h-32">
          <Matchmaking />
        </div>
      </div>
    </div>
  );
};

export default TournamentGame;
