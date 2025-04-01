import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import GameSlider from "../ui/GameSlider/GameSlider";

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

export default HeroSection;
