import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FaArrowRight,
  FaBolt,
  FaClock,
  FaShieldAlt,
  FaSitemap,
  FaTrophy,
  FaWallet,
} from "react-icons/fa";

const Game = () => {
  const profile = useSelector((store) => store.auth?.profile);
  const tournamentMap = useSelector((store) => store.tournament?.tournaments);
  const wallet = useSelector((store) => store.payment?.wallet);
  const tournaments = useMemo(
    () => Object.values(tournamentMap || {}),
    [tournamentMap]
  );

  const connectedGames = profile?.profile?.games || [];
  const joinedTournaments = profile?.profile?.tournaments || [];
  const readinessItems = [
    {
      label: "Verified Game Links",
      value: connectedGames.filter(
        (game) => game.verificationStatus === "verified"
      ).length,
      accent: "text-cyan-300",
    },
    {
      label: "Joined Tournaments",
      value: joinedTournaments.length,
      accent: "text-amber-300",
    },
    {
      label: "Wallet Balance",
      value: `Rs ${wallet?.realMoney || 0}`,
      accent: "text-emerald-300",
    },
  ];

  const featuredTournaments = tournaments.slice(0, 3);

  const actionCards = [
    {
      title: "Verify Accounts",
      copy: "Connect CoC instantly and send BGMI identities into manual review.",
      to: "/dashboard/account",
      icon: <FaShieldAlt />,
      accent:
        "bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.24),_transparent_38%),linear-gradient(135deg,_#0f172a,_#020617)]",
    },
    {
      title: "Join Tournaments",
      copy: "Jump into live formats, custom lobbies, and quick team battles.",
      to: "/dashboard/tournament",
      icon: <FaTrophy />,
      accent:
        "bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.22),_transparent_38%),linear-gradient(135deg,_#1f2937,_#020617)]",
    },
    {
      title: "Manage Clans",
      copy: "Shape rosters, social links, and team coordination from one place.",
      to: "/dashboard/clan",
      icon: <FaSitemap />,
      accent:
        "bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.22),_transparent_38%),linear-gradient(135deg,_#0f172a,_#020617)]",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-cyan-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.22),_transparent_32%),linear-gradient(135deg,_#0a1426,_#030712_50%,_#111827)] p-6 shadow-[0_26px_70px_rgba(2,8,23,0.55)] md:p-8">
        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-cyan-300/80">
              Competition Command
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-white md:text-6xl">
              Build lineups, lock accounts, and move players into live matches.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
              The platform is now moving toward a proper esports control room:
              verified player identities, tournament flow, operator review, and
              match-state driven UX.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/dashboard/tournament"
                className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
              >
                Open Tournaments
                <FaArrowRight />
              </Link>
              <Link
                to="/dashboard/account"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950/40 px-5 py-3 text-sm font-bold text-slate-100 transition hover:border-slate-500"
              >
                Account Readiness
              </Link>
            </div>
          </div>

          <div className="grid gap-3">
            {readinessItems.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/10 bg-black/20 px-5 py-5 backdrop-blur"
              >
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                  {item.label}
                </p>
                <p className={`mt-3 text-3xl font-black ${item.accent}`}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {actionCards.map((card) => (
          <Link
            key={card.title}
            to={card.to}
            className={`rounded-3xl border border-slate-800 p-5 shadow-[0_18px_50px_rgba(2,8,23,0.45)] transition hover:-translate-y-1 hover:border-slate-700 ${card.accent}`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/25 text-cyan-200">
              {card.icon}
            </div>
            <h2 className="mt-5 text-2xl font-black text-white">
              {card.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {card.copy}
            </p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-cyan-200">
              Enter area
              <FaArrowRight />
            </span>
          </Link>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5 shadow-[0_18px_50px_rgba(2,8,23,0.45)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                Live Formats
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                Tournament Snapshot
              </h2>
            </div>
            <Link
              to="/dashboard/tournament"
              className="text-sm font-semibold text-cyan-200"
            >
              View all
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {featuredTournaments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-400">
                No tournaments are loaded yet. Once data arrives, this area
                becomes the player’s live event radar.
              </div>
            ) : (
              featuredTournaments.map((tournament) => (
                <article
                  key={tournament._id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        {tournament.game} • {tournament.mode}
                      </p>
                      <h3 className="mt-1 text-lg font-bold text-white">
                        {tournament.tournamentName}
                      </h3>
                    </div>
                    <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                      {tournament.status}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-400">
                    <span className="inline-flex items-center gap-2">
                      <FaBolt className="text-cyan-300" />
                      Entry Rs {tournament.entryFee || 0}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <FaClock className="text-cyan-300" />
                      Prize Rs {tournament.prizePool || 0}
                    </span>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5 shadow-[0_18px_50px_rgba(2,8,23,0.45)]">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
              What Changed
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              UI-First Upgrade Path
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              We are using the UI refresh to define product boundaries first:
              account verification, competition flow, roster control, and later
              match rooms plus operator actions.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5 shadow-[0_18px_50px_rgba(2,8,23,0.45)]">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
              Next Build Slice
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              Operator Console
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              The next screen to add is the staff review surface for manual
              verification requests, followed by the first proper match room.
            </p>
            <Link
              to="/dashboard/account"
              className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-cyan-200"
            >
              Open account command
              <FaArrowRight />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Game;
