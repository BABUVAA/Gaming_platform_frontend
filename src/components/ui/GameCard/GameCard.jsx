import { CiCirclePlus } from "react-icons/ci";
import { Link } from "react-router-dom";

const GameCard = ({
  background,
  character,
  title,
  link,
  div_color,
  type = "games",
}) => {
  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border border-slate-800 shadow-[0_18px_50px_rgba(2,8,23,0.45)] transition ${
        type === "games" ? "hover:-translate-y-1 hover:border-slate-700" : ""
      } h-44 md:h-80`}
    >
      {type === "games" && (
        <>
          <img
            src={background}
            alt="Game Background"
            className="absolute inset-0 h-full w-full object-cover opacity-45 transition duration-300 group-hover:scale-105 group-hover:opacity-60"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(2,6,23,0.15),_rgba(2,6,23,0.8)_58%,_rgba(2,6,23,0.98))]" />
          <img
            src={title}
            alt="Game Title"
            className="absolute left-5 top-5 z-10 max-h-12 w-1/2 max-w-[170px] object-contain"
          />
          <img
            src={character}
            alt="Character"
            className="absolute bottom-16 left-1/2 z-20 max-h-[68%] w-[78%] -translate-x-1/2 object-contain transition duration-300 group-hover:translate-y-[-4px]"
          />

          <div
            className="absolute bottom-0 z-30 flex w-full items-center justify-between px-5 py-4 text-white"
            style={{ backgroundColor: div_color }}
          >
            <span className="text-sm font-black uppercase tracking-[0.18em]">
              Queue Up
            </span>
            <Link to={link} className="text-sm font-semibold">
              Open
            </Link>
          </div>
        </>
      )}

      {type === "add_game" && (
        <div className="flex h-full w-full flex-col items-center justify-center bg-[linear-gradient(135deg,_#0f172a,_#111827)] text-slate-300 transition hover:bg-[linear-gradient(135deg,_#111827,_#1e293b)]">
          <CiCirclePlus className="text-cyan-300" size={44} />
          <span className="mt-3 text-sm font-semibold uppercase tracking-[0.18em]">
            Add Game
          </span>
        </div>
      )}

      {type === "coming_soon" && (
        <div className="flex h-full w-full flex-col items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),_transparent_30%),linear-gradient(135deg,_#1f2937,_#111827)] text-white">
          <span className="text-2xl font-black uppercase tracking-[0.18em]">
            Coming Soon
          </span>
          <span className="mt-2 text-sm text-slate-300">New battlegrounds are on deck.</span>
        </div>
      )}
    </div>
  );
};

export default GameCard;
