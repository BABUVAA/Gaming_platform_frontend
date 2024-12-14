import "../../styles/GameCard.css";
import { CiCirclePlus } from "react-icons/ci";

const GameCard = ({
  background,
  character,
  title,
  background_color,
  div_color,
  type,
}) => {
  return (
    <>
      <div className={`default_game_card_container ${type}`}>
        {type === "coming_soon" && (
          <>
            <span>Coming Soon</span>
            <div className="txt-muted "> Stay Tuned! </div>
          </>
        )}
        {type === "add_game" && (
          <>
            <CiCirclePlus fill="#000000" size={30} />
            <span className="txt-muted m-b-s">Add Game</span>
          </>
        )}
        {type === "games" && (
          <>
            <img className="game_card_background" src={background} />
            <div
              className="game_card_background_color"
              style={{ backgroundColor: `${background_color}` }}
            />
            <img src={character} className="game_card_character" />
            <img src={title} className="game_card_title" />
            <div
              className="game_card_play"
              style={{ backgroundColor: `${div_color}` }}
            >
              Play now
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default GameCard;
