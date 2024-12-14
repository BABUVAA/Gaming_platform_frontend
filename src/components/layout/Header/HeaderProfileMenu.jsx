import { Link } from "react-router-dom";
import "../../../styles/ProfileMenu.css";
import { CiUser } from "react-icons/ci";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../../store/authSlice";

const HeaderProfileMenu = () => {
  const dispatch = useDispatch();

  return (
    <>
      <nav className="profile-menu">
        <input type="checkbox" id="profile-menu-active" />
        <label htmlFor="profile-menu-active" className="profile-menu-block">
          <CiUser size={30} className="profile-icon" />
        </label>
        <label id="profile-overlay" htmlFor="profile-menu-active" />
        <div className="profile-links-container">
          <legend>Icon: Username</legend>
          <hr />
          <Link to="profile">My Profile</Link>
          <Link to="account">Account Settings</Link>
          <Link to="wallet">Wallet</Link>
          <Link to="refer">Refer a Friend</Link>
          <Link to="/" onClick={dispatch(logout)}>
            Logout
          </Link>
        </div>
      </nav>
    </>
  );
};
export default HeaderProfileMenu;
