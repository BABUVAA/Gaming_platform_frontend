import { useSelector } from "react-redux";
import { SideBar } from "../components";
import { Outlet } from "react-router-dom";
import { useEffect } from "react";

const Dashboard = () => {
  const games = useSelector((store) => store.games);

  return (
    <>
      <div className="content">
        <SideBar />
        <div className="overflow ml-68">
          <Outlet />
        </div>
      </div>
    </>
  );
};

export default Dashboard;

{
  /* <div className="p-l bs">
<h4>Connected Games</h4>
<GameCard type="add_game" />
<h4>Available Games</h4>
<div className="row wrap">
  {games.data.map((game) => (
    <GameCard
      key={game.id}
      character={game.character}
      title={game.title}
      background={game.background}
      background_color={game.background_color}
      div_color={game.div_color}
      type="games"
    />
  ))}
</div>
</div> */
}
