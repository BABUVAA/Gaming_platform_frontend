import { useSelector } from "react-redux";
import { FaArrowRight, FaBolt, FaShieldAlt, FaTrophy } from "react-icons/fa";
import { Footer, GameCard } from "../components";
import useNavigateHook from "../hooks/useNavigateHook";

const Home = () => {
  const { goToSignUp, goToLogin } = useNavigateHook();
  const games = useSelector((store) => store.games?.data);
  const availableGames = games || [];

  return (
    <div className="min-h-screen bg-[#020611] text-slate-100">
      <section className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(251,191,36,0.14),_transparent_24%),linear-gradient(135deg,_#050b14,_#020611_55%,_#0f172a)]" />
        <div className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl gap-10 px-4 py-14 md:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.34em] text-cyan-300/80">
              Real-Time Esports Platform
            </p>
            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-white md:text-7xl">
              Tournaments, clans, wallets, and match control built for live
              competition.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
              Enter quick 5v5 CoC battles, queue for custom BGMI formats, link
              your verified game identities, and move into operator-managed
              match flow without leaving the platform.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={goToSignUp}
                className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
              >
                Start Competing
                <FaArrowRight />
              </button>
              <button
                onClick={goToLogin}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950/40 px-5 py-3 text-sm font-bold text-slate-100 transition hover:border-slate-500"
              >
                Open Platform
              </button>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              <MetricCard icon={<FaTrophy />} label="Tournament Engine" value="Daily and custom formats" />
              <MetricCard icon={<FaShieldAlt />} label="Account Trust" value="CoC instant, BGMI review" />
              <MetricCard icon={<FaBolt />} label="Match Operations" value="Operator-assisted flow" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {availableGames.slice(0, 4).map((game) => (
              <GameCard
                key={game._id}
                character={game.character}
                title={game.title}
                link={`/dashboard/tournament/${game.link}`}
                background={game.background}
                div_color={game.div_color}
                type="games"
              />
            ))}
            {availableGames.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-950/50 p-8 text-sm text-slate-400">
                Game discovery loads here once the backend feed is available.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <FeatureBand
            title="Verified identity before queue entry"
            copy="Clash of Clans accounts can be linked through token verification, while BGMI accounts move through an operator review lane."
          />
          <FeatureBand
            title="Clan-driven competition"
            copy="Create lineups, coordinate social and competitive groups, and grow into larger tournament formats with a proper roster flow."
          />
          <FeatureBand
            title="Wallet and settlement controls"
            copy="Support deposits, entry fees, prizes, and later match-linked settlement states inside one competitive economy."
          />
        </div>
      </section>

      <Footer />
    </div>
  );
};

const MetricCard = ({ icon, label, value }) => (
  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 backdrop-blur">
    <div className="flex items-center gap-2 text-cyan-300">
      {icon}
      <span className="text-xs uppercase tracking-[0.22em]">{label}</span>
    </div>
    <p className="mt-3 text-lg font-bold text-white">{value}</p>
  </div>
);

const FeatureBand = ({ title, copy }) => (
  <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-[0_18px_50px_rgba(2,8,23,0.45)]">
    <h2 className="text-2xl font-black text-white">{title}</h2>
    <p className="mt-4 text-sm leading-7 text-slate-300">{copy}</p>
  </div>
);

export default Home;
