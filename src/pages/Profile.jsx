import { useSelector, useDispatch } from "react-redux";
import { CiInstagram } from "react-icons/ci";
import { FaYoutube } from "react-icons/fa";
import { IoIosAdd } from "react-icons/io";
import { FcLikePlaceholder } from "react-icons/fc";
import { useEffect, useState } from "react";
import { user_profile } from "../store/authSlice";

const Profile = () => {
  const { profile, isAuthenticated } = useSelector((store) => store.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(user_profile());
    }
  }, [dispatch]);
  // Example data, replace with actual data from user profile
  const games = ["pubg", "Coc", "valorant", "fortnite"];
  const tournamentStats = {
    tournamentsEntered: 5,
    gamesPlayed: 150,
    totalEarnings: 10000,
  };

  const activeTournaments = [
    { name: "PUBG Championship", date: "2024-12-28" },
    { name: "Coc Clan League", date: "2024-12-15" },
  ];

  const pastTournaments = [
    { name: "PUBG Invitational", date: "2024-11-10", result: "Won" },
    { name: "Coc World Cup", date: "2024-10-5", result: "Runner-Up" },
  ];

  //Section 1: Profile Information
  const ProfileHeader = ({ profile }) => (
    <div className="bg-white  relative rounded-lg mb-6 overflow-hidden h-[300px]">
      {/* Banner */}
      <div
        className="absolute top-0 left-0 w-full h-[160px] bg-cover bg-center"
        style={{ backgroundImage: `url('/pubg_background.jpg')` }}
      ></div>

      {/* Overlay for banner */}
      <div className="absolute inset-0 bg-white opacity-30 "></div>

      {/* Profile Picture, Username, and Social Media */}
      <div className="relative flex items-start justify-between p-4 sm:p-6  h-full">
        {/* Left Section */}
        <div className="flex flex-col items-center absolute bottom-10 ">
          {/* Profile Picture */}
          <img
            src="/profile-pic.png"
            alt="Profile Picture"
            className="w-[120px] h-[120px] rounded-full border-4 border-white sm:mt-0 mt-4"
          />
          {/* Username */}
          <h2 className="text-xl font-bold text-black">
            {profile?.profile.username || "Player"}
          </h2>
        </div>

        {/* Right Section: Social Media */}

        <div className="absolute bottom-2 right-2 flex items-start gap-1">
          <FcLikePlaceholder size={20} />
          <CiInstagram size={20} />
          <FaYoutube size={20} />
          <IoIosAdd size={20} />
        </div>
      </div>

      {/* Centralized Layout for Smaller Screens */}
      {/* <div className="sm:hidden absolute bottom-4 left-0 right-0 text-center">
        <h2 className="text-xl font-bold text-white">
          {user?.username || "Player"}
        </h2>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="text-sm text-white">
            <i className="fas fa-thumbs-up"></i> 1.2K Likes
          </span>
          <Button size="small" className="p-1 text-sm bg-blue-600 text-white">
            + Add Friend
          </Button>
        </div>
      </div> */}
    </div>
  );

  // Section 2: Career Statistics with Tab System
  const CareerStatistics = () => {
    const [activeTab, setActiveTab] = useState("PUBG");

    // Example data for games
    const gameStats = {
      PUBG: {
        tournamentsEntered: 3,
        gamesPlayed: 120,
        totalEarnings: 5000,
      },
      CoC: {
        tournamentsEntered: 2,
        gamesPlayed: 30,
        totalEarnings: 2000,
      },
    };

    const games = ["PUBG", "CoC"];
    const activeGameStats = gameStats[activeTab];

    return (
      <div className="career-statistics-wrapper mb-6 bg-gradient-to-b from-blue-50 to-blue-100 ">
        {/* Container */}
        <div className="career-statistics  bg-white p-8 rounded-lg shadow-lg mx-auto">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">
            Career Statistics
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Explore your performance across different games
          </p>

          {/* Tabs */}
          <div className="tabs flex justify-start gap-6 border-b pb-2 mb-6">
            {games.map((game) => (
              <button
                key={game}
                className={`relative py-2 px-4 text-sm font-medium rounded-t-md focus:outline-none transition-colors ${
                  activeTab === game
                    ? "text-blue-600 border-b-4 border-blue-500"
                    : "text-gray-500 hover:text-blue-400"
                }`}
                onClick={() => setActiveTab(game)}
              >
                {game}
              </button>
            ))}
          </div>

          {/* Active Game Stats */}
          <div className="game-stats grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="stat-card bg-blue-50 p-6 rounded-md shadow-md text-center">
              <h4 className="text-lg font-semibold text-gray-700">
                Tournaments Entered
              </h4>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                {activeGameStats.tournamentsEntered}
              </p>
            </div>
            <div className="stat-card bg-blue-50 p-6 rounded-md shadow-md text-center">
              <h4 className="text-lg font-semibold text-gray-700">
                Games Played
              </h4>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                {activeGameStats.gamesPlayed}
              </p>
            </div>
            <div className="stat-card bg-blue-50 p-6 rounded-md shadow-md text-center">
              <h4 className="text-lg font-semibold text-gray-700">
                Total Earnings
              </h4>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                ${activeGameStats.totalEarnings}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Section 3: Active Tournaments
  const ActiveTournaments = () => (
    <div className="active-tournaments-wrapper mb-6 bg-gradient-to-b from-purple-50 to-purple-100 ">
      <div className="active-tournaments bg-white p-8 rounded-lg shadow-lg  mx-auto">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">
          Active Tournaments
        </h3>
        {activeTournaments.length > 0 ? (
          <div className="tournament-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTournaments.map((tournament, index) => (
              <div
                key={index}
                className="tournament-card bg-purple-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <h4 className="text-lg font-bold text-gray-700 mb-2">
                  {tournament.name}
                </h4>
                <p className="text-sm text-gray-600">
                  <strong>Date:</strong> {tournament.date}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">No active tournaments</p>
        )}
      </div>
    </div>
  );

  // Section 4: Past Tournaments
  const PastTournaments = () => (
    <div className="past-tournaments-wrapper bg-gradient-to-b from-blue-50 to-blue-100 mb-12">
      <div className="past-tournaments bg-white p-8 rounded-lg shadow-lg  mx-auto">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">
          Past Tournaments
        </h3>
        {pastTournaments.length > 0 ? (
          <div className="tournament-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastTournaments.map((tournament, index) => (
              <div
                key={index}
                className="tournament-card bg-blue-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <h4 className="text-lg font-bold text-gray-700 mb-2">
                  {tournament.name}
                </h4>
                <p className="text-sm text-gray-600">
                  <strong>Date:</strong> {tournament.date}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Result:</strong> {tournament.result}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">No past tournaments</p>
        )}
      </div>
    </div>
  );
  return (
    <div className="profile-container bg-gray-100 p-2 gap-1">
      <ProfileHeader profile={profile} />
      <CareerStatistics />
      <ActiveTournaments />
      <PastTournaments />
    </div>
  );
};

export default Profile;
