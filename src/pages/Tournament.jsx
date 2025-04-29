import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTournaments } from "../store/tournamentSlice";
import TournamentCard from "../components/ui/GameCard/TournamentCard";
import GameSlider from "../components/ui/GameSlider/GameSlider";

const TournamentPage = () => {
  const dispatch = useDispatch();
  let { tournaments } = useSelector((state) => state.tournament);

  let tournamentData;
  tournamentData = { ...tournaments };

  // Fetch tournaments on mount
  useEffect(() => {
    dispatch(fetchTournaments());
  }, [dispatch]);

  return (
    <div className="bg-black min-h-screen  text-white flex flex-col">
      {/* Hero Section */}
      <HeroSection />

      {/* Tournament Sections */}
      <div className="container mx-auto py-10 px-6">
        {/* 🔥 New Tournaments */}
        <FeaturedTournaments
          label={"🔥 New Tournaments"}
          tournaments={tournamentData.tournament || []}
        />

        {/* 🔥 Featured Tournaments */}
        <FeaturedTournaments
          label={"🔥 Featured Tournaments"}
          tournaments={tournamentData.featuredTournaments || []}
        />

        {/* 🎮 Quick Join Tournaments by Game */}
        <FeaturedTournaments
          label={"🎮 Quick Join Tournaments"}
          tournaments={tournamentData.activeTournaments || []}
        />
      </div>
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
      }, 3000); // Auto-slide every 3 seconds
      return () => clearInterval(interval);
    }
  }, [games]);

  // Function to scroll to a specific section smoothly
  const scrollToNextSection = (id) => {
    const nextSection = document.getElementById(id);
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative w-full bg-gray-900 text-white py-20 px-6   flex flex-col items-center text-center">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-black opacity-60"></div>

      {/* Title & Description */}
      <h1 className="text-4xl md:text-6xl font-extrabold z-10">
        Compete. Win. <span className="text-indigo-400">Conquer.</span>
      </h1>
      <p className="text-lg md:text-xl mt-4 max-w-2xl z-10 opacity-90">
        Join the most competitive gaming tournaments and prove your skills!
      </p>

      {/* Buttons */}
      <div className="mt-6 flex gap-4">
        <button
          onClick={() => scrollToNextSection("featured-tournaments")}
          className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 rounded-lg shadow-md transition-all transform hover:scale-105 text-center"
        >
          Join Tournament
        </button>
        <button
          onClick={() => scrollToNextSection("quick-join")}
          className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg shadow-md transition-all transform hover:scale-105 text-center"
        >
          Quick Join
        </button>
      </div>

      {/* Game Slider */}
      <div className="mt-12 z-10">
        <GameSlider />
      </div>
    </section>
  );
};

const FeaturedTournaments = ({ label, tournaments }) => {
  return (
    <section className="py-10" id="featured-tournaments">
      <h2 className="text-3xl font-bold text-white mb-6">{label}</h2>
      {tournaments.length === 0 ? (
        <p className="text-gray-400 text-center">
          No featured tournaments available
        </p>
      ) : (
        <div className="flex flex-row flex-wrap justify-center gap-4">
          {tournaments.map((tournament) => (
            <TournamentCard
              key={tournament._id}
              tournament={tournament}
              hidden={
                tournament.status !== "registration_open" &&
                !tournament.isFeatured
              }
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default TournamentPage;
