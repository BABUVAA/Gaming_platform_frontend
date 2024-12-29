import React from "react";
import Input from "../components/ui/Input/Input";
import { useSelector } from "react-redux";
import GameCard from "../components/ui/GameCard/GameCard";

const Game = () => {
  const games = useSelector((store) => store.games);
  return (
    <div className="min-w-full bg-slate-100  container justify-center mb-12  pb-6">
      {/* Search Bar */}
      <div className="my-2">
        <Input type="search" placeholder="Search for games..." />
      </div>
      {/* Connected Games Section */}
      <div className="flex flex-col bg-slate-100 text-left lg:justify-center">
        <h2 className="text-2xl font-bold pt-8 px-4 ">Connected Games</h2>
        <div className="flex flex-col w-full lg:max-w-screen-lg py-8 p-4">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {games?.data?.length > 0 ? (
              games.data.map((game) => (
                <GameCard
                  key={game._id}
                  character={game.character}
                  title={game.title}
                  background={game.background}
                  background_color={game.background_color}
                  div_color={game.div_color}
                  type="games"
                />
              ))
            ) : (
              <p className="text-gray-600">No connected games found.</p>
            )}
            <GameCard type="add_game" />
          </div>
        </div>
      </div>
      {/* Available Games Section */}
      <div className="flex flex-col bg-slate-100 text-left lg:justify-center">
        <h2 className="text-2xl font-bold pt-8 px-4">Available Games</h2>
        <div className="flex flex-col w-full lg:max-w-screen-lg py-8 p-4">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {games?.data?.length > 0 ? (
              games.data.map((game) => (
                <GameCard
                  key={game._id}
                  character={game.character}
                  title={game.title}
                  background={game.background}
                  background_color={game.background_color}
                  div_color={game.div_color}
                  type="games"
                />
              ))
            ) : (
              <p className="text-gray-600">No available games found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;
