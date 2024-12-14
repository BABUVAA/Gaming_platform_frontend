import { CgProfile } from "react-icons/cg";
import { MdOutlineCastle } from "react-icons/md";
import { CgGames } from "react-icons/cg";
import { IoIosNotificationsOutline } from "react-icons/io";
import { CiWallet } from "react-icons/ci";
import { Link } from "react-router-dom";

const SideBar = () => {
  return (
    <>
      <aside className="sidebar">
        <Link to="/dashboard/profile">
          <CgProfile size={30} />
        </Link>
        <Link to="/dashboard/clan">
          <MdOutlineCastle size={30} />
        </Link>
        <Link to="/dashboard/game">
          <CgGames size={30} />
        </Link>
        <Link to="/dashboard/notifications">
          <IoIosNotificationsOutline size={30} />
        </Link>
        <Link to="/dashboard/wallet">
          <CiWallet size={30} />
        </Link>
      </aside>
    </>
  );
};

export default SideBar;
