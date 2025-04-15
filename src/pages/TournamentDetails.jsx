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
  }, [id]);

  const filledPercentage =
    (tournamentId?.registeredPlayers.length / tournamentId?.maxParticipants) *
    100;

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
            {tournamentId?.registeredPlayers.length} /{" "}
            {tournamentId?.maxParticipants} Players
          </p>
        </div>

        {/* Rules & Description */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold">📜 Rules</h2>
          <ul className="text-gray-400 mt-2 space-y-2 list-disc pl-5">
            {/* {rules.map((rule, index) => (
              <li key={index}>{rule}</li>
            ))} */}
          </ul>
        </div>

        {/* Join Button */}
        <button className="mt-6 w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg text-lg font-semibold">
          Join Tournament
        </button>
      </div>
    </div>
  );
};
const TournamentBanner = ({ bannerUrl, title }) => {
  return (
    <div className="relative w-full h-[250px] sm:h-[350px] md:h-[450px] lg:h-[500px]">
      {/* Banner Image */}
      <img
        src={"/pubg_background.jpg" || bannerUrl}
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
const TournamentData = ({ title, status }) => {
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
          <p className="text-sm font-semibold text-blue-600">$250.00</p>
        </div>
        <div className="w-full flex flex-row py-3 border-b items-center justify-between md:items-start">
          <h3 className="text-sm font-bold ">🎟 Entry Type</h3>
          <p className="text-sm font-semibold text-green-600">Free Entry</p>
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
        {activeTab === "Rules" && <p>Rules & Regulations for Tournament...</p>}
      </div>
    </div>
  );
};

export default TournamentDetails;
