import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTournaments } from "../store/tournamentSlice";
import TournamentCard from "../components/ui/GameCard/TournamentCard";
import GameSlider from "../components/ui/GameSlider/GameSlider";

const TABS = [
  { key: "featured_open", label: "🔥 Featured" },
  { key: "featured_live", label: "🟢 Ongoing" },
  { key: "all", label: "📋 All" },
  { key: "coc", label: "🏰 Clash of Clans" },
  { key: "bgmi", label: "🔫 PUBG" },
];

const TournamentPage = () => {
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState("featured_open");
  const [filters, setFilters] = useState({
    prizePool: "",
    entryFee: "",
    slots: "",
    mode: "",
    teamSize: "",
  });

  useEffect(() => {
    dispatch(fetchTournaments());
  }, [dispatch]);

  const { tournaments = {} } = useSelector((state) => state.tournament);
  const tournamentList = Object.values(tournaments); // 🔥 Convert object to array

  const filteredTournaments = applyFilters(
    getTournamentsByTab(tournamentList, activeTab),
    filters
  );

  const groupedByGame = groupByGame(filteredTournaments);

  return (
    <>
      <HeroSection />
      <div className="bg-black text-white min-h-screen px-4 md:px-8 py-10">
        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-4 justify-center mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`px-4 py-2 rounded-lg transition-all font-semibold ${
                activeTab === tab.key
                  ? "bg-indigo-600"
                  : "bg-gray-800 hover:bg-gray-700"
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <FilterBar filters={filters} setFilters={setFilters} />

        {/* Tournament Sections */}
        {Object.entries(groupedByGame).length === 0 ? (
          <p className="text-center text-gray-400 mt-10">
            No tournaments found.
          </p>
        ) : (
          Object.entries(groupedByGame).map(([game, gameTournaments]) => (
            <div key={game} className="mb-12">
              <h2 className="text-2xl font-bold mb-4">{game}</h2>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {gameTournaments.map((t) => (
                  <TournamentCard key={t._id} tournament={t} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
};

// Filter Component
const FilterBar = ({ filters, setFilters }) => {
  return (
    <div className="flex flex-wrap gap-4 justify-center mb-8">
      <SelectFilter
        label="Prize Pool"
        options={["low", "mid", "high"]}
        value={filters.prizePool}
        onChange={(val) => setFilters((f) => ({ ...f, prizePool: val }))}
      />
      <SelectFilter
        label="Entry Fee"
        options={["free", "paid"]}
        value={filters.entryFee}
        onChange={(val) => setFilters((f) => ({ ...f, entryFee: val }))}
      />
      <SelectFilter
        label="Slots"
        options={["available", "full"]}
        value={filters.slots}
        onChange={(val) => setFilters((f) => ({ ...f, slots: val }))}
      />
      <SelectFilter
        label="Mode"
        options={["solo", "duo", "squad", "5v5", "10v10"]}
        value={filters.mode}
        onChange={(val) => setFilters((f) => ({ ...f, mode: val }))}
      />
      <SelectFilter
        label="Team Size"
        options={["1", "2", "4", "5", "10"]}
        value={filters.teamSize}
        onChange={(val) => setFilters((f) => ({ ...f, teamSize: val }))}
      />
    </div>
  );
};

// Reusable Select Filter
const SelectFilter = ({ label, options, value, onChange }) => (
  <select
    className="bg-gray-800 text-white px-4 py-2 rounded"
    value={value}
    onChange={(e) => onChange(e.target.value)}
  >
    <option value="">{label}</option>
    {options.map((opt) => (
      <option key={opt} value={opt}>
        {opt.charAt(0).toUpperCase() + opt.slice(1)}
      </option>
    ))}
  </select>
);

// Filter Logic
const applyFilters = (tournaments, filters) => {
  return tournaments.filter((t) => {
    if (filters.prizePool === "low" && t.prizePool >= 500) return false;
    if (
      filters.prizePool === "mid" &&
      (t.prizePool < 500 || t.prizePool > 5000)
    )
      return false;
    if (filters.prizePool === "high" && t.prizePool <= 5000) return false;

    if (filters.entryFee === "free" && t.entryFee > 0) return false;
    if (filters.entryFee === "paid" && t.entryFee === 0) return false;

    if (filters.slots === "available" && t.maxParticipants <= 0) return false;
    if (filters.slots === "full" && t.maxParticipants > 0) return false;

    if (filters.mode && t.mode !== filters.mode) return false;
    if (filters.teamSize && t.teamSize !== parseInt(filters.teamSize))
      return false;

    return true;
  });
};

// Tab-specific Tournament Logic
const getTournamentsByTab = (tournaments, tab) => {
  switch (tab) {
    case "featured_open":
      return tournaments.filter(
        (t) => t.isFeatured && t.status === "registration_open"
      );
    case "featured_live":
      return tournaments.filter(
        (t) => t.isFeatured && ["active", "ongoing"].includes(t.status)
      );
    case "coc":
      return tournaments.filter((t) => t.game === "coc");
    case "bgmi":
      return tournaments.filter((t) => t.game === "bgmi");
    case "all":
    default:
      return tournaments;
  }
};

// Grouping Logic
const groupByGame = (tournaments) => {
  return tournaments.reduce((acc, t) => {
    const gameName = t.game?.toUpperCase() || "Other";
    if (!acc[gameName]) acc[gameName] = [];
    acc[gameName].push(t);
    return acc;
  }, {});
};

export default TournamentPage;

const HeroSection = () => {
  const games = useSelector((state) => state.games?.data || []);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (games.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % games.length);
      }, 3500); // Change slide every 3.5 sec
      return () => clearInterval(interval);
    }
  }, [games]);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative w-full bg-gradient-to-b from-indigo-900 via-black to-black text-white py-24 px-6 flex flex-col items-center text-center overflow-hidden">
      {/* Overlay gradient for contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/90 pointer-events-none"></div>

      {/* Title */}
      <h1 className="z-10 text-5xl md:text-6xl font-extrabold max-w-4xl leading-tight">
        Compete. Win. <span className="text-indigo-400">Conquer.</span>
      </h1>

      {/* Subtitle */}
      <p className="z-10 mt-5 text-lg md:text-xl max-w-2xl opacity-90">
        Join the most competitive gaming tournaments and prove your skills
        across your favorite games!
      </p>

      {/* Action Buttons */}
      <div className="z-10 mt-8 flex flex-wrap gap-5 justify-center w-full max-w-md">
        <button
          onClick={() => scrollToSection("featured-tournaments")}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 transition rounded-lg py-3 font-semibold shadow-lg transform hover:scale-105"
        >
          Join Tournament
        </button>
        <button
          onClick={() => scrollToSection("quick-join")}
          className="flex-1 bg-gray-800 hover:bg-gray-700 transition rounded-lg py-3 font-semibold shadow-lg transform hover:scale-105"
        >
          Quick Join
        </button>
      </div>

      {/* Game Slider Container */}
      <div className="z-10 mt-16 w-full max-w-5xl">
        <GameSlider currentIndex={currentIndex} />
      </div>
    </section>
  );
};
