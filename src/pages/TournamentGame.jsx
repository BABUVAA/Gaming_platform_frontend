import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { FiDownload, FiGrid, FiLayers, FiUsers } from "react-icons/fi";
import { TournamentCard } from "../components";

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
  const selectedGame = gameData[game] || null;

  const joinedTournamentsCount = (profile?.profile?.tournaments || []).filter(
    (tournament) => tournament.game === game
  ).length;

  const { name, icon, downloadLink, promoImages, filters } = selectedGame || {
    name: "",
    icon: "",
    downloadLink: "",
    promoImages: [],
    filters: [],
  };
  const gameTournaments = Object.values(tournaments).filter(
    (tournament) => tournament.game === game
  );

  const filteredTournaments = useMemo(() => {
    // Hooks stay above the "game not found" return so route-param changes do
    // not reorder hooks between renders.
    if (!selectedGame) return [];
    if (!activeFilter || activeFilter === "All") return gameTournaments;
    if (activeFilter === "Featured") {
      return gameTournaments.filter((tournament) => tournament.isFeatured);
    }

    return gameTournaments.filter(
      (tournament) =>
        tournament.mode === activeFilter ||
        tournament.map === activeFilter ||
        tournament.category === activeFilter
    );
  }, [activeFilter, gameTournaments, selectedGame]);

  const totalPages = Math.ceil(filteredTournaments.length / itemsPerPage);
  const paginatedTournaments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTournaments.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, filteredTournaments]);

  const myTournaments = (profile?.profile?.tournaments || []).filter(
    (tournament) => tournament.game === game
  );

  if (!selectedGame) {
    return (
      <div className="rounded-[32px] border border-rose-400/20 bg-rose-500/10 p-8 text-center text-rose-200">
        Game not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_24%),linear-gradient(180deg,_rgba(8,15,28,0.96),_rgba(2,6,17,0.98))] shadow-[0_24px_80px_rgba(2,8,23,0.5)]">
        <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/80">
              Game Hub
            </p>
            <div className="mt-4 flex items-center gap-4">
              <img src={icon} alt={name} className="h-14 w-14 object-contain" />
              <div>
                <h1 className="text-3xl font-black text-white md:text-4xl">{name}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
                  Explore live tournament lanes, match formats, and operator-managed events for {name}.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={downloadLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-slate-950 transition hover:bg-cyan-200"
              >
                <FiDownload />
                Download Game
              </a>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200">
                {joinedTournamentsCount} joined from this game
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {promoImages.map((image) => (
              <div
                key={image}
                className="overflow-hidden rounded-[24px] border border-white/10 bg-black/20"
              >
                <img src={image} alt={name} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-white/10 bg-slate-950/80 p-4 shadow-[0_18px_40px_rgba(2,8,23,0.35)]">
        <div className="flex flex-wrap gap-2">
          <TabButton
            active={activeTab === "tournaments"}
            onClick={() => setActiveTab("tournaments")}
            icon={<FiGrid />}
          >
            Tournaments
          </TabButton>
          <TabButton
            active={activeTab === "my_tournaments"}
            onClick={() => setActiveTab("my_tournaments")}
            icon={<FiUsers />}
          >
            My Tournaments ({joinedTournamentsCount})
          </TabButton>
          <TabButton
            active={activeTab === "teams"}
            onClick={() => setActiveTab("teams")}
            icon={<FiLayers />}
          >
            Teams
          </TabButton>
        </div>

        {(activeTab === "tournaments" || activeTab === "my_tournaments") && (
          <div className="mt-4 flex flex-wrap gap-2">
            {["All", "Featured", ...filters].map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => {
                  setActiveFilter(filter);
                  setCurrentPage(1);
                }}
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                  activeFilter === filter
                    ? "bg-cyan-300 text-slate-950"
                    : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        )}
      </section>

      {activeTab === "teams" ? (
        <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-8 text-sm leading-7 text-slate-300 shadow-[0_18px_40px_rgba(2,8,23,0.35)]">
          Team-specific tournament flows will live here once roster lock and lineup management are connected.
        </div>
      ) : (
        <>
          <TournamentGrid
            tournaments={activeTab === "my_tournaments" ? myTournaments : paginatedTournaments}
            game={game}
          />
          {activeTab === "tournaments" ? (
            <Pagination
              totalPages={totalPages}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
            />
          ) : null}
        </>
      )}
    </div>
  );
};

const TabButton = ({ active, onClick, icon, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-bold transition ${
      active
        ? "bg-cyan-300 text-slate-950"
        : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
    }`}
  >
    {icon}
    {children}
  </button>
);

const TournamentGrid = ({ tournaments, game }) => (
  <section>
    {tournaments.length > 0 ? (
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {tournaments
          .filter((tournament) => tournament.game === game)
          .map((tournament) => (
            <TournamentCard
              key={tournament._id}
              tournament={tournament}
              disableFetch
            />
          ))}
      </div>
    ) : (
      <div className="rounded-[32px] border border-dashed border-white/10 bg-slate-950/70 p-8 text-center text-sm text-slate-400">
        No tournaments available for this view yet.
      </div>
    )}
  </section>
);

const Pagination = ({ totalPages, currentPage, setCurrentPage }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {Array.from({ length: totalPages }, (_, index) => (
        <button
          key={index}
          type="button"
          onClick={() => setCurrentPage(index + 1)}
          className={`rounded-full px-4 py-2 text-sm font-bold transition ${
            currentPage === index + 1
              ? "bg-cyan-300 text-slate-950"
              : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
          }`}
        >
          {index + 1}
        </button>
      ))}
    </div>
  );
};

TabButton.propTypes = {
  active: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  icon: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired,
};

TournamentGrid.propTypes = {
  tournaments: PropTypes.arrayOf(PropTypes.object).isRequired,
  game: PropTypes.string.isRequired,
};

Pagination.propTypes = {
  totalPages: PropTypes.number.isRequired,
  currentPage: PropTypes.number.isRequired,
  setCurrentPage: PropTypes.func.isRequired,
};

export default TournamentGame;
