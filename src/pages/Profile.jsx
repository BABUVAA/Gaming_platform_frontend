import { useSelector } from "react-redux";
import { Button } from "../components";
import { useEffect } from "react";

const Profile = () => {
  const { user } = useSelector((store) => store.auth);

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

  return (
    <div className="profile-container bg-gray-100 p-6">
      {/* First Section: Profile Picture, Background Poster, Username, Linked Accounts */}
      <div className="profile-header bg-gray-200 p-6 rounded-lg mb-6">
        <div className="flex items-center">
          {/* Background Poster */}
          <div
            className="w-full h-48 bg-cover rounded-lg"
            style={{ backgroundImage: `url('/profile-background.jpg')` }}
          >
            {/* Add any content you want on top of background image */}
          </div>

          {/* Profile Picture and Details */}
          <div className="flex flex-col ml-4">
            <img
              src="/profile-pic.png"
              alt="Profile Picture"
              className="w-32 h-32 rounded-full border-4 border-white mb-4"
            />
            <div>
              <h2 className="text-2xl font-bold">
                {user?.username || "Player"}
              </h2>
              <Button size="medium" className="mt-2 p-2">
                + Add Social Media
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Second Section: Career Statistics and Game Tabs */}
      <div className="career-statistics bg-white p-6 rounded-lg mb-6">
        <h3 className="text-xl font-semibold">Career Statistics</h3>
        <small className="text-sm text-gray-500">
          Player's game-specific statistics
        </small>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-6">
          <div>
            <h4 className="font-medium">Tournaments Entered</h4>
            <p>{tournamentStats.tournamentsEntered}</p>
          </div>
          <div>
            <h4 className="font-medium">Games Played</h4>
            <p>{tournamentStats.gamesPlayed}</p>
          </div>
          <div>
            <h4 className="font-medium">Total Earnings</h4>
            <p>${tournamentStats.totalEarnings}</p>
          </div>
        </div>

        {/* Game Tabs (if any specific stats for each game) */}
        <div className="game-tabs mt-6">
          <h4 className="text-lg font-medium">Games</h4>
          <div className="flex gap-4 overflow-x-scroll">
            {games.map((game, index) => (
              <div key={index} className="game-tab border p-4 rounded-lg">
                <img
                  src={`/${game}_title.png`}
                  alt={`${game} Icon`}
                  className="w-12 h-12 mb-2"
                />
                <p className="text-center">{game}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Third Section: Active Participated Tournaments */}
      <div className="active-tournaments bg-white p-6 rounded-lg mb-6">
        <h3 className="text-xl font-semibold">Active Tournaments</h3>
        {activeTournaments.length > 0 ? (
          <div className="mt-4">
            {activeTournaments.map((tournament, index) => (
              <div key={index} className="tournament-entry border-b py-2">
                <h4>{tournament.name}</h4>
                <p className="text-sm text-gray-600">Date: {tournament.date}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No active tournaments</p>
        )}
      </div>

      {/* Fourth Section: Past Tournaments */}
      <div className="past-tournaments bg-white p-6 rounded-lg">
        <h3 className="text-xl font-semibold">Past Tournaments</h3>
        {pastTournaments.length > 0 ? (
          <div className="mt-4">
            {pastTournaments.map((tournament, index) => (
              <div key={index} className="tournament-entry border-b py-2">
                <h4>{tournament.name}</h4>
                <p className="text-sm text-gray-600">Date: {tournament.date}</p>
                <p className="text-sm text-gray-500">
                  Result: {tournament.result}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p>No past tournaments</p>
        )}
      </div>
    </div>
  );
};

export default Profile;
