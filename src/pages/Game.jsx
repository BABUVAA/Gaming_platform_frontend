import React, { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import Input from "../components/ui/Input/Input";
import GameCard from "../components/ui/GameCard/GameCard";
import { profile_data_update, user_profile } from "../store/authSlice";
import GameConnectForm from "../components/feature/GameConnectForm";

const Game = () => {
  const [selectedGame, setSelectedGame] = useState();
  console.log("selected", selectedGame);
  const dispatch = useDispatch();
  const games = useSelector((store) => store.games?.data || []);
  const stableConnectedGames = useSelector(
    (store) => store.auth?.profile?.profile?.games
  );
  const connectedGames = useMemo(
    () => stableConnectedGames || [],
    [stableConnectedGames]
  );

  const [isModalOpen, setModalOpen] = useState(false);

  // Handle Connect / Disconnect
  const handleGameAction = async (game, action) => {
    let actionType = action === "connect" ? "add" : "remove";
    await dispatch(
      profile_data_update({
        action: actionType,
        field: "profile.games",
        data: game,
      })
    );
    await dispatch(user_profile());
  };

  return (
    <div className="min-w-full bg-slate-100 container justify-center mb-12 pb-6">
      {/* Search Bar */}
      <div className="my-2">
        <Input type="search" placeholder="Search for games..." />
      </div>

      {/* Connected Games Section */}
      <div className="flex flex-col bg-slate-100 text-left lg:justify-center">
        <h2 className="text-2xl font-bold pt-8 px-4">Connected Games</h2>
        <div className="flex flex-col w-full lg:max-w-screen-lg py-8 p-4">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {connectedGames.length > 0 ? (
              connectedGames.map((game) => (
                <GameCard
                  key={game._id}
                  {...game}
                  link={`/dashboard/tournament/${game.link}`}
                  type="games"
                />
              ))
            ) : (
              <p className="text-gray-600">No connected games found.</p>
            )}
            {/* "Add Game" Button - Opens Modal */}
            <div onClick={() => setModalOpen(true)}>
              <GameCard type="add_game" />
            </div>
          </div>
        </div>
      </div>

      {/* Available Games Section */}
      <div className="flex flex-col bg-slate-100 text-left lg:justify-center">
        <h2 className="text-2xl font-bold pt-8 px-4">Available Games</h2>
        <div className="flex flex-col w-full lg:max-w-screen-lg py-8 p-4">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {games.length > 0 ? (
              games.map((game) => (
                <GameCard
                  key={game._id}
                  {...game}
                  link={`/dashboard/tournament/${game.link}`}
                  type="games"
                />
              ))
            ) : (
              <p className="text-gray-600">No available games found.</p>
            )}
          </div>
        </div>
      </div>

      {/* Add Game Modal */}

      {isModalOpen && (
        <GameConnect
          connectedGames={connectedGames}
          allGames={games}
          setModalOpen={setModalOpen}
          handleGameAction={handleGameAction}
          setSelectedGame={setSelectedGame}
        />
      )}
      {selectedGame && (
        <GameConnectForm
          game={selectedGame}
          onClose={() => setSelectedGame()}
          onSubmit={(data) => {
            console.log("data to set", data);
            setSelectedGame(data);
            // handleGameAction(selectedGame, "connect");

            setModalOpen(false); // optionally close main modal
          }}
        />
      )}
    </div>
  );
};

export default Game;

const GameConnect = ({
  connectedGames,
  allGames,
  setModalOpen,
  handleGameAction,
  setSelectedGame,
}) => (
  <div className="fixed z-50 inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 sm:mx-0 sm:w-96">
      <h3 className="text-2xl font-bold mb-4 text-center text-gray-800">
        Manage Your Games
      </h3>

      <div className="space-y-6 max-h-96 overflow-y-auto pr-2 custom-scroll">
        {/* Connected Games List */}
        {connectedGames.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold mb-2 text-gray-700">
              Connected Games
            </h4>
            <div className="space-y-3">
              {connectedGames.map((game) => (
                <div
                  key={game._id}
                  className="flex items-center justify-between p-3 border rounded-xl bg-gray-50 hover:shadow-md transition"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={game.title}
                      alt={game.name}
                      className="w-10 h-10 object-cover rounded-md"
                    />
                    <span className="text-sm font-medium text-gray-800">
                      {game.name}
                    </span>
                  </div>
                  <button
                    onClick={() => handleGameAction(game, "disconnect")}
                    className="bg-red-500 text-white px-3 py-1.5 text-xs rounded-lg hover:bg-red-600 transition"
                  >
                    Disconnect
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Games List */}
        {allGames.filter(
          (game) => !connectedGames.some((g) => g._id === game._id)
        ).length > 0 && (
          <div>
            <h4 className="text-lg font-semibold mb-2 text-gray-700">
              Available Games
            </h4>
            <div className="space-y-3">
              {allGames
                .filter(
                  (game) => !connectedGames.some((g) => g._id === game._id)
                )
                .map((game) => (
                  <div
                    key={game._id}
                    className="flex items-center justify-between p-3 border rounded-xl bg-gray-50 hover:shadow-md transition"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={game.title}
                        alt={game.name}
                        className="w-10 h-10 object-cover rounded-md"
                      />
                      <span className="text-sm font-medium text-gray-800">
                        {game.name}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        if (game.link === "coc") {
                          setSelectedGame(game);
                        } else {
                          handleGameAction(game, "connect");
                        }
                      }}
                      className="bg-blue-600 text-white px-3 py-1.5 text-xs rounded-lg hover:bg-blue-700 transition"
                    >
                      Connect
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Close Button */}
      <button
        onClick={() => setModalOpen(false)}
        className="mt-6 w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
      >
        Close
      </button>
    </div>
  </div>
);
