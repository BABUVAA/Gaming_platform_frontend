import "../../../styles/HeaderBurgerMenu.css";
import { CiMenuBurger } from "react-icons/ci";
import { RiCloseFill } from "react-icons/ri";
import { Link } from "react-router-dom";
import { useRef } from "react";
import Button from "../../ui/Button/Button";
import useNavigateHook from "../../../hooks/useNavigateHook";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../../store/authSlice";

const HeaderBurgerMenu = () => {
  const { isAuthenticated } = useSelector((store) => store.auth);

  // Create a ref for the checkbox
  const menuCheckboxRef = useRef(null);

  // Function to close the menu
  const closeMenu = () => {
    if (menuCheckboxRef.current) {
      menuCheckboxRef.current.checked = false;
    }
  };

  const { goToLogin } = useNavigateHook();
  return (
    <>
      <nav className="Menu">
        <input
          type="checkbox"
          id="menu-sidebar-active"
          ref={menuCheckboxRef} // Attach the ref
        />
        <label
          htmlFor="menu-sidebar-active"
          className="menu-open-sidebar-button"
        >
          <CiMenuBurger size={30} className="menu-icon" />
        </label>
        <div className="menu-links-container">
          <div className="row sb w-100">
            {!isAuthenticated && (
              <label
                htmlFor="menu-sidebar-active"
                className="menu-close-sidebar-button"
                onClick={goToLogin}
              >
                <Button onClick={closeMenu}>Login</Button>
              </label>
            )}
            <label
              htmlFor="menu-sidebar-active"
              className="menu-close-sidebar-button "
            >
              <RiCloseFill size={30} className="menu-icon" />
            </label>
          </div>
          <hr />
          <Link to="/" onClick={closeMenu}>
            Home
          </Link>
          <hr />
          {isAuthenticated && (
            <div>
              <Link to="/dashboard" onClick={closeMenu}>
                Dashboard
              </Link>
              <Link to="/profile" onClick={closeMenu}>
                Profile
              </Link>
              <Link to="/wallet" onClick={closeMenu}>
                Wallet
              </Link>
              <Link to="/account" onClick={closeMenu}>
                Account
              </Link>
              <Link
                to="/"
                onClick={() => {
                  const dispatch = useDispatch();
                  closeMenu();
                  dispatch(logout());
                }}
              >
                Logout
              </Link>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default HeaderBurgerMenu;
