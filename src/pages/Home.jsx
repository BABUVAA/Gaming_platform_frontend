import {
  FaArrowRight,
  FaGamepad,
  FaPeopleGroup,
  FaShieldHalved,
  FaTrophy,
  FaWallet,
} from "react-icons/fa6";
import PropTypes from "prop-types";
import { Footer } from "../components";
import useNavigateHook from "../hooks/useNavigateHook";

const playerHighlights = [
  {
    icon: FaTrophy,
    title: "Play tournaments that matter",
    copy: "Enter Clash of Clans and BGMI events, track your match rooms, and compete for cash prize pools and platform rewards.",
    accent: "text-amber-300",
  },
  {
    icon: FaWallet,
    title: "Rewards in your wallet",
    copy: "Follow entry fees, balances, prize credits, and reward activity from one player wallet.",
    accent: "text-emerald-300",
  },
  {
    icon: FaPeopleGroup,
    title: "Rise with your clan",
    copy: "Create or join clans, bookmark squads, add friends, and build a roster you can actually compete with.",
    accent: "text-cyan-300",
  },
  {
    icon: FaShieldHalved,
    title: "Verified player identity",
    copy: "Link your game accounts so your profile, stats, and tournament entries feel trusted from the start.",
    accent: "text-sky-300",
  },
];

const playerLanes = [
  {
    title: "Cash prize tournaments",
    copy: "Enter daily formats, follow prize pools, and keep your wallet ready for the next queue.",
    image: "/pubg-banner.webp",
  },
  {
    title: "Clan-backed runs",
    copy: "Build a squad with friends, join clan rosters, and push reputation beyond solo matches.",
    image: "/clan-badge.png",
  },
  {
    title: "Verified profiles",
    copy: "Connect your game identity so tournament entries, stats, and player previews feel trustworthy.",
    image: "/coc_background.jpg",
  },
];

const rewardMoments = [
  {
    label: "Cash prize pools",
    value: "Daily events",
  },
  {
    label: "Clan reputation",
    value: "Roster wins",
  },
  {
    label: "Player progress",
    value: "Stats and ranks",
  },
];

const Home = () => {
  const { goToSignUp, goToLogin } = useNavigateHook();

  return (
    <div className="min-h-screen bg-[#111827] text-slate-100">
      <section className="relative overflow-hidden border-b border-slate-700 bg-[#182235]">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src="/Battlefield.mp4"
          autoPlay
          muted
          loop
          playsInline
          poster="/pubg-banner.webp"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,24,39,0.94),rgba(17,24,39,0.76)_48%,rgba(17,24,39,0.20)),linear-gradient(180deg,rgba(17,24,39,0.04),rgba(17,24,39,0.92))]" />

        <div className="relative mx-auto flex min-h-[calc(100svh-9rem)] max-w-7xl flex-col justify-center px-4 py-12 md:px-6 lg:py-16">
          <div className="max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-300">
              Real rewards. Real competition.
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight text-white md:text-6xl lg:text-7xl">
              Play tournaments. Build your clan. Win rewards.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-200 md:text-lg">
              Join competitive CoC and BGMI events, verify your game profile,
              team up with friends, enter match rooms, and compete for prize
              pools from one player-first platform.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={goToSignUp}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-300 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-slate-950 transition hover:bg-amber-200"
              >
                Start competing
                <FaArrowRight />
              </button>
              <button
                type="button"
                onClick={goToLogin}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-500 bg-slate-800/90 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white shadow-sm backdrop-blur transition hover:border-amber-300/60 hover:bg-slate-700"
              >
                Login
              </button>
            </div>

            <div className="mt-10 grid max-w-3xl gap-3 sm:grid-cols-3">
              {rewardMoments.map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-slate-600 bg-slate-800/85 px-4 py-3 shadow-sm backdrop-blur"
                >
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-2 text-lg font-black text-white">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-700 bg-[#182235] px-4 py-10 md:px-6">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-300">
              Choose your lane
            </p>
            <h2 className="mt-4 text-3xl font-black text-white md:text-4xl">
              Compete solo, squad up, or build a name players remember.
            </h2>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {playerLanes.map((lane) => (
              <article
                key={lane.title}
                className="overflow-hidden rounded-xl border border-slate-600 bg-slate-800 shadow-[0_14px_34px_rgba(2,8,23,0.18)]"
              >
                <div className="h-28 overflow-hidden bg-slate-700">
                  <img
                    src={lane.image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-base font-black text-white">
                    {lane.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {lane.copy}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 md:px-6">
        <div className="grid gap-5 lg:grid-cols-4">
          {playerHighlights.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="rounded-xl border border-slate-600 bg-slate-800 p-5 shadow-[0_14px_34px_rgba(2,8,23,0.16)]"
              >
                <Icon className={`text-2xl ${item.accent}`} />
                <h2 className="mt-5 text-xl font-black text-white">
                  {item.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {item.copy}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-slate-700 bg-[#1b2a3d]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 md:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-300">
              Player hub
            </p>
            <h2 className="mt-4 text-3xl font-black text-white md:text-5xl">
              Your profile becomes your competitive identity.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Every tournament, friend, clan, match room, wallet movement, and
              reward history should make your account feel more valuable over
              time.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <PlayerBenefit
              title="Public player profile"
              copy="Show linked games, clan status, friends, and competition progress."
            />
            <PlayerBenefit
              title="Fast match room access"
              copy="See room details, check in, submit scores, and follow match status."
            />
            <PlayerBenefit
              title="Clan and squad play"
              copy="Move from solo participation into proper rosters and team formats."
            />
            <PlayerBenefit
              title="Reward tracking"
              copy="Keep your prize and wallet journey visible as your performance grows."
            />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-14 md:px-6 lg:grid-cols-3">
        <Showcase
          image="/pubg-banner.webp"
          icon={FaGamepad}
          title="BGMI custom competition"
          copy="Enter solo, duo, or squad formats and move through a clear room and result flow."
        />
        <Showcase
          image="/coc_background.jpg"
          icon={FaShieldHalved}
          title="Clash of Clans identity"
          copy="Connect verified accounts and carry your trusted player profile into events."
        />
        <Showcase
          image="/clan_chat.png"
          icon={FaPeopleGroup}
          title="Friends, clans, squads"
          copy="Build your circle, preview player stats, and keep the team ready for the next event."
        />
      </section>

      <section className="border-t border-slate-700 bg-[#182235] px-4 py-12 md:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3 text-amber-300">
              <FaTrophy />
              <p className="text-xs font-bold uppercase tracking-[0.24em]">
                Start your run
              </p>
            </div>
            <h2 className="mt-3 text-2xl font-black text-white md:text-4xl">
              Create your profile and enter the next tournament.
            </h2>
          </div>
          <button
            type="button"
            onClick={goToSignUp}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300/50 bg-amber-300/10 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-amber-200 transition hover:bg-amber-300 hover:text-slate-950"
          >
            Join now
            <FaArrowRight />
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

const PlayerBenefit = ({ title, copy }) => (
  <article className="rounded-xl border border-slate-600 bg-slate-800 p-4 shadow-[0_12px_30px_rgba(2,8,23,0.16)]">
    <h3 className="text-lg font-black text-white">{title}</h3>
    <p className="mt-3 text-sm leading-7 text-slate-300">{copy}</p>
  </article>
);

const Showcase = ({ image, icon: Icon, title, copy }) => (
  <article className="overflow-hidden rounded-xl border border-slate-600 bg-slate-800 shadow-[0_14px_34px_rgba(2,8,23,0.18)]">
    <div className="aspect-[16/9] overflow-hidden bg-slate-700">
      <img src={image} alt="" className="h-full w-full object-cover" />
    </div>
    <div className="p-5">
      <Icon className="text-xl text-cyan-300" />
      <h3 className="mt-4 text-xl font-black text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-300">{copy}</p>
    </div>
  </article>
);

PlayerBenefit.propTypes = {
  title: PropTypes.string.isRequired,
  copy: PropTypes.string.isRequired,
};

Showcase.propTypes = {
  image: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  copy: PropTypes.string.isRequired,
};

export default Home;
