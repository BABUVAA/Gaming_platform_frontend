import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import {
  FaArrowRight,
  FaClock,
  FaGamepad,
} from "react-icons/fa";
import { buildTournamentOfferingPath } from "../routes/routeConstants";
import { selectIsStaffUtilityMode } from "../store/selectors/playerSelectors";
import {
  selectPlayerQuickMatchOfferings,
  selectPlayerQuickMatchStatus,
} from "../store/selectors/quickMatchOfferingSelectors";
import { fetchPlayerQuickMatchOfferings } from "../store/slices/quickMatchOfferingSlice";
import {
  fetchPlayerEvents,
  registerForEvent,
} from "../store/slices/eventRegistrationSlice.js";
import EventCompetitionCard from "../components/competition/EventCompetitionCard.jsx";
import CompetitionEntryDialog from "../components/competition/CompetitionEntryDialog.jsx";
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
  placementRewards: PropTypes.arrayOf(
    PropTypes.shape({
      amountMinor: PropTypes.number.isRequired,
      place: PropTypes.number.isRequired,
    }),
  ),
  isFeatured: PropTypes.bool,
  joinedCount: PropTypes.number,
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
  if (Number.isFinite(tournament.joinedCount)) return tournament.joinedCount;
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
  const dispatch = useDispatch();
  const [activeGame, setActiveGame] = useState("all");
  const [pendingEvent, setPendingEvent] = useState(null);
  const isStaffUtilityMode = useSelector(selectIsStaffUtilityMode);
  const offerings = useSelector(selectPlayerQuickMatchOfferings);
  const tournamentsStatus = useSelector(selectPlayerQuickMatchStatus);
  const eventState = useSelector((state) => state.eventRegistration);
  const tournaments = useMemo(
    () =>
      offerings.map((offering) => ({
        _id: offering._id,
        entryFee: offering.entryFeeMinor / 100,
        game: offering.gameKey,
        joinedCount: offering.joinProgress?.joinedParticipants || 0,
        maxParticipants: offering.maxParticipants,
        mode: offering.mode,
        placementRewards: offering.placementRewards || [],
        prizePool: offering.prizePoolMinor / 100,
        registeredPlayers: [],
        registeredTeams: [],
        status: offering.status,
        tournamentName: offering.title,
      })),
    [offerings],
  );

  useEffect(() => {
    const requests = [
      dispatch(fetchPlayerQuickMatchOfferings()),
      dispatch(fetchPlayerEvents()),
    ];
    const refreshTimer = window.setInterval(() => {
      dispatch(fetchPlayerQuickMatchOfferings());
      dispatch(fetchPlayerEvents());
    }, 10000);
    return () => {
      requests.forEach((request) => request.abort());
      window.clearInterval(refreshTimer);
    };
  }, [dispatch]);

  const visibleEvents = eventState.events.filter(
    (event) =>
      activeGame === "all" || getGameKey(event.game?.key) === activeGame,
  );

  const commitEventRegistration = () => {
    if (!pendingEvent) return;
    dispatch(registerForEvent(pendingEvent.id));
    setPendingEvent(null);
  };

  const filteredTournaments = tournaments
    .filter(
      (tournament) =>
        activeGame === "all" || getGameKey(tournament.game) === activeGame,
    )
    .sort((first, second) => {
      // Featured status breaks equal-priority ties without hiding open events.
      const statusDifference = rankTournament(first) - rankTournament(second);
      if (statusDifference !== 0) return statusDifference;
      return (
        Number(Boolean(second.isFeatured)) - Number(Boolean(first.isFeatured))
      );
    });

  return (
    <div className="space-y-7 pb-8 text-slate-100">
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
            const quickMatchCount =
              filter.key === "all"
                ? tournaments.length
                : tournaments.filter(
                    (tournament) => getGameKey(tournament.game) === filter.key,
                  ).length;
            const scheduledEventCount =
              filter.key === "all"
                ? eventState.events.length
                : eventState.events.filter(
                    (event) => getGameKey(event.game?.key) === filter.key,
                  ).length;

            return (
              <GameFilterCard
                key={filter.key}
                filter={filter}
                eventCount={quickMatchCount + scheduledEventCount}
                isActive={activeGame === filter.key}
                onSelect={() => setActiveGame(filter.key)}
              />
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">
              Events
            </p>
            <h2 className="mt-1 text-2xl font-black text-white">
              Events for the selected game
            </h2>
          </div>
          {eventState.status === "failed" ? (
            <button
              className="rounded-xl border border-rose-300/30 px-3 py-2 text-sm text-rose-100"
              onClick={() => dispatch(fetchPlayerEvents())}
              type="button"
            >
              Retry Events
            </button>
          ) : null}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {visibleEvents.map((event) => (
            <EventCompetitionCard
              busy={eventState.actionById[event.id] === "loading"}
              event={event}
              key={event.id}
              onRegister={setPendingEvent}
              staffReadOnly={isStaffUtilityMode}
            />
          ))}
          {eventState.status === "loading" ? (
            <p className="rounded-2xl border border-slate-800 p-5 text-sm text-slate-400">
              Loading Events...
            </p>
          ) : null}
          {eventState.status === "succeeded" && !visibleEvents.length ? (
            <p className="rounded-2xl border border-dashed border-slate-700 p-5 text-sm text-slate-400">
              No Events are available for this game.
            </p>
          ) : null}
        </div>
      </section>

      {filteredTournaments.length > 0 ? (
        <section>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">
                Tournaments
              </p>
              <h2 className="mt-1 text-2xl font-black text-white">
                Tournaments for the selected game
              </h2>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {filteredTournaments.map((tournament) => (
              <CompetitionCard key={tournament._id} tournament={tournament} />
            ))}
          </div>
        </section>
      ) : (
        <CompetitionEmptyState isLoading={tournamentsStatus === "loading"} />
      )}

      <CompetitionEntryDialog
        actionLabel="Proceed & register"
        currency={pendingEvent?.entryTerms?.currency || "INR"}
        entryFeeMinor={pendingEvent?.entryTerms?.entryFeeMinor || 0}
        isOpen={Boolean(pendingEvent)}
        onClose={() => setPendingEvent(null)}
        onProceed={commitEventRegistration}
        testMoney={pendingEvent?.entryTerms?.testMoney}
        title={pendingEvent?.title || "Event"}
        type="Event"
      />
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

const CompetitionCard = ({ tournament }) => {
  const joinedCount = getJoinedCount(tournament);
  const filledPercentage = getFilledPercentage(tournament);
  const presentation = getGamePresentation(tournament.game);
  const placementRewards = tournament.placementRewards || [];

  return (
    <article className="group relative min-h-[16rem] overflow-hidden rounded-[22px] border border-slate-700 bg-slate-900 shadow-[0_14px_32px_rgba(2,8,23,0.28)] transition duration-300 hover:-translate-y-1 hover:border-cyan-400/60">
      <img
        src={presentation.image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[68%_center] transition duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.48),rgba(2,6,23,0.84)_40%,rgba(2,6,23,0.99)_100%)]" />

      <div className="relative flex min-h-[16rem] flex-col justify-between p-4">
        <div>
          <div className="flex items-start justify-between gap-3">
            <span className="rounded-full border border-slate-500 bg-slate-800/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white shadow-sm backdrop-blur">
              {getTournamentStatus(tournament.status)}
            </span>
            <span className="rounded-full bg-cyan-300 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-950 shadow-sm">
              Mode · {tournament.mode}
            </span>
          </div>
        </div>

        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">
            {presentation.label}
          </span>
          <h3 className="mt-1 line-clamp-2 text-lg font-black leading-tight text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.9)] sm:text-xl">
            {tournament.tournamentName}
          </h3>
          <span className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-slate-200">
            <FaClock className="text-amber-300" />
            {getTournamentDate(tournament.startDate)}
          </span>

          <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-white/15 bg-slate-950/75 p-2.5 backdrop-blur-sm">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                Reward
              </p>
              <p className="mt-0.5 text-sm font-black text-amber-300">
                ₹{Number(tournament.prizePool || 0).toLocaleString("en-IN")}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                Entry
              </p>
              <p className="mt-0.5 text-sm font-black text-white">
                {tournament.entryFee > 0
                  ? `₹${Number(tournament.entryFee).toLocaleString("en-IN")}`
                  : "Free"}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                Capacity
              </p>
              <p className="mt-0.5 text-sm font-black text-white">
                {tournament.maxParticipants || 0} seats
              </p>
            </div>
          </div>

          {placementRewards.length ? (
            <p className="mt-2 line-clamp-1 text-[10px] font-bold text-amber-100">
              {placementRewards
                .slice(0, 3)
                .map(
                  (reward) =>
                    `#${reward.place} ₹${Number(reward.amountMinor / 100).toLocaleString("en-IN")}`,
                )
                .join(" · ")}
              {placementRewards.length > 3
                ? ` · +${placementRewards.length - 3} places`
                : ""}
            </p>
          ) : null}

          <div className="mt-3 flex items-center justify-between text-[10px] font-bold text-slate-200">
            <span>
              {joinedCount}/{tournament.maxParticipants || 0} joined
            </span>
            <span>{Math.round(filledPercentage)}% full</span>
          </div>
          <div
            aria-label={`${joinedCount} of ${tournament.maxParticipants || 0} seats filled`}
            className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-700/80"
          >
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#22d3ee,#fbbf24)] transition-all duration-700"
              style={{ width: `${filledPercentage}%` }}
            />
          </div>

          <Link
            to={buildTournamentOfferingPath(tournament._id)}
            aria-label={`Open ${tournament.tournamentName}`}
            className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 text-xs font-black text-slate-950 transition group-hover:bg-cyan-200"
          >
            Open tournament
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
