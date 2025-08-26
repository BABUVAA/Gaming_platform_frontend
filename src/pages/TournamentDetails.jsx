import { useEffect, useMemo, useState } from "react";
import {
  FaDiscord,
  FaInstagram,
  FaShareNodes,
  FaSteam,
  FaTwitch,
  FaTwitter,
  FaYoutube,
} from "react-icons/fa6";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { fetchTournamentById } from "../store/tournamentSlice";
import { FaClock, FaPlay } from "react-icons/fa6";

const pad = (n) => String(n).padStart(2, "0");
const formatHMS = (ms) => {
  if (ms <= 0 || !Number.isFinite(ms)) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};
const clamp01 = (x) => Math.max(0, Math.min(1, x));

const TournamentDetails = () => {
  const [activeTab, setActiveTab] = useState("overview"); // Default active tab
  const { id } = useParams(); // Get tournament ID from URL
  const dispatch = useDispatch();
  const { tournamentId } = useSelector((store) => store.tournament);

  useEffect(() => {
    dispatch(fetchTournamentById(id));
  }, [id, dispatch]);

  let filledPercentage =
    tournamentId?.mode !== "solo"
      ? (tournamentId?.registeredTeams?.length /
          tournamentId?.maxParticipants) *
        100
      : (tournamentId?.registeredPlayers?.length /
          tournamentId?.maxParticipants) *
        100;
  const isJoinDisabled =
    tournamentId?.status === "completed" || filledPercentage >= 100;
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <TournamentBanner
        title={tournamentId?.tournamentName}
        bannerUrl={tournamentId?.imageUrl}
        status={tournamentId?.status}
        matchStartDate={tournamentId?.matchStartDate}
        preparationTime={tournamentId?.preparationTime}
        battleDuration={tournamentId?.battleDuration}
      />
      <TournamentData
        title={tournamentId?.tournamentName}
        status={tournamentId?.status}
        prizePool={tournamentId?.prizePool}
        entry={tournamentId?.entryFee}
        maxParticipants={tournamentId?.maxParticipants}
        joinedParticipants={tournamentId?.registeredPlayers?.length}
        gameName={tournamentId?.game}
      />
      <TournamentTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        rules={rulesData}
        leaderboard={tournamentId?.registeredPlayers}
      />
    </div>
  );
};

const TournamentData = ({
  title,
  gameName,
  prizePool,
  entry,
  maxParticipants,
  joinedParticipants,
}) => {
  return (
    <div className="max-w-4xl mx-auto my-6 p-6 bg-gray-900 rounded-2xl shadow-xl text-white">
      {/* Title */}
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
        {title}
      </h2>

      {/* Game Name */}
      <p className="text-sm sm:text-base text-gray-400 mb-6">
        Game: <span className="text-white font-semibold">{gameName}</span>
      </p>

      {/* Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-5 rounded-xl text-center shadow-md hover:shadow-xl transition hover:bg-gray-700">
          <h3 className="text-sm font-medium text-gray-400 mb-2">
            🏆 Prize Pool
          </h3>
          <p className="text-2xl sm:text-3xl font-bold text-blue-400">
            ₹ {prizePool}
          </p>
        </div>
        <div className="bg-gray-800 p-5 rounded-xl text-center shadow-md hover:shadow-xl transition hover:bg-gray-700">
          <h3 className="text-sm font-medium text-gray-400 mb-2">
            🎟 Entry Fee
          </h3>
          <p className="text-2xl sm:text-3xl font-bold text-green-400">
            ₹ {entry}
          </p>
        </div>
        <div className="bg-gray-800 p-5 rounded-xl text-center shadow-md hover:shadow-xl transition hover:bg-gray-700">
          <h3 className="text-sm font-medium text-gray-400 mb-2">
            👥 Participants
          </h3>
          <p className="text-2xl sm:text-3xl font-bold text-yellow-400">
            {joinedParticipants} / {maxParticipants}
          </p>
        </div>
      </div>
    </div>
  );
};
const TournamentTabs = ({
  activeTab,
  setActiveTab,
  rules = [],
  leaderboard = [],
}) => {
  const tabs = ["overview", "leaderboard"];

  return (
    <div className="max-w-4xl mx-auto my-6 bg-gray-900 rounded-xl shadow-lg text-white overflow-hidden">
      {/* Tab Buttons */}
      <div className="flex border-b border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-center font-semibold transition-all duration-300 ${
              activeTab === tab
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6 text-gray-200 space-y-6">
        {activeTab === "overview" && (
          <div className="space-y-4">
            {rules.length > 0 ? (
              rules.map((rule, idx) => (
                <div
                  key={idx}
                  className="bg-gray-800 border border-gray-700 p-4 rounded-lg shadow-md hover:scale-105 transition-transform duration-200"
                >
                  <h3 className="font-bold text-lg mb-2">{`${idx + 1}. ${
                    rule.title
                  }`}</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-300">
                    {rule.points.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <p className="text-gray-400">No rules available.</p>
            )}
          </div>
        )}

        {activeTab === "leaderboard" && (
          <div className="p-6 bg-white rounded-2xl shadow-lg">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">
              🏆 Leaderboard
            </h3>

            {leaderboard && leaderboard.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-gray-600 text-sm text-left">
                      <th className="px-4 py-2">#</th>
                      <th className="px-4 py-2">Player</th>
                      <th className="px-4 py-2">Social</th>
                      <th className="px-4 py-2 text-center">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((player, index) => (
                      <tr
                        key={player.id || index}
                        className="bg-gray-50 hover:bg-gray-100 transition rounded-lg shadow-sm"
                      >
                        {/* Rank */}
                        <td className="px-4 py-3 text-center font-semibold text-gray-700">
                          {index + 1}
                        </td>

                        {/* Player */}
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-800">
                            {player?.profile.username || "Unknown"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {player.profile.games?.[0]?.accountId || "—"}
                            {" - "}
                            {player.profile.games?.[0]?.accountUsername}
                          </div>
                        </td>

                        {/* Social */}
                        <td className="px-4 py-3">
                          <div className="flex gap-3">
                            {player?.profile?.socialAccounts?.discord && (
                              <a
                                href={`https://discord.com/users/${player.profile.socialAccounts.discord}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <FaDiscord className="w-5 h-5 text-indigo-600 hover:scale-110 transition" />
                              </a>
                            )}
                            {player?.profile?.socialAccounts?.instagram && (
                              <a
                                href={`https://instagram.com/${player.profile.socialAccounts.instagram}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <FaInstagram className="w-5 h-5 text-pink-500 hover:scale-110 transition" />
                              </a>
                            )}
                            {player?.profile?.socialAccounts?.twitter && (
                              <a
                                href={`https://twitter.com/${player.profile.socialAccounts.twitter}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <FaTwitter className="w-5 h-5 text-blue-400 hover:scale-110 transition" />
                              </a>
                            )}
                          </div>
                        </td>

                        {/* Score */}
                        <td className="px-4 py-3 text-center font-bold text-gray-700">
                          {player.score ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 italic">No leaderboard data yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
const TournamentBanner = ({
  bannerUrl,
  title,
  status,
  matchStartDate,
  preparationTime = 900,
  battleDuration = 2700,
}) => {
  const startMs = useMemo(
    () => (matchStartDate ? new Date(matchStartDate).getTime() : null),
    [matchStartDate]
  );

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  let phaseMeta;
  if (!startMs) {
    phaseMeta = {
      label: "Tournament not started yet",
      timerLabel: "",
      target: null,
    };
  } else {
    const prepEnd = startMs + preparationTime * 1000;
    const battleEnd = prepEnd + battleDuration * 1000;

    if (now < startMs) {
      // Waiting for start
      phaseMeta = {
        label: "Upcoming",
        timerLabel: "Starts in",
        target: startMs,
      };
    } else if (now < prepEnd) {
      // Preparation
      phaseMeta = {
        label: "Preparation",
        timerLabel: "Prep ends in",
        target: prepEnd,
      };
    } else if (now < battleEnd) {
      // Battle
      phaseMeta = {
        label: "Battle Live",
        timerLabel: "Ends in",
        target: battleEnd,
      };
    } else {
      // Completed
      phaseMeta = { label: "Completed", timerLabel: "", target: null };
    }
  }

  const msLeft = phaseMeta.target ? phaseMeta.target - now : 0;

  const statusColor =
    status === "completed"
      ? "bg-emerald-500/90"
      : status === "cancelled"
      ? "bg-rose-600/90"
      : status === "ongoing"
      ? "bg-orange-500/90"
      : status === "active"
      ? "bg-yellow-500/90"
      : status === "registration_open"
      ? "bg-blue-600/90"
      : "bg-gray-500/90";

  return (
    <div className="relative w-full h-[280px] sm:h-[380px] md:h-[460px] lg:h-[540px] overflow-hidden rounded-xl shadow-xl">
      {/* Background */}
      <img
        src={bannerUrl || "/pubg_background.jpg"}
        alt={title}
        className="w-full h-full object-cover brightness-90"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        {/* Title */}
        <h1 className="max-w-3xl text-white font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-tight drop-shadow-md">
          {title || "Tournament"}
        </h1>

        {/* Phase Badge */}
        {(status === "active" ||
          status === "ongoing" ||
          status === "registration_open" ||
          status === "upcoming") && (
          <span
            className={`mt-2 inline-block px-4 py-1 rounded-full text-sm sm:text-base font-medium shadow-lg ${statusColor}`}
          >
            {phaseMeta.label}
          </span>
        )}

        {/* Timer Box */}
        {(status === "upcoming" ||
          status === "registration_open" ||
          status === "active" ||
          status === "ongoing") && (
          <div className="mt-4 sm:mt-6 bg-white/10 border border-white/20 text-white rounded-2xl shadow-lg backdrop-blur-md px-6 py-3 flex flex-col items-center">
            <div className="flex items-center gap-2 justify-center text-xs sm:text-sm opacity-90">
              <FaClock className="shrink-0" />
              <span className="uppercase tracking-wider">
                {phaseMeta.timerLabel}
              </span>
            </div>
            <div className="mt-1 sm:mt-2 font-mono text-3xl sm:text-4xl md:text-5xl leading-none">
              {formatHMS(msLeft)}
            </div>
            <div className="flex gap-3 mt-3">
              <button className="flex items-center gap-1 bg-red-600 hover:bg-red-700 px-4 py-1 rounded-full font-semibold text-sm shadow-md transition">
                <FaPlay /> Watch Live
              </button>
              <button className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 px-4 py-1 rounded-full font-semibold text-sm shadow-md transition">
                <FaShareNodes /> Share
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
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
