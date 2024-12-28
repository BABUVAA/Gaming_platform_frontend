import { useState } from "react";
import { useSelector } from "react-redux";
import useNavigateHook from "../../../hooks/useNavigateHook";
import { CiMenuBurger } from "react-icons/ci";
import { RiCloseFill } from "react-icons/ri";
import { Link } from "react-router-dom";
import Button from "../../ui/Button/Button";

const HeaderBurgerMenu = () => {
  const { isAuthenticated } = useSelector((store) => store.auth);
  const [menuOpen, setMenuOpen] = useState(false);

  // Function to toggle the menu state
  const toggleMenu = () => {
    setMenuOpen((prevState) => !prevState);
  };
  const { goToLogin, goToSignUp } = useNavigateHook();

  return (
    <nav className="relative md:hidden z-50 ">
      {/* Menu Open Button */}
      <button onClick={toggleMenu} className="p-2" aria-label="Open menu">
        <CiMenuBurger size={30} className="text-gray-800" />
      </button>

      {/* Menu Content (Slides from Right) */}
      {menuOpen && (
        <div
          className={`fixed top-0 right-0 w-full h-full bg-white shadow-lg z-10 flex flex-col items-start p-4  transition-all duration-1000 ease-in-out transform ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Close Button */}
          <div className="flex justify-between w-full">
            <button
              onClick={toggleMenu}
              className="p-2"
              aria-label="Close menu"
            >
              <RiCloseFill size={30} className="text-gray-800" />
            </button>
            {!isAuthenticated && (
              <UnauthenticatedMenu
                closeMenu={() => setMenuOpen(false)}
                goToLogin={goToLogin}
                goToSignUp={goToSignUp}
              />
            )}
          </div>
          <hr />

          {/* Menu Links */}
          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            className="w-full p-4 text-left hover:bg-blue-500 text-gray-800"
          >
            Home
          </Link>
          <hr />
          <Link
            to="/about"
            onClick={() => setMenuOpen(false)}
            className="w-full p-4 text-left hover:bg-blue-500 text-gray-800 mt-0"
          >
            About Us
          </Link>
          <hr />
          <Link
            to="/support"
            onClick={() => setMenuOpen(false)}
            className="w-full  p-4 text-left hover:bg-blue-500 text-gray-800 mt-0"
          >
            Support
          </Link>
          <hr />

          {/* Conditional Menu for Authenticated and Unauthenticated Users */}
          {isAuthenticated && (
            <AuthenticatedMenu closeMenu={() => setMenuOpen(false)} />
          )}
        </div>
      )}
    </nav>
  );
};

const UnauthenticatedMenu = ({ closeMenu, goToLogin, goToSignUp }) => (
  <div className="flex items-center space-x-4">
    <Button
      onClick={() => {
        closeMenu();
        goToLogin();
      }}
      variant="transparent"
    >
      Login
    </Button>
    <Button
      onClick={() => {
        closeMenu();
        goToSignUp();
      }}
    >
      Sign Up
    </Button>
  </div>
);

const AuthenticatedMenu = ({ closeMenu }) => <></>;

export default HeaderBurgerMenu;
