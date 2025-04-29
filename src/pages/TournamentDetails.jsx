import React, { useEffect, useState } from "react";
import {
  FaDiscord,
  FaInstagram,
  FaSteam,
  FaTwitch,
  FaTwitter,
  FaYoutube,
} from "react-icons/fa6";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { fetchTournamentById } from "../store/tournamentSlice";

const TournamentDetails = () => {
  const [activeTab, setActiveTab] = useState("Rules"); // Default active tab
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
      />
      <TournamentData
        title={tournamentId?.tournamentName}
        status={tournamentId?.status}
        prizePool={tournamentId?.prizePool}
        entry={tournamentId?.entryFee}
      />
      <TournamentTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      {/* Tournament Info */}
      <div className="max-w-4xl mx-auto p-6">
        {/* Players Progress */}
        <div className="mt-6">
          <p className="text-gray-300 text-sm">Players Joined</p>
          <div className="relative w-full bg-gray-700 rounded-full h-4 mt-2">
            <div
              className="bg-green-500 h-4 rounded-full"
              style={{ width: `${filledPercentage}%` }}
            ></div>
          </div>
          <p className="text-gray-300 text-sm mt-1">
            {tournamentId?.mode !== "solo"
              ? `${tournamentId?.registeredTeams?.length} / ${tournamentId?.maxParticipants} Teams`
              : `${tournamentId?.registeredPlayers?.length} / ${tournamentId?.maxParticipants} Players`}
          </p>
        </div>

        {/* Join Button */}
        {tournamentId?.status === "registration_open" && (
          <button
            disabled={isJoinDisabled}
            className={`mt-6 w-full py-3 rounded-lg text-lg font-semibold transition-all ${
              isJoinDisabled
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isJoinDisabled && tournamentId?.status === "active"
              ? "Tournament Full"
              : "Join Tournament"}
          </button>
        )}

        <div
          className={`mt-6 text-center w-full py-3 rounded-lg text-lg font-semibold transition-all ${
            isJoinDisabled
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {" "}
          {isJoinDisabled && tournamentId?.status === "active"
            ? "Tournament Full"
            : "Join Tournament"}
        </div>
      </div>
    </div>
  );
};

const TournamentBanner = ({ bannerUrl, title }) => {
  return (
    <div className="relative w-full h-[250px] sm:h-[350px] md:h-[450px] lg:h-[500px]">
      {/* Banner Image */}
      <img
        src={bannerUrl || "/pubg_background.jpg"}
        alt={title}
        className="w-full h-full object-cover"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
        <h1 className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center">
          {title}
        </h1>
      </div>
    </div>
  );
};
const TournamentData = ({ title, status, prizePool, entry }) => {
  return (
    <>
      {/* Tournament Details & Social Section */}
      <div className="w-full mx-auto bg-white p-6 shadow-md flex flex-col gap-2 lg:flex-row justify-between items-center text-gray-800">
        {/* Social Media Links */}
        <div className="w-full flex flex-col md:flex-row gap-2">
          <div className="flex sm:w-60 w-full md:order-2 justify-start items-center space-x-4">
            <FaTwitch size={30} className="cursor-pointer text-purple-500" />
            <FaYoutube size={30} className="cursor-pointer text-red-500" />
            <FaTwitter size={30} className="cursor-pointer text-blue-400" />
            <FaInstagram size={30} className="cursor-pointer text-pink-500" />
            <FaDiscord size={30} className="cursor-pointer text-blue-500" />
          </div>

          {/* Tournament Name & Match Status */}
          <div className=" w-full text-start md:order-1 md:text-left">
            <h1 className="text-base font-bold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-600">{status}</p>
          </div>
        </div>

        {/* Prize & Entry Details */}
        <div className="w-full flex flex-row py-3 border-b items-center justify-between md:items-start">
          <h3 className="text-sm font-bold">🏆 Prize Pool</h3>
          <p className="text-sm font-semibold text-blue-600">₹ {prizePool}</p>
        </div>
        <div className="w-full flex flex-row py-3 border-b items-center justify-between md:items-start">
          <h3 className="text-sm font-bold ">🎟 Entry Fees</h3>
          <p className="text-sm font-semibold text-green-600">₹ {entry}</p>
        </div>
      </div>
    </>
  );
};
const TournamentTabs = ({ activeTab, setActiveTab }) => {
  const tabs = [
    "Overview",
    "Leaderboard",
    "Watch Live",
    "Prize Pool",
    "Scoring",
    "Rules",
  ];

  return (
    <div className="w-full bg-white shadow-md p-4">
      {/* Tabs Container */}
      <div className="flex flex-wrap border-b overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`px-6 py-2 text-md font-semibold whitespace-nowrap transition-all duration-300 ${
              activeTab === tab
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content Area */}
      <div className="p-4 text-gray-700">
        {activeTab === "Overview" && <p>Overview Content Goes Here...</p>}
        {activeTab === "Leaderboard" && <p>Leaderboard Details...</p>}
        {activeTab === "Watch Live" && <p>Live Streaming Information...</p>}
        {activeTab === "Prize Pool" && <p>Prize Details & Distribution...</p>}
        {activeTab === "Scoring" && <p>Scoring System Breakdown...</p>}
        {activeTab === "Rules" && <Rules />}
      </div>
    </div>
  );
};

const Rules = () => (
  <div className="mt-6 bg-gray-700">
    <h2 className="text-xl font-semibold">
      📜 Clash of Clans Tournament Rules (Official)
    </h2>

    <ul className="text-gray-400 mt-4 space-y-6 list-disc pl-5">
      {/* 1. Registration Requirements */}
      <li>
        <span className="font-semibold text-white">
          1. Registration Requirements
        </span>
        <ul className="list-disc pl-5 mt-2 space-y-2">
          <li>
            All players must be registered on the platform before joining the
            tournament.
          </li>
          <li>
            Players must connect the required Clash of Clans (CoC) game account
            to their profile.
          </li>
          <li>
            Each player must have a valid and active Clash of Clans account.
          </li>
          <li>
            Players must either join a valid clan or create a valid clan to
            participate.
          </li>
          <li>
            Only the registered account is allowed to play in the tournament
            matches.
          </li>
        </ul>
      </li>

      {/* 2. Clan Requirements */}
      <li>
        <span className="font-semibold text-white">2. Clan Requirements</span>
        <ul className="list-disc pl-5 mt-2 space-y-2">
          <li>Clans must have Friendly War settings enabled.</li>
          <li>War Log must be set to Public for transparency.</li>
          <li>Only clans consisting of registered players are allowed.</li>
          <li>
            No outsiders or alternate accounts are allowed during tournament
            matches.
          </li>
        </ul>
      </li>

      {/* 3. Tournament Start and Match Procedure */}
      <li>
        <span className="font-semibold text-white">
          3. Tournament Start and Match Procedure
        </span>
        <ul className="list-disc pl-5 mt-2 space-y-2">
          <li>
            Once the tournament is full or started:
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>
                10 minutes to join the designated clan and send a Friendly
                Battle request.
              </li>
              <li>5 minutes of preparation time after both teams are ready.</li>
              <li>30 minutes battle time once the war is initiated.</li>
            </ul>
          </li>
          <li>
            Team A (first mentioned team) must send the Friendly War request.
          </li>
          <li>Team B must accept the Friendly War request promptly.</li>
        </ul>
      </li>

      {/* 4. Disqualification and Irregularities */}
      <li>
        <span className="font-semibold text-white">
          4. Disqualification and Irregularities
        </span>
        <ul className="list-disc pl-5 mt-2 space-y-2">
          <li>
            Any irregularity (e.g., unregistered players, account mismatch, war
            log hidden, refusal to start/accept battle) will lead to immediate
            disqualification.
          </li>
          <li>
            Deliberate delays or refusal to cooperate during match setup will
            not be tolerated.
          </li>
        </ul>
      </li>

      {/* 5. Important Notes */}
      <li>
        <span className="font-semibold text-white">5. Important Notes</span>
        <ul className="list-disc pl-5 mt-2 space-y-2">
          <li>
            Players are responsible for ensuring their account and clan setup is
            complete before the match time.
          </li>
          <li>
            Admins' decisions are final in any dispute or irregular situation.
          </li>
        </ul>
      </li>
    </ul>
  </div>
);
export default TournamentDetails;
