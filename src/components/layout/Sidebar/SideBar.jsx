import { CgProfile } from "react-icons/cg";
import { MdOutlineCastle } from "react-icons/md";
import { CgGames } from "react-icons/cg";
import { IoIosNotificationsOutline } from "react-icons/io";
import { CiWallet } from "react-icons/ci";
import { Link } from "react-router-dom";

const SideBar = () => {
  return (
    <aside className="sidebar fixed bottom-0 md:bottom-auto md:left-0 md:top-14 md:h-screen bg-white w-full md:w-16 h-16 md:flex md:flex-col md:justify-start md:items-center flex justify-around items-center shadow-lg z-50 border-t md:border-t-0 md:border-r border-gray-300 md:gap-7 md:pt-7">
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
        to="/dashboard/game"
        className="text-gray-600 hover:text-blue-500 transition duration-200"
      >
        <CgGames size={30} />
      </Link>
      <Link
        to="/dashboard/notifications"
        className="text-gray-600 hover:text-blue-500 transition duration-200"
      >
        <IoIosNotificationsOutline size={30} />
      </Link>
      <Link
        to="/dashboard/wallet"
        className="text-gray-600 hover:text-blue-500 transition duration-200"
      >
        <CiWallet size={30} />
      </Link>
    </aside>
  );
};

export default SideBar;
