import { CgProfile } from "react-icons/cg";
import { MdOutlineCastle } from "react-icons/md";
import { CgGames } from "react-icons/cg";
import { TbTournament } from "react-icons/tb";
import { MdAccountBalance } from "react-icons/md";
import { Link } from "react-router-dom";

const SideBar = () => {
  return (
    <aside className="fixed bottom-0 md:bottom-auto md:left-0 md:top-14 md:h-screen bg-white w-full md:w-16 h-12 md:flex md:flex-col md:justify-start md:items-center flex justify-around items-center shadow-lg z-50 border-t md:border-t-0 md:border-r border-gray-300 md:gap-7 md:pt-7">
      <Link
        to="/dashboard/profile"
        className="text-gray-600 hover:text-blue-500 transition duration-200"
      >
        <CgProfile size={30} />
      </Link>
      <Link
        to="/dashboard/clan"
        className="text-gray-600 hover:text-blue-500 transition duration-200"
      >
        <MdOutlineCastle size={30} />
      </Link>
      <Link
        to="/dashboard"
        className="text-gray-600 hover:text-blue-500 transition duration-200"
      >
        <CgGames size={30} />
      </Link>
      <Link
        to="/dashboard/tournament"
        className="text-gray-600 hover:text-blue-500 transition duration-200"
      >
        <TbTournament size={30} />
      </Link>
      <Link
        to="/dashboard/chats"
        className="text-gray-600 hover:text-blue-500 transition duration-200"
      >
        <MdAccountBalance size={30} />
      </Link>
    </aside>
  );
};

export default SideBar;
