import { CiCirclePlus } from "react-icons/ci";

const GameCard = ({
  background,
  character,
  title,
  div_color,
  type = "games",
}) => {
  return (
    <div
      className={`relative flex flex-col items-center justify-end rounded-lg overflow-hidden shadow-md transition-transform duration-300 ease-in-out ${
        type === "games" ? "hover:scale-105" : ""
      } h-40 md:h-72 w-[calc(90vw/2)] md:max-w-72`}
    >
      {/* Available Game Variant */}
      {type === "games" && (
        <>
          {/* Background Image */}
          <img
            src={background}
            alt="Game Background"
            className="absolute w-full h-full object-cover opacity-30 group-hover:opacity-100 transition-opacity duration-300"
          />
          {/* Title Layer */}
          <img
            src={title}
            alt="Game Title"
            className="absolute top-5 left-5 w-1/2 max-w-[170px] max-h-12 object-contain z-10"
          />
          {/* Character Layer */}
          <img
            src={character}
            alt="Character"
            className="absolute bottom-10 w-[70%] max-h-[70%] object-contain z-20"
          />
          {/* Play Now Div */}
          <div
            className="relative z-30 h-[25%] md:h-[15%] text-white text-center font-semibold py-2 w-full"
            style={{ backgroundColor: div_color }} // Dynamic div color
          >
            Play Now
          </div>
        </>
      )}

      {/* Add Game Variant */}
      {type === "add_game" && (
        <div className="relative flex flex-col items-center justify-center bg-gray-300 w-full h-full rounded-lg hover:bg-gray-400 transition-all">
          <CiCirclePlus className="text-gray-500" size={40} />
          <span className="text-gray-500 text-sm mt-2">Add Game</span>
        </div>
      )}

      {/* Coming Soon Variant */}
      {type === "coming_soon" && (
        <div className="relative flex flex-col items-center justify-center bg-gradient-to-r from-gray-800 via-gray-600 to-gray-400 text-white w-full h-full rounded-lg transition-all">
          <span className="text-2xl font-bold">Coming Soon</span>
          <span className="text-sm mt-2">Stay Tuned!</span>
        </div>
      )}
    </div>
  );
};

export default GameCard;
