import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { FaArrowRight, FaClock, FaHeadset, FaShieldAlt } from "react-icons/fa";
import api from "../api/axios-api";
import { showToast, types } from "../store/toastSlice";

const STATUS_STYLE = {
  scheduled: "bg-slate-800 text-slate-200",
  check_in: "bg-amber-100 text-amber-800",
  lobby_ready: "bg-sky-100 text-sky-800",
  live: "bg-emerald-100 text-emerald-800",
  result_pending: "bg-orange-100 text-orange-800",
  verified: "bg-cyan-100 text-cyan-800",
  settled: "bg-violet-100 text-violet-800",
  disputed: "bg-rose-100 text-rose-800",
};

const Matches = () => {
  const dispatch = useDispatch();
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMatches = async () => {
      setIsLoading(true);
      try {
        const response = await api.get("/api/matches");
        setMatches(response.data?.data || []);
      } catch (error) {
        dispatch(
          showToast({
            message:
              error.response?.data?.message || "Unable to load match feed.",
            type: types.DANGER,
            position: "bottom-right",
          })
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadMatches();
  }, [dispatch]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-sky-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_30%),linear-gradient(135deg,_#0f172a,_#020617)] p-6 shadow-[0_24px_60px_rgba(2,8,23,0.5)]">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-300/80">
          Match Operations
        </p>
        <h1 className="mt-3 text-4xl font-black text-white md:text-5xl">
          Follow room state, operator support, and result flow.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
          This is the first pass of the match area. It is wired to the new
          backend match scaffold, and it sets up the UI surface where check-in,
          lobby credentials, dispute handling, and result verification will
          live.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5 shadow-[0_18px_50px_rgba(2,8,23,0.45)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Match Feed
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                Your Active Timeline
              </h2>
            </div>
            <Link
              to="/dashboard/tournament"
              className="text-sm font-semibold text-sky-200"
            >
              Join more events
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {matches.length === 0 && !isLoading ? (
              <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-400">
                No matches are assigned yet. Once tournaments begin creating
                real match instances, this feed becomes the player’s live
                operation rail.
              </div>
            ) : (
              matches.map((match) => (
                <article
                  key={match._id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        {match.game} • {match.mode}
                      </p>
                      <h3 className="mt-1 text-lg font-bold text-white">
                        {match.title}
                      </h3>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                        STATUS_STYLE[match.status] ||
                        "bg-slate-800 text-slate-200"
                      }`}
                    >
                      {match.status}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-400">
                    <span className="inline-flex items-center gap-2">
                      <FaClock className="text-sky-300" />
                      {match.scheduledFor
                        ? new Date(match.scheduledFor).toLocaleString()
                        : "Schedule pending"}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <FaHeadset className="text-sky-300" />
                      {match.assignedOperator?.profile?.username ||
                        "Operator not assigned"}
                    </span>
                  </div>
                </article>
              ))
            )}

            {isLoading && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-400">
                Loading match feed...
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5 shadow-[0_18px_50px_rgba(2,8,23,0.45)]">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Next Upgrade
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              Match Room UI
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              The next layer here is per-match detail: lobby credentials,
              participant status, result submission, proof upload, and dispute
              entry.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5 shadow-[0_18px_50px_rgba(2,8,23,0.45)]">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Integrity
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              Verification Matters
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Match trust starts with linked identities. That is why account
              verification, operator review, and room state all have to live in
              the same product system.
            </p>
            <Link
              to="/dashboard/account"
              className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-sky-200"
            >
              Review account status
              <FaArrowRight />
            </Link>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5 shadow-[0_18px_50px_rgba(2,8,23,0.45)]">
            <div className="flex items-center gap-3 text-sky-200">
              <FaShieldAlt />
              <p className="text-sm font-semibold uppercase tracking-[0.18em]">
                Lifecycle States
              </p>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              `scheduled`, `check_in`, `lobby_ready`, `live`, `result_pending`,
              `verified`, `settled`, `disputed`
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Matches;
