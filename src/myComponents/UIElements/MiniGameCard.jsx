import "../../styles/MiniGameCard.css";
import { CiCirclePlus } from "react-icons/ci";

const MiniGameCard = ({ character, div_color, type }) => {
  return (
    <>
      {type === "mini_games" && (
        <div
          className="mini_games_container"
          style={{ backgroundColor: `${div_color}` }}
        >
          <img
            src={character}
            height="40px"
            width="40px"
            className="mini_game_card_title"
          />
        </div>
      )}
      {type === "add_mini_games" && (
        <>
          <div className="mini_games_container">
            <CiCirclePlus size={25} fill="#000000" />
          </div>
        </>
      )}
    </>
  );
};
export default MiniGameCard;
