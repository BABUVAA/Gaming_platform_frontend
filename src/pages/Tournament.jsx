import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSocket } from "../context/socketContext";
import { fetchTournaments, updateTournament } from "../store/tournamentSlice";
import HeroSection from "../components/feature/HeroSection";
import FeaturedTournaments from "../components/feature/FeaturedTournaments";
import TournamentCard from "../components/ui/GameCard/TournamentCard";

const TournamentPage = () => {
  const dispatch = useDispatch();
  const { socket } = useSocket();
  let tournamentData = useSelector((state) => state.tournament.tournaments);
  const [filteredTournaments, setFilteredTournaments] = useState([]);
  const [filter, setFilter] = useState("all");

  // Fetch tournaments on mount
  useEffect(() => {
    dispatch(fetchTournaments());
  }, [dispatch]);

  // Filtering tournaments based on selected category
  useEffect(() => {
    switch (filter) {
      case "daily":
        setFilteredTournaments(tournamentData.dailyTournaments || []);
        break;
      case "weekly":
        setFilteredTournaments(tournamentData.weeklyTournaments || []);
        break;
      case "monthly":
        setFilteredTournaments(tournamentData.monthlyTournaments || []);
        break;
      case "upcoming":
        setFilteredTournaments(tournamentData.upcomingTournaments || []);
        break;
      case "past":
        setFilteredTournaments(tournamentData.pastTournaments || []);
        break;
      case "active":
        setFilteredTournaments(tournamentData.activeTournaments || []);
        break;
      default:
        // Show all non-featured tournaments
        setFilteredTournaments([
          ...(tournamentData.dailyTournaments || []),
          ...(tournamentData.weeklyTournaments || []),
          ...(tournamentData.monthlyTournaments || []),
          ...(tournamentData.upcomingTournaments || []),
          ...(tournamentData.activeTournaments || []),
        ]);
    }
  }, [filter, tournamentData]);

  // Handle WebSocket Updates
  useEffect(() => {
    const handleNewTournament = (updatedTournament) => {
      tournamentData = { ...tournamentData, updateTournament };
    };

    socket.on("newTournament", handleNewTournament);

    return () => {
      socket.off("newTournament", handleNewTournament);
    };
  }, [socket, dispatch]);

  return (
    <div className="bg-black min-h-screen text-white flex flex-col">
      {/* Hero Section with Search */}
      <HeroSection
        onSearch={(query) => {
          setFilteredTournaments(
            filteredTournaments.filter((t) =>
              t.name.toLowerCase().includes(query.toLowerCase())
            )
          );
        }}
      />

      {/* Always Show Featured Tournaments */}
      <div className="container mx-auto px-4 py-8">
        <FeaturedTournaments
          tournaments={tournamentData.featuredTournaments || []}
        />
      </div>

      {/* Filter Buttons */}
      <div className="flex justify-center my-4">
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
      </div>

      {/* Display Filtered Tournaments using TournamentCard */}
      <div className="container mx-auto px-4 py-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
      </div>
    </div>
  );
};

export default TournamentPage;
