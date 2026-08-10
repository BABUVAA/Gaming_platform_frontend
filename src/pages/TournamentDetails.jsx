import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaCalendarDays,
  FaCheck,
  FaClock,
  FaGamepad,
  FaShareNodes,
  FaTrophy,
  FaUserGroup,
} from "react-icons/fa6";
import { FiMap, FiShield, FiUsers } from "react-icons/fi";
import { getGamePresentation } from "../config/gamePresentation";
import { ROUTES } from "../routes/routeConstants";
import {
  selectTournamentDetailError,
  selectTournamentDetails,
  selectTournamentDetailStatus,
} from "../store/selectors/tournamentSelectors";
import { fetchTournamentById } from "../store/slices/tournamentSlice";
import { useStore } from "../store/useStore";
import { useSelector } from "react-redux";

const EVENT_TABS = Object.freeze([
  { id: "overview", label: "Tournament details" },
  { id: "participants", label: "Participants" },
  { id: "rewards", label: "Rewards" },
]);

const STATUS_LABELS = Object.freeze({
  active: "Getting ready",
  cancelled: "Cancelled",
  completed: "Completed",
  ongoing: "Live now",
  registration_open: "Open to join",
  upcoming: "Coming soon",
});

const GAME_GUIDANCE = Object.freeze({
  default: [
    "Use the verified game account connected to your profile.",
    "Keep your selected player or team lineup ready before the event starts.",
    "Match instructions will appear in your match area when the match is ready.",
  ],
  bgmi: [
    "Use the same verified BGMI account that is connected to your profile.",
    "Keep your full squad ready before the room details are released.",
    "Room ID and password will appear in your match area when the match is ready.",
  ],
  coc: [
    "Use the verified Clash of Clans account connected to your profile.",
    "Keep your selected team available before the event starts.",
    "Match instructions will appear in your match area when an opponent is assigned.",
  ],
});

const formatDateTime = (value) => {
  if (!value) return "Schedule coming soon";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Schedule coming soon";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    weekday: "short",
  }).format(date);
};

const formatCurrency = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "Free";

  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amount);
};

const formatDuration = (seconds) => {
  const totalMinutes = Math.round(Number(seconds) / 60);
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return null;
  if (totalMinutes < 60) return `${totalMinutes} min`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes ? `${hours} hr ${minutes} min` : `${hours} hr`;
};

const getParticipantCollection = (tournament) => {
  if (Array.isArray(tournament?.participants)) {
    return tournament.participants;
  }

  // Team modes count registered teams, while solo events count individual
  // players. Keeping this rule here prevents cards and progress bars drifting.
  const participants =
    tournament?.mode === "solo"
      ? tournament?.registeredPlayers
      : tournament?.registeredTeams;

  return Array.isArray(participants) ? participants : [];
};

const getEventTiming = (tournament, now) => {
  if (tournament?.kind === "offering") {
    const offeringIsOpen = [
      "active",
      "ongoing",
      "registration_open",
    ].includes(tournament.status);

    return {
      label: offeringIsOpen
        ? "Open to join"
        : STATUS_LABELS[tournament.status] || "Competition",
      target: null,
      targetLabel: "Availability",
    };
  }

  const registrationStart = tournament?.startDate
    ? new Date(tournament.startDate).getTime()
    : null;
  const matchStart = tournament?.matchStartDate
    ? new Date(tournament.matchStartDate).getTime()
    : registrationStart;
  const end = tournament?.endDate
    ? new Date(tournament.endDate).getTime()
    : null;

  if (tournament?.status === "cancelled") {
    return { label: "Cancelled", target: null, targetLabel: "Event status" };
  }
  if (
    tournament?.status === "completed" ||
    (Number.isFinite(end) && now >= end)
  ) {
    return { label: "Completed", target: null, targetLabel: "Event status" };
  }
  if (tournament?.status === "ongoing") {
    return {
      label: "Live now",
      target: Number.isFinite(end) ? end : null,
      targetLabel: Number.isFinite(end) ? "Ends in" : "Event status",
    };
  }
  if (tournament?.status === "active") {
    return {
      label: "Getting ready",
      target: null,
      targetLabel: "Event status",
    };
  }
  if (tournament?.status === "registration_open") {
    return {
      label: "Open to join",
      target: Number.isFinite(matchStart) ? matchStart : null,
      targetLabel: Number.isFinite(matchStart) ? "Starts in" : "Event status",
    };
  }
  if (Number.isFinite(matchStart) && now >= matchStart) {
    return {
      label: "Live now",
      target: Number.isFinite(end) ? end : null,
      targetLabel: Number.isFinite(end) ? "Ends in" : "Event status",
    };
  }
  if (Number.isFinite(matchStart)) {
    return {
      label: STATUS_LABELS[tournament?.status] || "Upcoming",
      target: matchStart,
      targetLabel: "Starts in",
    };
  }

  return {
    label: STATUS_LABELS[tournament?.status] || "Schedule pending",
    target: null,
    targetLabel: "Event status",
  };
};

const formatCountdown = (target, now) => {
  if (!target || target <= now) return null;

  const totalMinutes = Math.ceil((target - now) / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${Math.max(1, minutes)}m`;
};

const TournamentDetails = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [shareLabel, setShareLabel] = useState("Share event");
  const [now, setNow] = useState(Date.now());
  const { id } = useParams();
  const { dispatch } = useStore();
  const tournament = useSelector(selectTournamentDetails);
  const detailStatus = useSelector(selectTournamentDetailStatus);
  const detailError = useSelector(selectTournamentDetailError);

  const resourceKind = "offering";

  useEffect(() => {
    // The detail thunk owns request deduplication and cache freshness, so this
    // page only declares which event the current route needs.
    setActiveTab("overview");
    dispatch(fetchTournamentById({ resourceId: id, resourceKind }));
  }, [dispatch, id, resourceKind]);

  useEffect(() => {
    // Minute-level decisions do not require a one-second rerender. Updating
    // twice per minute keeps countdown text current without wasting work.
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  if (detailStatus === "loading" && tournament?._id !== id) {
    return <EventDetailsSkeleton />;
  }

  if (detailStatus === "failed") {
    return <EventDetailsError message={detailError} />;
  }

  if (!tournament || tournament._id !== id) {
    return <EventDetailsSkeleton />;
  }

  const presentation = getGamePresentation(tournament.game);
  const participants = getParticipantCollection(tournament);
  const capacity = Math.max(
    0,
    Number(
      tournament.registration?.capacity || tournament.maxParticipants,
    ) || 0,
  );
  const participantCount = Number.isFinite(
    Number(tournament.registration?.joined),
  )
    ? Number(tournament.registration.joined)
    : participants.length;
  const filledPercentage =
    capacity > 0
      ? Math.min(100, (participantCount / capacity) * 100)
      : 0;
  const timing = getEventTiming(tournament, now);
  const countdown = formatCountdown(timing.target, now);
  const isRegistrationOpen =
    tournament.kind === "offering" &&
    ["active", "ongoing", "registration_open"].includes(
      tournament.status,
    );

  const handleShare = async () => {
    const shareData = {
      title: tournament.tournamentName,
      text: `View ${tournament.tournamentName} on E-Gaming.`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        setShareLabel("Link copied");
        window.setTimeout(() => setShareLabel("Share event"), 2000);
      }
    } catch (error) {
      // Closing the native share sheet is not a page failure and needs no
      // warning. Other browser failures leave the original button available.
      if (error?.name !== "AbortError") setShareLabel("Try again");
    }
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 px-3 pb-10 pt-4 text-slate-100 sm:px-5 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <Link
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 transition hover:text-white"
          to={ROUTES.GAME}
        >
          <FaArrowLeft />
          Back to events
        </Link>
        <button
          className="inline-flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm font-bold text-white transition hover:border-cyan-400/50 hover:bg-slate-700"
          onClick={handleShare}
          type="button"
        >
          {shareLabel === "Link copied" ? <FaCheck /> : <FaShareNodes />}
          {shareLabel}
        </button>
      </div>

      <EventHero
        countdown={countdown}
        presentation={presentation}
        timing={timing}
        tournament={tournament}
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-5">
          <EventFacts tournament={tournament} />
          <EventContent
            activeTab={activeTab}
            participants={participants}
            setActiveTab={setActiveTab}
            tournament={tournament}
          />
        </div>

        <RegistrationCard
          capacity={capacity}
          filledPercentage={filledPercentage}
          isRegistrationOpen={isRegistrationOpen}
          participantCount={participantCount}
          tournament={tournament}
        />
      </section>
    </div>
  );
};

const EventHero = ({ countdown, presentation, timing, tournament }) => {
  const isOffering = tournament.kind === "offering";
  const configuredImage = String(tournament.imageUrl || "");
  const heroImage =
    configuredImage && !configuredImage.endsWith("/profile-pic.png")
      ? configuredImage
      : presentation.image;

  return (
    <section className="relative min-h-[27rem] overflow-hidden rounded-[32px] border border-slate-700 bg-slate-900 shadow-[0_28px_75px_rgba(2,8,23,0.38)] md:min-h-[32rem]">
      <img
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
        src={heroImage}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.97)_0%,rgba(2,6,23,0.84)_44%,rgba(2,6,23,0.20)_100%),linear-gradient(0deg,rgba(2,6,23,0.88),transparent_55%)]" />

      <div className="relative flex min-h-[27rem] max-w-3xl flex-col justify-end p-6 md:min-h-[32rem] md:p-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-cyan-300 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-950">
            {timing.label}
          </span>
          {tournament.isFeatured ? (
            <span className="rounded-full border border-amber-300/35 bg-amber-300/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-amber-200">
              Featured event
            </span>
          ) : null}
        </div>

        <p className="mt-5 text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
          {presentation.label} / {tournament.mode || "Event"}
        </p>
        <h1 className="mt-2 max-w-3xl text-4xl font-black leading-[0.98] tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
          {tournament.tournamentName}
        </h1>

        <div className="mt-7 flex flex-wrap gap-3">
          <HeroMetric
            icon={isOffering ? <FaGamepad /> : <FaCalendarDays />}
            label={isOffering ? "Competition" : "Event time"}
            value={
              isOffering
                ? `${presentation.label} ${tournament.mode || ""}`.trim()
                : formatDateTime(
                    tournament.matchStartDate || tournament.startDate,
                  )
            }
          />
          <HeroMetric
            icon={<FaClock />}
            label={timing.targetLabel}
            value={countdown || timing.label}
          />
        </div>
      </div>
    </section>
  );
};

const HeroMetric = ({ icon, label, value }) => (
  <div className="min-w-[11rem] rounded-2xl border border-white/15 bg-slate-950/65 px-4 py-3 backdrop-blur-md">
    <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
      <span className="text-cyan-300">{icon}</span>
      {label}
    </p>
    <p className="mt-1.5 text-sm font-black text-white">{value}</p>
  </div>
);

const EventFacts = ({ tournament }) => {
  const totalDuration = formatDuration(
    Number(tournament.preparationTime || 0) +
      Number(tournament.battleDuration || 0),
  );

  const facts = [
    {
      icon: <FaTrophy />,
      label: "Prize pool",
      value: formatCurrency(tournament.prizePool),
    },
    {
      icon: <FaGamepad />,
      label: "Format",
      value: String(tournament.mode || "To be announced").toUpperCase(),
    },
    {
      icon: <FiMap />,
      label: "Map",
      value:
        tournament.map && tournament.map !== "none"
          ? tournament.map.replaceAll("_", " ")
          : "To be announced",
    },
    {
      icon: <FaClock />,
      label: "Match length",
      value: totalDuration || "To be announced",
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {facts.map((fact) => (
        <div
          className="rounded-2xl border border-slate-700 bg-slate-800 p-4 shadow-[0_12px_32px_rgba(2,8,23,0.18)]"
          key={fact.label}
        >
          <div className="text-lg text-cyan-300">{fact.icon}</div>
          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
            {fact.label}
          </p>
          <p className="mt-1 truncate text-sm font-black capitalize text-white sm:text-base">
            {fact.value}
          </p>
        </div>
      ))}
    </section>
  );
};

const EventContent = ({
  activeTab,
  participants,
  setActiveTab,
  tournament,
}) => {
  const visibleTabs =
    tournament.kind === "event"
      ? EVENT_TABS
      : EVENT_TABS.filter((tab) => tab.id !== "participants");

  return (
    <section className="overflow-hidden rounded-[26px] border border-slate-700 bg-slate-800 shadow-[0_18px_45px_rgba(2,8,23,0.2)]">
      <div className="flex gap-1 overflow-x-auto border-b border-slate-700 p-2">
        {visibleTabs.map((tab) => (
        <button
          className={`whitespace-nowrap rounded-xl px-4 py-3 text-sm font-black transition ${
            activeTab === tab.id
              ? "bg-cyan-300 text-slate-950"
              : "text-slate-300 hover:bg-slate-700 hover:text-white"
          }`}
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          type="button"
        >
          {tab.label}
        </button>
        ))}
      </div>

      <div className="p-5 sm:p-6">
        {activeTab === "overview" ? (
          <EventOverview tournament={tournament} />
        ) : null}
        {activeTab === "participants" ? (
          <ParticipantList
            mode={tournament.mode}
            participants={participants}
          />
        ) : null}
        {activeTab === "rewards" ? (
          <RewardList
            prizePool={tournament.prizePool}
            rewards={tournament.rewards}
          />
        ) : null}
      </div>
    </section>
  );
};

const EventOverview = ({ tournament }) => {
  const guidance =
    GAME_GUIDANCE[String(tournament.game || "").toLowerCase()] ||
    GAME_GUIDANCE.default;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
          How it works
        </p>
        <h2 className="mt-2 text-2xl font-black text-white">
          Get ready for the event
        </h2>
        <div className="mt-5 space-y-3">
          {guidance.map((item, index) => (
            <div
              className="flex gap-3 rounded-2xl border border-slate-700 bg-slate-900/55 p-4"
              key={item}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-300 text-xs font-black text-slate-950">
                {index + 1}
              </span>
              <p className="text-sm leading-6 text-slate-300">{item}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
          Event setup
        </p>
        <div className="mt-4 divide-y divide-slate-700 rounded-2xl border border-slate-700 bg-slate-900/55 px-4">
          <DetailRow
            label="Game"
            value={getGamePresentation(tournament.game).label}
          />
          <DetailRow
            label="Team size"
            value={
              tournament.mode === "solo"
                ? "1 player"
                : `${tournament.teamSize || "-"} players`
            }
          />
          <DetailRow
            label="Category"
            value={
              tournament.category && tournament.category !== "none"
                ? tournament.category
                : "Open event"
            }
          />
          <DetailRow
            label="Level"
            value={tournament.level || "Open to eligible players"}
          />
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ label, value }) => (
  <div className="flex items-center justify-between gap-5 py-4 text-sm">
    <span className="text-slate-400">{label}</span>
    <span className="text-right font-bold capitalize text-white">{value}</span>
  </div>
);

const ParticipantList = ({ mode, participants }) => {
  if (participants.length === 0) {
    return (
      <EmptyTab
        icon={<FiUsers />}
        message="Registered players and teams will appear here."
        title="No participants yet"
      />
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {participants.map((participant, index) => {
        const name =
          participant?.teamName ||
          participant?.username ||
          participant?.profile?.username ||
          `${mode === "solo" ? "Player" : "Team"} ${index + 1}`;

        return (
          <div
            className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/55 p-4"
            key={participant?._id || index}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-300/15 font-black text-cyan-200">
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="truncate font-bold text-white">{name}</p>
              <p className="mt-0.5 text-xs capitalize text-slate-400">
                {mode === "solo" ? "Player" : "Registered team"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const RewardList = ({ prizePool, rewards }) => {
  if (!Array.isArray(rewards) || rewards.length === 0) {
    return (
      <EmptyTab
        icon={<FaTrophy />}
        message={
          Number(prizePool) > 0
            ? `${formatCurrency(prizePool)} is available. The rank-wise split will be announced before the event.`
            : "Reward details will appear here when they are announced."
        }
        title="Reward split coming soon"
      />
    );
  }

  return (
    <div className="space-y-2">
      {rewards.map((reward, index) => (
        <div
          className="flex items-center justify-between gap-4 rounded-2xl border border-slate-700 bg-slate-900/55 p-4"
          key={`${reward.slotStart}-${reward.slotEnd}-${index}`}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300/15 text-amber-300">
              <FaTrophy />
            </span>
            <p className="font-bold text-white">
              Rank {reward.slotStart}
              {reward.slotEnd !== reward.slotStart
                ? ` - ${reward.slotEnd}`
                : ""}
            </p>
          </div>
          <p className="font-black text-amber-300">
            {formatCurrency(reward.amount)}
          </p>
        </div>
      ))}
    </div>
  );
};

const EmptyTab = ({ icon, message, title }) => (
  <div className="py-8 text-center">
    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-700 text-xl text-cyan-300">
      {icon}
    </span>
    <h2 className="mt-4 text-xl font-black text-white">{title}</h2>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
      {message}
    </p>
  </div>
);

const RegistrationCard = ({
  capacity,
  filledPercentage,
  isRegistrationOpen,
  participantCount,
  tournament,
}) => {
  const remainingSlots = Math.max(0, capacity - participantCount);
  const isEventInstance = tournament.kind === "event";
  const isOffering = tournament.kind === "offering";
  const registrationUnit =
    tournament.registration?.unit ||
    (tournament.mode === "solo" ? "player" : "team");

  return (
    <aside className="h-fit rounded-[26px] border border-slate-700 bg-slate-800 p-5 shadow-[0_18px_45px_rgba(2,8,23,0.2)] xl:sticky xl:top-5">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
        Registration
      </p>
      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-3xl font-black text-white">
            {formatCurrency(tournament.entryFee)}
          </p>
          <p className="mt-1 text-xs text-slate-400">per entry</p>
        </div>
        <span
          className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${
            isRegistrationOpen
              ? "bg-emerald-400/15 text-emerald-300"
              : "bg-slate-700 text-slate-300"
          }`}
        >
          {STATUS_LABELS[tournament.status] ||
            tournament.status?.replaceAll("_", " ") ||
            "Event"}
        </span>
      </div>

      {isOffering ? (
        <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900/55 p-4">
          <p className="text-xs font-bold text-slate-400">
            Each matchmaking room
          </p>
          <p className="mt-1 text-lg font-black text-white">
            {capacity || "-"} {registrationUnit}
            {capacity === 1 ? "" : "s"}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            A new room is created when existing rooms cannot fit your entry.
          </p>
        </div>
      ) : (
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>{participantCount} joined</span>
            <span>{capacity || "-"} total</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#22d3ee,#fbbf24)]"
              style={{ width: `${filledPercentage}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {capacity > 0
              ? `${remainingSlots} ${registrationUnit} slots left`
              : "Capacity will be announced soon"}
          </p>
        </div>
      )}

      <Link
        className={`mt-6 flex h-12 w-full items-center justify-center rounded-xl text-sm font-black transition ${
          isRegistrationOpen || isEventInstance
            ? "bg-cyan-300 text-slate-950 hover:bg-cyan-200"
            : "pointer-events-none bg-slate-700 text-slate-400"
        }`}
        to={
          isEventInstance
            ? ROUTES.MATCHES
            : isRegistrationOpen
              ? `${ROUTES.TOURNAMENT}/${tournament.game}`
              : "#"
        }
      >
        {isEventInstance
          ? "Open my match"
          : isRegistrationOpen
            ? "Choose entry"
            : "Registration unavailable"}
      </Link>

      <div className="mt-5 space-y-3 border-t border-slate-700 pt-5 text-xs text-slate-300">
        <p className="flex items-center gap-2">
          <FiShield className="text-cyan-300" />
          Verified game account required
        </p>
        <p className="flex items-center gap-2">
          <FaUserGroup className="text-cyan-300" />
          {tournament.mode === "solo"
            ? "Individual entry"
            : `${tournament.teamSize || "-"} player team`}
        </p>
      </div>
    </aside>
  );
};

const EventDetailsSkeleton = () => (
  <div className="mx-auto max-w-[1500px] animate-pulse space-y-5 px-3 py-5 sm:px-5 lg:px-8">
    <div className="h-10 w-36 rounded-xl bg-slate-700" />
    <div className="h-[30rem] rounded-[32px] bg-slate-800" />
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div className="h-28 rounded-2xl bg-slate-800" key={index} />
      ))}
    </div>
  </div>
);

const EventDetailsError = ({ message }) => (
  <div className="mx-auto max-w-xl px-4 py-16 text-center">
    <div className="rounded-[28px] border border-rose-400/20 bg-rose-500/10 p-8">
      <h1 className="text-2xl font-black text-white">Event unavailable</h1>
      <p className="mt-3 text-sm leading-6 text-rose-100">
        {message || "We could not load this event right now."}
      </p>
      <Link
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950"
        to={ROUTES.GAME}
      >
        <FaArrowLeft />
        Browse events
      </Link>
    </div>
  </div>
);

const tournamentPropType = PropTypes.shape({
  _id: PropTypes.string,
  battleDuration: PropTypes.number,
  category: PropTypes.string,
  endDate: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  entryFee: PropTypes.number,
  game: PropTypes.string,
  imageUrl: PropTypes.string,
  isFeatured: PropTypes.bool,
  kind: PropTypes.oneOf(["event", "offering"]),
  level: PropTypes.string,
  map: PropTypes.string,
  matchStartDate: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  maxParticipants: PropTypes.number,
  mode: PropTypes.string,
  preparationTime: PropTypes.number,
  prizePool: PropTypes.number,
  registeredPlayers: PropTypes.arrayOf(PropTypes.object),
  registeredTeams: PropTypes.arrayOf(PropTypes.object),
  registration: PropTypes.shape({
    capacity: PropTypes.number,
    joined: PropTypes.number,
    playerCapacity: PropTypes.number,
    teamSize: PropTypes.number,
    unit: PropTypes.oneOf(["player", "team"]),
  }),
  rewards: PropTypes.arrayOf(PropTypes.object),
  startDate: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  status: PropTypes.string,
  teamSize: PropTypes.number,
  tournamentName: PropTypes.string,
});

EventHero.propTypes = {
  countdown: PropTypes.string,
  presentation: PropTypes.shape({
    image: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
  }).isRequired,
  timing: PropTypes.shape({
    label: PropTypes.string.isRequired,
    targetLabel: PropTypes.string.isRequired,
  }).isRequired,
  tournament: tournamentPropType.isRequired,
};

HeroMetric.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};

EventFacts.propTypes = { tournament: tournamentPropType.isRequired };

EventContent.propTypes = {
  activeTab: PropTypes.string.isRequired,
  participants: PropTypes.arrayOf(PropTypes.object).isRequired,
  setActiveTab: PropTypes.func.isRequired,
  tournament: tournamentPropType.isRequired,
};

EventOverview.propTypes = { tournament: tournamentPropType.isRequired };

DetailRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

ParticipantList.propTypes = {
  mode: PropTypes.string,
  participants: PropTypes.arrayOf(PropTypes.object).isRequired,
};

RewardList.propTypes = {
  prizePool: PropTypes.number,
  rewards: PropTypes.arrayOf(PropTypes.object),
};

EmptyTab.propTypes = {
  icon: PropTypes.node.isRequired,
  message: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
};

RegistrationCard.propTypes = {
  capacity: PropTypes.number.isRequired,
  filledPercentage: PropTypes.number.isRequired,
  isRegistrationOpen: PropTypes.bool.isRequired,
  participantCount: PropTypes.number.isRequired,
  tournament: tournamentPropType.isRequired,
};

EventDetailsError.propTypes = { message: PropTypes.string };

export default TournamentDetails;
