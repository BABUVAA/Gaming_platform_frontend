import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import {
  FaDiscord,
  FaInstagram,
  FaShareNodes,
  FaTrophy,
  FaTwitter,
} from "react-icons/fa6";
import { FiClock, FiPlayCircle, FiUsers } from "react-icons/fi";
import { fetchTournamentById } from "../store/tournamentSlice";

const pad = (value) => String(value).padStart(2, "0");

const formatCountdown = (milliseconds) => {
  if (!milliseconds || milliseconds <= 0) return "00:00:00";
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

const TournamentDetails = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { id } = useParams();
  const dispatch = useDispatch();
  const { tournamentId } = useSelector((store) => store.tournament);

  useEffect(() => {
    dispatch(fetchTournamentById(id));
  }, [dispatch, id]);

  return (
    <div className="space-y-6">
      <TournamentHero tournament={tournamentId} />
      <TournamentSummary tournament={tournamentId} />
      <TournamentTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        rules={rulesData}
        leaderboard={tournamentId?.registeredPlayers || []}
      />
    </div>
  );
};

const TournamentHero = ({ tournament }) => {
  const startMs = useMemo(
    () => (tournament?.matchStartDate ? new Date(tournament.matchStartDate).getTime() : null),
    [tournament?.matchStartDate]
  );
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const preparationTime = (tournament?.preparationTime || 900) * 1000;
  const battleDuration = (tournament?.battleDuration || 2700) * 1000;
  const prepEnd = startMs ? startMs + preparationTime : null;
  const battleEnd = prepEnd ? prepEnd + battleDuration : null;

  let phase = {
    label: "Upcoming",
    timerLabel: "Starts in",
    target: startMs,
  };

  if (!startMs) {
    phase = { label: "Awaiting schedule", timerLabel: "", target: null };
  } else if (now >= startMs && now < prepEnd) {
    phase = { label: "Preparation", timerLabel: "Prep ends in", target: prepEnd };
  } else if (now >= prepEnd && now < battleEnd) {
    phase = { label: "Battle live", timerLabel: "Battle ends in", target: battleEnd };
  } else if (now >= battleEnd) {
    phase = { label: "Completed", timerLabel: "", target: null };
  }

  return (
    <section className="relative overflow-hidden rounded-[36px] border border-white/10 shadow-[0_24px_80px_rgba(2,8,23,0.5)]">
      <img
        src={tournament?.imageUrl || "/pubg_background.jpg"}
        alt={tournament?.tournamentName || "Tournament banner"}
        className="h-[24rem] w-full object-cover md:h-[30rem]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.2),rgba(2,6,23,0.82)),radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_30%)]" />

      <div className="absolute inset-0 flex flex-col justify-end px-6 py-6 md:px-8 md:py-8">
        <div className="max-w-4xl rounded-[28px] border border-white/10 bg-slate-950/55 p-5 backdrop-blur md:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
              {phase.label}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200">
              {tournament?.status || "registration_open"}
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-black text-white md:text-5xl">
            {tournament?.tournamentName || "Tournament"}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            {tournament?.game || "Game"} competition room with player verification, operator oversight, and live result handling.
          </p>

          <div className="mt-6 flex flex-wrap gap-4">
            <div className="rounded-[24px] border border-white/10 bg-black/20 px-5 py-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                <FiClock />
                {phase.timerLabel || "Status"}
              </div>
              <div className="mt-2 text-3xl font-black text-white">
                {phase.target ? formatCountdown(phase.target - now) : phase.label}
              </div>
            </div>

            <button className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-slate-950 transition hover:bg-cyan-200">
              <FiPlayCircle />
              Watch Room
            </button>
            <button className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:border-cyan-300/30 hover:text-cyan-200">
              <FaShareNodes />
              Share
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

const TournamentSummary = ({ tournament }) => {
  const joinedParticipants =
    tournament?.mode !== "solo"
      ? tournament?.registeredTeams?.length || 0
      : tournament?.registeredPlayers?.length || 0;

  return (
    <section className="grid gap-4 md:grid-cols-4">
      <SummaryCard
        icon={<FaTrophy />}
        label="Prize Pool"
        value={`Rs ${tournament?.prizePool || 0}`}
      />
      <SummaryCard
        icon={<FiUsers />}
        label="Entry Fee"
        value={`Rs ${tournament?.entryFee || 0}`}
      />
      <SummaryCard
        icon={<FiUsers />}
        label="Participants"
        value={`${joinedParticipants} / ${tournament?.maxParticipants || 0}`}
      />
      <SummaryCard
        icon={<FiClock />}
        label="Game"
        value={tournament?.game || "Unknown"}
      />
    </section>
  );
};

const SummaryCard = ({ icon, label, value }) => (
  <div className="rounded-[28px] border border-white/10 bg-slate-950/80 p-5 shadow-[0_18px_40px_rgba(2,8,23,0.35)]">
    <div className="flex items-center gap-2 text-cyan-300">
      {icon}
      <p className="text-xs uppercase tracking-[0.2em]">{label}</p>
    </div>
    <p className="mt-4 text-2xl font-black text-white">{value}</p>
  </div>
);

const TournamentTabs = ({ activeTab, setActiveTab, rules, leaderboard }) => {
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "leaderboard", label: "Leaderboard" },
  ];

  return (
    <section className="rounded-[32px] border border-white/10 bg-slate-950/80 shadow-[0_18px_40px_rgba(2,8,23,0.35)]">
      <div className="flex flex-wrap gap-2 border-b border-white/10 p-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              activeTab === tab.id
                ? "bg-cyan-300 text-slate-950"
                : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {activeTab === "overview" ? (
          <div className="grid gap-4">
            {rules.map((rule, index) => (
              <div
                key={rule.title}
                className="rounded-[24px] border border-white/10 bg-black/20 p-5"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-300/75">
                  Rule Set {index + 1}
                </p>
                <h3 className="mt-2 text-xl font-black text-white">{rule.title}</h3>
                <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
                  {rule.points.map((point) => (
                    <li key={point} className="rounded-2xl bg-white/5 px-4 py-3">
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-[24px] border border-white/10">
            <div className="grid grid-cols-[80px_1.4fr_1fr_120px] bg-white/5 px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              <span>Rank</span>
              <span>Player</span>
              <span>Social</span>
              <span className="text-right">Score</span>
            </div>
            {leaderboard.length > 0 ? (
              leaderboard.map((player, index) => (
                <div
                  key={player._id || index}
                  className="grid grid-cols-[80px_1.4fr_1fr_120px] items-center border-t border-white/10 px-4 py-4 text-sm text-slate-200"
                >
                  <span className="font-black text-white">{index + 1}</span>
                  <div>
                    <p className="font-semibold text-white">
                      {player?.profile?.username || "Unknown player"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {player?.profile?.games?.[0]?.accountId || "No account tag"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {player?.profile?.socialAccounts?.discord ? (
                      <FaDiscord className="text-indigo-300" />
                    ) : null}
                    {player?.profile?.socialAccounts?.instagram ? (
                      <FaInstagram className="text-pink-300" />
                    ) : null}
                    {player?.profile?.socialAccounts?.twitter ? (
                      <FaTwitter className="text-cyan-300" />
                    ) : null}
                  </div>
                  <span className="text-right font-black text-white">
                    {player?.score ?? "-"}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-4 py-10 text-center text-sm text-slate-400">
                No leaderboard data available yet.
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

const rulesData = [
  {
    title: "Registration Requirements",
    points: [
      "All players must be registered on the platform before joining.",
      "Players must connect the required game account.",
      "Each player must have a valid and active account.",
    ],
  },
  {
    title: "Clan Requirements",
    points: [
      "Clans must have Friendly War settings enabled.",
      "War Log must be set to Public for transparency.",
    ],
  },
  {
    title: "Tournament Start and Match Procedure",
    points: [
      "10 minutes to join the designated clan and send a Friendly Battle request.",
      "5 minutes of preparation time after both teams are ready.",
      "30 minutes battle time once the war is initiated.",
    ],
  },
];

export default TournamentDetails;
