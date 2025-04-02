import React, { useState, useEffect, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSocket } from "../context/socketContext";
import { fetchTournaments, updateTournament } from "../store/tournamentSlice";
import TournamentCard from "../components/ui/GameCard/TournamentCard";
import GameSlider from "../components/ui/GameSlider/GameSlider";

const TournamentPage = () => {
  const dispatch = useDispatch();
  const { tournament } = useSocket();
  let tournamentData = useSelector((state) => state.tournament.tournaments);
  tournamentData = { ...tournamentData, tournament };
  // Fetch tournaments on mount
  useEffect(() => {
    dispatch(fetchTournaments());
  }, [dispatch]);

  console.log("tournament Data recieved :", tournament);
  console.log("update data", tournamentData);
  return (
    <div className="bg-black min-h-screen text-white flex flex-col">
      {/* Hero Section with Search */}
      <HeroSection />

      {/* Always Show Featured Tournaments */}
      <div className="container mx-auto py-8">
        {/* <FeaturedTournaments
          tournaments={tournamentData.featuredTournaments || []}
        /> */}
      </div>

      {/* Filter Buttons */}
      {/* <div className="flex justify-center my-4">
        <div className="bg-gray-800 p-2 rounded-lg flex flex-wrap space-x-2">
          {[
            "all",
            "daily",
            "weekly",
            "monthly",
            "active",
            "upcoming",
            "past",
          ].map((option) => (
            <button
              key={option}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                filter === option
                  ? "bg-blue-500 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
              onClick={() => setFilter(option)}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
      </div> */}

      {/* Display Filtered Tournaments using TournamentCard */}
      {/* <div className="container mx-auto px-4 py-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredTournaments.length > 0 ? (
          filteredTournaments.map((tournament, index) => (
            <TournamentCard
              key={tournament.id || index}
              tournament={tournament}
            />
          ))
        ) : (
          <p className="text-center text-gray-400 col-span-full">
            No tournaments found.
          </p>
        )}
      </div> */}
    </div>
  );
};

const HeroSection = () => {
  const games = useSelector((store) => store.games?.data || []);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (games.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % games.length);
      }, 3000); // Slide every 3 seconds

      return () => clearInterval(interval);
    }
  }, [games]);

  return (
    <section className="relative bg-gray-900 text-white py-16 px-4 md:px-8 lg:px-16 flex flex-col items-center text-center">
      {/* Background Animation */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-700 opacity-20 blur-lg"></div>

      {/* Title */}
      <h1 className="text-4xl md:text-6xl font-extrabold z-10">
        Compete. Win. <span className="text-indigo-400">Conquer.</span>
      </h1>
      <p className="text-lg md:text-xl mt-4 max-w-2xl z-10">
        Join the most competitive gaming tournaments and prove your skills!
      </p>

      {/* Buttons */}
      <div className="mt-6 flex flex-wrap gap-4 justify-center z-10">
        <button className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-md transition">
          Join a Tournament
        </button>
        <button className="bg-gray-800 hover:bg-gray-700 text-white py-3 px-6 rounded-md">
          Explore Games
        </button>
      </div>

      {/* Search Bar */}
      <div className="mt-8 w-full max-w-lg z-10">
        <input
          type="text"
          placeholder="Search for tournaments..."
          className="w-full p-3 rounded-md bg-gray-800 text-white border border-gray-600 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400 transition"
        />
      </div>
      <GameSlider />
    </section>
  );
};

const FeaturedTournaments = ({ tournaments }) => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-4">
        🔥 Featured Tournaments
      </h2>
      {tournaments.length === 0 ? (
        <p className="text-gray-400 text-center">No tournaments available</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {tournaments.map((tournament) => (
            <TournamentCard key={tournament._id} tournament={tournament} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TournamentPage;
