import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import TournamentCard from "../components/ui/GameCard/TournamentCard";
import GameSlider from "../components/ui/GameSlider/GameSlider";

const TournamentPage = () => {
  const { tournaments = {} } = useSelector((state) => state.tournament);
  const { profile } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("tournaments");
  const [activeFilter, setActiveFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const filters = ["coc", "bgmi"];

  const filteredTournaments = useMemo(() => {
    const tournamentList = Object.values(tournaments);
    if (!activeFilter || activeFilter === "All") return tournamentList;
    if (activeFilter === "Featured")
      return tournamentList.filter((t) => t.isFeatured);
    return tournamentList.filter(
      (tournament) =>
        tournament.mode === activeFilter ||
        tournament.map === activeFilter ||
        tournament.category === activeFilter ||
        tournament.game === activeFilter
    );
  }, [tournaments, activeFilter]);

  const totalPages = Math.ceil(filteredTournaments.length / itemsPerPage);
  const paginatedTournaments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTournaments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTournaments, currentPage]);

  return (
    <>
      <HeroSection />

      <div id="tournament-section" className="min-h-screen bg-black text-white">
        <div className="sticky top-0 z-30 bg-gray-900 border-b border-gray-800 shadow-sm">
          <TabsSection activeTab={activeTab} onTabChange={setActiveTab} />
          {(activeTab === "tournaments" || activeTab === "my_tournaments") && (
            <FilterSection
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
              filters={filters}
            />
          )}
        </div>

        <div className="max-w-6xl mx-auto px-4 mt-6 space-y-10 pb-20">
          {activeTab === "tournaments" && (
            <>
              <Tournament
                tournaments={paginatedTournaments}
                activeTab={activeTab}
              />
              <Pagination
                totalPages={totalPages}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
              />
            </>
          )}
          {activeTab === "my_tournaments" && (
            <>
              <Tournament tournaments={profile.profile.tournaments} />
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default TournamentPage;

const HeroSection = () => {
  const games = useSelector((state) => state.games?.data || []);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (games.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % games.length);
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [games]);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative w-full min-h-screen bg-gradient-to-b from-indigo-900 via-black to-black text-white py-24 px-6 flex flex-col items-center text-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/90 pointer-events-none"></div>

      <h1 className="z-10 text-5xl md:text-6xl font-extrabold max-w-4xl leading-tight">
        Compete. Win. <span className="text-indigo-400">Conquer.</span>
      </h1>

      <p className="z-10 mt-5 text-lg md:text-xl max-w-2xl opacity-90">
        Join the most competitive gaming tournaments and prove your skills
        across your favorite games!
      </p>

      <div className="z-10 mt-8 flex flex-wrap gap-5 justify-center w-full max-w-md">
        <button
          onClick={() => scrollToSection("tournament-section")}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 transition rounded-lg py-3 font-semibold shadow-lg transform hover:scale-105"
        >
          Join Tournament
        </button>
        <button
          onClick={() => scrollToSection("tournament-section")}
          className="flex-1 bg-gray-800 hover:bg-gray-700 transition rounded-lg py-3 font-semibold shadow-lg transform hover:scale-105"
        >
          Quick Join
        </button>
      </div>

      <div className="z-10 mt-16 w-full max-w-5xl">
        <GameSlider currentIndex={currentIndex} />
      </div>
    </section>
  );
};

const TabsSection = ({ activeTab, onTabChange }) => {
  const tabs = ["tournaments", "my_tournaments", "teams", "Rules"];
  return (
    <div className="flex w-full overflow-x-auto scrollbar-hide px-2">
      {tabs.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`flex-1 text-sm sm:text-base px-3 py-3 font-semibold border-b-2 transition-colors duration-200 whitespace-nowrap ${
              isActive
                ? "border-red-500 text-white"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            {tab.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
          </button>
        );
      })}
    </div>
  );
};

const FilterSection = ({ activeFilter, setActiveFilter, filters = [] }) => {
  return (
    <div className="flex w-full overflow-x-auto items-center gap-2 px-4 py-2 bg-gray-900 border-t border-gray-700">
      {["All", "Featured", ...filters].map((filter) => {
        const isActive = activeFilter === filter;
        return (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-3 py-1 rounded-full text-sm font-medium border transition ${
              isActive
                ? "bg-red-600 border-red-500 text-white"
                : "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
            }`}
          >
            {filter}
          </button>
        );
      })}
    </div>
  );
};

const Tournament = ({ tournaments, activeTab }) => (
  <section>
    {tournaments.length === 0 ? (
      <p className="text-gray-400 text-center">No tournaments available</p>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.map((tournament) => (
          <TournamentCard
            key={tournament._id}
            tournament={tournament}
            disableFetch={activeTab === "tournaments"}
          />
        ))}
      </div>
    )}
  </section>
);

const Pagination = ({ totalPages, currentPage, setCurrentPage }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center mt-6 gap-2">
      {Array.from({ length: totalPages }, (_, idx) => (
        <button
          key={idx}
          onClick={() => setCurrentPage(idx + 1)}
          className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors duration-150 ${
            currentPage === idx + 1
              ? "bg-red-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          {idx + 1}
        </button>
      ))}
    </div>
  );
};
