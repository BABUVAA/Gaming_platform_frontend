import { useMemo, useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { TournamentCard } from "../components";
import { useSelector } from "react-redux";

// Game-specific data (same as before)
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
    filters: ["5v5", "10vs10", "CWL"],
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
    filters: ["solo", "duo", "squad", "erangel", "sanhok", "miramar"],
  },
};

const TournamentGame = () => {
  const { game } = useParams();
  const { profile } = useSelector((state) => state.auth);
  const { tournaments } = useSelector((store) => store.tournament);
  const [activeTab, setActiveTab] = useState("tournaments");
  const [activeFilter, setActiveFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const joinedTournaments = () => {
    return (profile?.profile?.tournaments || []).filter((t) => t.game === game)
      .length;
  };

  if (!gameData[game]) {
    return (
      <h2 className="text-center text-3xl text-red-500 mt-10">
        Game Not Found!
      </h2>
    );
  }

  const { name, icon, downloadLink, promoImages, filters } = gameData[game];

  // Filter tournaments for the game
  const gameTournaments = Object.values(tournaments).filter(
    (t) => t.game === game
  );

  const filteredTournaments = useMemo(() => {
    const tournamentList = Object.values(gameTournaments);
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

  // When filters change, reset page to 1
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <BannerSection
        name={name}
        icon={icon}
        downloadLink={downloadLink}
        promoImages={promoImages}
      />
      <div className="sticky top-0 z-30 bg-gray-900 border-b border-gray-800 shadow-sm">
        <TabsSection
          activeTab={activeTab}
          onTabChange={setActiveTab}
          joinedTournaments={joinedTournaments()}
        />
        {(activeTab === "tournaments" || activeTab === "my_tournaments") && (
          <FilterSection
            activeFilter={activeFilter}
            setActiveFilter={handleFilterChange}
            filters={filters}
          />
        )}
      </div>
      <div className="max-w-6xl mx-auto px-4 mt-2 space-y-6 pb-16">
        {activeTab === "tournaments" && (
          <>
            <Tournament
              tournaments={paginatedTournaments}
              activeTab={activeTab}
              game={game}
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
            <Tournament tournaments={profile.profile.tournaments} game={game} />
          </>
        )}
      </div>
    </div>
  );
};

export default TournamentGame;

const BannerSection = ({ name, icon, downloadLink, promoImages }) => {
  return (
    <>
      <div className="relative w-[100vw] md:w-full  bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 py-8 md:py-12 text-center">
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
      <div className="w-[100vw] md:w-full overflow-x-auto">
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
    </>
  );
};

const TabsSection = ({ activeTab, onTabChange, joinedTournaments }) => {
  const tabs = ["tournaments", "my_tournaments", "teams", "Rules"];
  const prevCountRef = useRef(joinedTournaments);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    // Show NEW if tournament count increases and user is NOT on my_tournaments tab
    if (
      joinedTournaments > prevCountRef.current &&
      activeTab !== "my_tournaments"
    ) {
      setShowNew(true);
    }
    prevCountRef.current = joinedTournaments;
  }, [joinedTournaments, activeTab]);

  useEffect(() => {
    if (activeTab === "my_tournaments") {
      setShowNew(false); // Hide NEW once user visits my_tournaments
    }
  }, [activeTab]);

  return (
    <div className="flex w-[100vw] md:w-full overflow-x-auto scrollbar-hide px-2">
      {tabs.map((tab) => {
        const isActive = activeTab === tab;
        const isMyTab = tab === "my_tournaments";
        return (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`relative flex-1 text-sm sm:text-base px-3 py-3 font-semibold border-b-2 transition-colors duration-200 whitespace-nowrap ${
              isActive
                ? "border-red-500 text-white"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            {tab.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            {isMyTab && ` (${joinedTournaments})`}

            {isMyTab && showNew && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                NEW
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

const FilterSection = ({ activeFilter, setActiveFilter, filters = [] }) => {
  return (
    <div className="flex w-[100vw] md:w-full overflow-x-auto items-center gap-2 px-4 py-2 bg-gray-900 border-t border-gray-700">
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

const Tournament = ({ tournaments, activeTab, game }) => (
  <section>
    {tournaments.length === 0 ? (
      <p className="text-gray-400 text-center">No tournaments available</p>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments
          .filter((tournament) => tournament.game === game)
          .map((tournament) => (
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
