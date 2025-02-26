import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import Input from "../components/ui/Input/Input";
import GameCard from "../components/ui/GameCard/GameCard";
import { profile_data_update, user_profile } from "../store/authSlice";

const Game = () => {
  const dispatch = useDispatch();
  const games = useSelector((store) => store.games?.data || []);

  const connectedGames = useSelector(
    (store) => store.auth?.profile?.profile?.games || []
  );

  const [isModalOpen, setModalOpen] = useState(false);

  // Handle Connect / Disconnect
  const handleGameAction = async (game, action) => {
    let updatedGames =
      action === "connect"
        ? [...connectedGames, game]
        : connectedGames.filter((g) => g._id !== game._id);

    await dispatch(
      profile_data_update({ field: "profile.games", data: updatedGames })
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
                <GameCard key={game._id} {...game} type="games" />
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
                <GameCard key={game._id} {...game} type="games" />
              ))
            ) : (
              <p className="text-gray-600">No available games found.</p>
            )}
          </div>
        </div>
      </div>

      {/* Add Game Modal */}

      {isModalOpen && (
        <div className="fixed z-50 inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-xl font-semibold mb-4">Manage Your Games</h3>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {/* Connected Games List */}
              {connectedGames.length > 0 && (
                <>
                  <h4 className="text-lg font-semibold">Connected Games</h4>
                  {connectedGames.map((game) => (
                    <div
                      key={game._id}
                      className="flex items-center justify-between p-2 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={game.title} // Assuming game.title contains the image URL
                          alt={game.name}
                          className="w-16 h-5 object-cover rounded-md"
                        />
                        <span className="text-sm">{game.name}</span>
                      </div>
                      <button
                        onClick={() => handleGameAction(game, "disconnect")}
                        className="bg-red-600 text-white px-4 py-1 rounded-md hover:bg-red-700"
                      >
                        Disconnect
                      </button>
                    </div>
                  ))}
                </>
              )}

              {/* Available Games List */}
              {games.filter(
                (game) => !connectedGames.some((g) => g._id === game._id)
              ).length > 0 && (
                <>
                  <h4 className="text-lg font-semibold mt-4">
                    Available Games
                  </h4>
                  {games
                    .filter(
                      (game) => !connectedGames.some((g) => g._id === game._id)
                    )
                    .map((game) => (
                      <div
                        key={game._id}
                        className="flex items-center justify-between p-2 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={game.title} // Assuming game.title contains the image URL
                            alt={game.name}
                            className="w-16 h-5 object-cover rounded-md"
                          />
                          <span className="text-sm">{game.name}</span>
                        </div>
                        <button
                          onClick={() => handleGameAction(game, "connect")}
                          className="bg-blue-600 text-white px-4 py-1 rounded-md hover:bg-blue-700"
                        >
                          Connect
                        </button>
                      </div>
                    ))}
                </>
              )}
            </div>
            {/* Close Button */}
            <button
              onClick={() => setModalOpen(false)}
              className="mt-4 w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;
