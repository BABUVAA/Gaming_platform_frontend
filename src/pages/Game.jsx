import { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import {
  FaArrowRight,
  FaCalendarAlt,
  FaClock,
  FaFire,
  FaGamepad,
  FaUsers,
} from "react-icons/fa";
import {
  buildTournamentOfferingPath,
  ROUTES,
} from "../routes/routeConstants";
import {
  selectIsStaffUtilityMode,
  selectPlayerSummary,
} from "../store/selectors/playerSelectors";
import {
  selectTournamentList,
  selectTournamentListStatus,
} from "../store/selectors/tournamentSelectors";
import {
  gameFilterOptions,
  getGameKey,
  getGamePresentation,
} from "../config/gamePresentation";

const statusLabels = {
  active: "Live now",
  ongoing: "Live now",
  registration_open: "Open to join",
  upcoming: "Coming soon",
  completed: "Completed",
  cancelled: "Cancelled",
};

// One shared shape documents the tournament fields consumed by every feed
// card and prevents each presentation component from drifting independently.
const tournamentShape = PropTypes.shape({
  _id: PropTypes.string.isRequired,
  tournamentName: PropTypes.string.isRequired,
  game: PropTypes.string.isRequired,
  mode: PropTypes.string.isRequired,
  status: PropTypes.string,
  startDate: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Date),
  ]),
  maxParticipants: PropTypes.number,
  registeredPlayers: PropTypes.arrayOf(PropTypes.object),
  registeredTeams: PropTypes.arrayOf(PropTypes.object),
  prizePool: PropTypes.number,
  entryFee: PropTypes.number,
  isFeatured: PropTypes.bool,
});

const getTournamentStatus = (status) =>
  statusLabels[status] || status?.replaceAll("_", " ") || "Event";

const getTournamentDate = (date) => {
  if (!date) return "Date coming soon";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "Date coming soon";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsedDate);
};

const getJoinedCount = (tournament) => {
  // Team events count registered teams, while solo events count players.
  const participants =
    tournament.mode === "solo"
      ? tournament.registeredPlayers
      : tournament.registeredTeams;

  return Array.isArray(participants) ? participants.length : 0;
};

const getFilledPercentage = (tournament) => {
  const maximum = Number(tournament.maxParticipants);
  if (!Number.isFinite(maximum) || maximum <= 0) return 0;

  return Math.min(100, (getJoinedCount(tournament) / maximum) * 100);
};

const rankTournament = (tournament) => {
  // Events players can enter or watch now appear before distant competitions.
  if (tournament.status === "registration_open") return 0;
  if (["active", "ongoing"].includes(tournament.status)) return 1;
  if (tournament.status === "upcoming") return 2;
  return 3;
};

const Game = () => {
  const [activeGame, setActiveGame] = useState("all");
  const playerSummary = useSelector(selectPlayerSummary);
  const isStaffUtilityMode = useSelector(selectIsStaffUtilityMode);
  const tournaments = useSelector(selectTournamentList);
  const tournamentsStatus = useSelector(selectTournamentListStatus);

  const filteredTournaments = tournaments
    .filter(
      (tournament) =>
        activeGame === "all" ||
        getGameKey(tournament.game) === activeGame,
    )
    .sort((first, second) => {
      // Featured status breaks equal-priority ties without hiding open events.
      const statusDifference =
        rankTournament(first) - rankTournament(second);
      if (statusDifference !== 0) return statusDifference;
      return Number(Boolean(second.isFeatured)) - Number(Boolean(first.isFeatured));
    });

  const spotlight = filteredTournaments[0] || null;
  const competitionFeed = filteredTournaments.slice(1, 5);
  const username = playerSummary?.username || "Player";

  return (
    <div className="space-y-7 pb-8 text-slate-100">
      {/* The page header only needs the player's display name. Competition and
          account domains remain independent below this layout boundary. */}
      <section className="flex flex-col gap-5 rounded-[28px] border border-slate-700 bg-slate-800/90 p-5 shadow-[0_20px_55px_rgba(2,8,23,0.22)] backdrop-blur md:flex-row md:items-center md:justify-between md:p-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
            <FaGamepad />
            {isStaffUtilityMode ? "Staff catalog view" : "Compete"}
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white md:text-4xl">
            {isStaffUtilityMode ? `Player-facing catalog for ${username}` : `Ready, ${username}?`}
          </h1>
        </div>

        <div className="flex gap-2">
          <Link
            to={ROUTES.MATCHES}
            className="rounded-xl border border-slate-600 bg-slate-700 px-4 py-3 text-xs font-black text-slate-100 transition hover:border-slate-500 hover:bg-slate-600"
          >
            {isStaffUtilityMode ? "Match history" : "My matches"}
          </Link>
          <Link
            to={ROUTES.TOURNAMENT}
            aria-label="View all tournaments"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-300 text-slate-950 transition hover:bg-amber-200"
          >
            <FaArrowRight />
          </Link>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-700 bg-slate-800/55 p-4 shadow-[0_18px_45px_rgba(2,8,23,0.16)] md:p-5">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">
              Game lobby
            </p>
            <h2 className="mt-1 text-xl font-black text-white">
              Choose your game
            </h2>
          </div>
          {tournaments.some((event) =>
            ["active", "ongoing"].includes(event.status),
          ) ? (
            <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-rose-600">
              <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
              Live now
            </span>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {gameFilterOptions.map((filter) => {
            // Counts help players choose an active game before opening a card.
            const eventCount =
              filter.key === "all"
                ? tournaments.length
                : tournaments.filter(
                    (tournament) =>
                      getGameKey(tournament.game) === filter.key,
                  ).length;

            return (
              <GameFilterCard
              key={filter.key}
                filter={filter}
                eventCount={eventCount}
                isActive={activeGame === filter.key}
                onSelect={() => setActiveGame(filter.key)}
              />
            );
          })}
        </div>
      </section>

      {spotlight ? (
        <SpotlightTournament tournament={spotlight} />
      ) : (
        <CompetitionEmptyState isLoading={tournamentsStatus === "loading"} />
      )}

      {competitionFeed.length > 0 ? (
        <section>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white">
                More tournaments
              </h2>
            </div>
            <Link
              to={ROUTES.TOURNAMENT}
              className="hidden items-center gap-2 text-sm font-bold text-cyan-300 sm:inline-flex"
            >
              View all
              <FaArrowRight />
            </Link>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {competitionFeed.map((tournament) => (
              <CompetitionCard
                key={tournament._id}
                tournament={tournament}
              />
            ))}
          </div>
        </section>
      ) : null}

    </div>
  );
};

const GameFilterCard = ({ eventCount, filter, isActive, onSelect }) => (
  <button
    type="button"
    aria-pressed={isActive}
    onClick={onSelect}
    className={`group relative h-36 overflow-hidden rounded-[22px] border text-left transition duration-300 md:h-44 ${
      isActive
        ? "-translate-y-1 border-cyan-300 shadow-[0_18px_40px_rgba(34,211,238,0.18)] ring-2 ring-cyan-300/20"
        : "border-slate-600 shadow-[0_14px_30px_rgba(2,8,23,0.18)] hover:-translate-y-1 hover:border-slate-400"
    }`}
  >
    {filter.images ? (
      <span className="absolute inset-0 grid grid-cols-2">
        {filter.images.map((image) => (
          <img
            key={image}
            src={image}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ))}
      </span>
    ) : (
      <img
        src={filter.image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[68%_center] transition duration-500 group-hover:scale-105"
      />
    )}

    <span className="absolute inset-0 bg-[linear-gradient(0deg,rgba(15,23,42,0.96),rgba(15,23,42,0.22)_68%,rgba(15,23,42,0.08))]" />
    <span className="absolute left-3 top-3 rounded-full border border-white/20 bg-slate-900/70 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-white backdrop-blur">
      {eventCount} {eventCount === 1 ? "event" : "events"}
    </span>
    {isActive ? (
      <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-cyan-300 text-xs font-black text-slate-950 shadow-lg">
        ✓
      </span>
    ) : null}

    <span className="absolute inset-x-4 bottom-4">
      <span className="block text-base font-black text-white md:text-lg">
        {filter.label}
      </span>
      <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300">
        {filter.description}
      </span>
    </span>
  </button>
);

const SpotlightTournament = ({ tournament }) => {
  const joinedCount = getJoinedCount(tournament);
  const filledPercentage = getFilledPercentage(tournament);

  return (
    <section className="group relative grid overflow-hidden rounded-[34px] border border-slate-700 bg-slate-800 shadow-[0_28px_70px_rgba(2,8,23,0.28)] lg:grid-cols-[0.9fr_1.1fr]">
      {/* The featured event uses a true light split layout. Text no longer
          depends on a dark image overlay, so artwork and details stay clear. */}
      <div className="flex flex-col justify-between p-5 md:p-8">
        <div>
          <div className="flex items-start justify-between gap-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-950">
              <FaFire />
              Featured
            </span>
            <span className="rounded-full border border-cyan-400/30 bg-cyan-400/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">
              {getTournamentStatus(tournament.status)}
            </span>
          </div>

          <p className="mt-10 text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
            {tournament.game} / {tournament.mode}
          </p>
          <h2 className="mt-2 text-3xl font-black leading-tight text-white md:text-5xl">
            {tournament.tournamentName}
          </h2>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-300">
            <span className="inline-flex items-center gap-2">
              <FaCalendarAlt className="text-amber-300" />
              {getTournamentDate(tournament.startDate)}
            </span>
            <span className="inline-flex items-center gap-2">
              <FaUsers className="text-cyan-300" />
              {joinedCount} of {tournament.maxParticipants || 0} joined
            </span>
          </div>
        </div>

        <div className="mt-8 flex items-end justify-between gap-5 rounded-[22px] border border-slate-600 bg-slate-700 p-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              Prize
            </p>
            <p className="mt-1 text-3xl font-black text-white">
              Rs {tournament.prizePool || 0}
            </p>
            <p className="mt-1 text-xs text-slate-300">
              Entry Rs {tournament.entryFee || 0}
            </p>
          </div>
          <Link
            to={buildTournamentOfferingPath(tournament._id)}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 text-sm font-black text-white transition hover:bg-cyan-500"
          >
            View event
            <FaArrowRight />
          </Link>
        </div>
      </div>

      <div className="relative min-h-64 overflow-hidden lg:min-h-[30rem]">
        <img
          src={getGamePresentation(tournament.game).image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[68%_center] transition duration-700 group-hover:scale-[1.025]"
        />
      </div>

      <div className="absolute inset-x-0 bottom-0 h-1 bg-slate-600">
        <div
          className="h-full bg-[linear-gradient(90deg,#22d3ee,#fbbf24)] transition-all duration-700"
          style={{ width: `${filledPercentage}%` }}
        />
      </div>
    </section>
  );
};

const CompetitionCard = ({ tournament }) => {
  const joinedCount = getJoinedCount(tournament);
  const filledPercentage = getFilledPercentage(tournament);
  const presentation = getGamePresentation(tournament.game);

  return (
    <article className="group overflow-hidden rounded-[26px] border border-slate-700 bg-slate-800 shadow-[0_18px_45px_rgba(2,8,23,0.22)] transition duration-300 hover:-translate-y-1 hover:border-cyan-400/50">
      {/* The poster carries game identity while the body keeps event decisions
          readable and consistent across every supported game. */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={presentation.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[68%_center] transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
        <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-3">
          <span className="rounded-full border border-slate-500 bg-slate-800/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white shadow-sm backdrop-blur">
            {getTournamentStatus(tournament.status)}
          </span>
          <span className="rounded-full bg-cyan-300 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-950 shadow-sm">
            {tournament.mode}
          </span>
        </div>
        <span className="absolute bottom-4 left-4 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">
          {presentation.label}
        </span>
      </div>

      <div className="p-5">
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300">
          <FaClock className="text-amber-600" />
          {getTournamentDate(tournament.startDate)}
        </span>
        <h3 className="mt-2 min-h-14 line-clamp-2 text-2xl font-black leading-tight text-white">
          {tournament.tournamentName}
        </h3>

        <div className="mt-5 grid grid-cols-[1fr_auto_auto] items-end gap-5 rounded-2xl border border-slate-700 bg-slate-700/55 p-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
              Prize pool
            </p>
            <p className="mt-1 text-xl font-black text-amber-300">
              Rs {tournament.prizePool || 0}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
              Entry
            </p>
            <p className="mt-1 text-sm font-black text-white">
              Rs {tournament.entryFee || 0}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
              Joined
            </p>
            <p className="mt-1 text-sm font-black text-white">
              {joinedCount}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
            <span>Event capacity</span>
            <span>{Math.round(filledPercentage)}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#22d3ee,#fbbf24)] transition-all duration-700"
              style={{ width: `${filledPercentage}%` }}
            />
          </div>
        </div>

        <div className="mt-5">
          <Link
            to={buildTournamentOfferingPath(tournament._id)}
            aria-label={`Open ${tournament.tournamentName}`}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 text-sm font-black text-white transition group-hover:bg-cyan-500"
          >
            View tournament
            <FaArrowRight />
          </Link>
        </div>
      </div>
    </article>
  );
};

const CompetitionEmptyState = ({ isLoading }) => (
  <section className="rounded-[30px] border border-dashed border-slate-600 bg-slate-800/80 px-6 py-14 text-center shadow-[0_16px_40px_rgba(2,8,23,0.18)]">
    <FaGamepad className="mx-auto text-4xl text-cyan-300/70" />
    <h2 className="mt-5 text-2xl font-black text-white">
      {isLoading ? "Finding competitions..." : "No competitions here yet"}
    </h2>
    <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-300">
      {isLoading
        ? "We are loading the latest tournaments for you."
        : "Try another game or come back soon for the next tournament drop."}
    </p>
  </section>
);

SpotlightTournament.propTypes = {
  tournament: tournamentShape.isRequired,
};

CompetitionCard.propTypes = {
  tournament: tournamentShape.isRequired,
};

CompetitionEmptyState.propTypes = {
  isLoading: PropTypes.bool.isRequired,
};

GameFilterCard.propTypes = {
  eventCount: PropTypes.number.isRequired,
  filter: PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    image: PropTypes.string,
    images: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  isActive: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
};

export default Game;
