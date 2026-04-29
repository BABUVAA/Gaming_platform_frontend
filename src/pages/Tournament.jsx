import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import TournamentCard from "../components/ui/GameCard/TournamentCard";

const TournamentPage = () => {
  const { tournaments = {} } = useSelector((state) => state.tournament);
  const { profile } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("tournaments");
  const [activeFilter, setActiveFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const filters = ["coc", "bgmi", "solo", "5v5", "squad", "Featured"];

  const filteredTournaments = useMemo(() => {
    const tournamentList = Object.values(tournaments);
    if (!activeFilter || activeFilter === "All") return tournamentList;
    if (activeFilter === "Featured") {
      return tournamentList.filter((tournament) => tournament.isFeatured);
    }

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

  const myTournaments = profile?.profile?.tournaments || [];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-amber-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.16),_transparent_30%),linear-gradient(135deg,_#0f172a,_#020617)] p-6 shadow-[0_24px_60px_rgba(2,8,23,0.5)]">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-300/80">
          Tournament Control
        </p>
        <h1 className="mt-3 text-4xl font-black text-white md:text-5xl">
          Browse live formats, join verified queues, and track your event load.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          This area is now tuned for faster scanning: format filters, event
          count, and a proper split between all tournaments and your active
          commitments.
        </p>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5 shadow-[0_18px_50px_rgba(2,8,23,0.45)]">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-800 pb-4">
          {[
            { key: "tournaments", label: "Tournament Feed" },
            { key: "my_tournaments", label: `My Queue (${myTournaments.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setCurrentPage(1);
              }}
              className={`rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-[0.16em] transition ${
                activeTab === tab.key
                  ? "bg-cyan-400/14 text-cyan-200"
                  : "text-slate-500 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "tournaments" && (
          <div className="mt-5 flex flex-wrap gap-2">
            {["All", ...filters].map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setActiveFilter(filter);
                  setCurrentPage(1);
                }}
                className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                  activeFilter === filter
                    ? "border-cyan-400/30 bg-cyan-400/12 text-cyan-200"
                    : "border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        )}

        <div className="mt-6">
          {activeTab === "tournaments" ? (
            <>
              <TournamentGrid tournaments={paginatedTournaments} activeTab={activeTab} />
              <Pagination
                totalPages={totalPages}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
              />
            </>
          ) : (
            <TournamentGrid tournaments={myTournaments} activeTab={activeTab} />
          )}
        </div>
      </section>
    </div>
  );
};

const TournamentGrid = ({ tournaments, activeTab }) => {
  if (!tournaments || tournaments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/60 p-6 text-center text-sm text-slate-400">
        No tournaments available for this view yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {tournaments.map((tournament) => (
        <TournamentCard
          key={tournament._id}
          tournament={tournament}
          disableFetch={activeTab === "tournaments"}
        />
      ))}
    </div>
  );
};

const Pagination = ({ totalPages, currentPage, setCurrentPage }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-6 flex justify-center gap-2">
      {Array.from({ length: totalPages }, (_, index) => (
        <button
          key={index}
          onClick={() => setCurrentPage(index + 1)}
          className={`h-10 w-10 rounded-full text-sm font-semibold transition ${
            currentPage === index + 1
              ? "bg-cyan-300 text-slate-950"
              : "bg-slate-900 text-slate-300 hover:bg-slate-800"
          }`}
        >
          {index + 1}
        </button>
      ))}
    </div>
  );
};

export default TournamentPage;
