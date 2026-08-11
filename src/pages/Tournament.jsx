import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import QuickMatchCard from "../components/ui/GameCard/QuickMatchCard";
import { fetchPlayerQuickMatchOfferings } from "../store/slices/quickMatchOfferingSlice";
import {
  selectPlayerQuickMatchError,
  selectPlayerQuickMatchOfferings,
  selectPlayerQuickMatchStatus,
} from "../store/selectors/quickMatchOfferingSelectors";
import { selectPlayerSummary } from "../store/selectors/playerSelectors";
import { hasApprovedHostAccess } from "../utils/accessControl";
import { ROUTES } from "../routes/routeConstants";

const TournamentPage = () => {
  const dispatch = useDispatch();
  const offerings = useSelector(selectPlayerQuickMatchOfferings);
  const status = useSelector(selectPlayerQuickMatchStatus);
  const error = useSelector(selectPlayerQuickMatchError);
  const playerSummary = useSelector(selectPlayerSummary);
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    const request = dispatch(fetchPlayerQuickMatchOfferings());
    return () => request.abort();
  }, [dispatch]);

  const filters = useMemo(
    () => [
      "All",
      ...new Set(
        offerings.flatMap((offering) =>
          [offering.gameKey, offering.mode, offering.map].filter(Boolean),
        ),
      ),
    ],
    [offerings],
  );

  const filteredOfferings = useMemo(() => {
    if (activeFilter === "All") return offerings;
    return offerings.filter((offering) =>
      [offering.gameKey, offering.mode, offering.map].includes(activeFilter),
    );
  }, [activeFilter, offerings]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-amber-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.16),_transparent_30%),linear-gradient(135deg,_#0f172a,_#020617)] p-6 shadow-[0_24px_60px_rgba(2,8,23,0.5)]">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-300/80">
          Tournaments
        </p>
        <h1 className="mt-3 text-4xl font-black text-white md:text-5xl">
          Choose a live Quick Match format.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          Every card comes from the active Game catalog and shows its fixed seats,
          team format, entry rule, prize disclosure, schedule, and your current
          eligibility.
        </p>
        {hasApprovedHostAccess(playerSummary) ? (
          <Link className="mt-5 inline-flex rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-2.5 text-sm font-black text-cyan-100 hover:bg-cyan-300/15" to={ROUTES.HOST_TOURNAMENT_PROPOSAL}>
            Propose tournament
          </Link>
        ) : null}
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5 shadow-[0_18px_50px_rgba(2,8,23,0.45)]">
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
          {filters.map((filter) => (
            <button
              className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                activeFilter === filter
                  ? "border-cyan-400/30 bg-cyan-400/12 text-cyan-200"
                  : "border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200"
              }`}
              key={filter}
              onClick={() => setActiveFilter(filter)}
              type="button"
            >
              {filter}
            </button>
          ))}
        </div>

        {status === "loading" && offerings.length === 0 && (
          <p className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
            Loading active tournaments...
          </p>
        )}
        {status === "failed" && (
          <div className="mt-6 rounded-2xl border border-rose-400/30 bg-rose-400/10 p-5">
            <p className="text-sm text-rose-100">{error}</p>
            <button
              className="mt-3 rounded-xl bg-rose-100 px-4 py-2 text-sm font-black text-rose-950"
              onClick={() => dispatch(fetchPlayerQuickMatchOfferings())}
              type="button"
            >
              Retry
            </button>
          </div>
        )}
        {status === "succeeded" && filteredOfferings.length === 0 && (
          <p className="mt-6 rounded-2xl border border-dashed border-slate-800 bg-slate-900/60 p-6 text-center text-sm text-slate-400">
            No active tournaments match this filter.
          </p>
        )}
        {filteredOfferings.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filteredOfferings.map((offering) => (
              <QuickMatchCard key={offering._id} offering={offering} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default TournamentPage;
