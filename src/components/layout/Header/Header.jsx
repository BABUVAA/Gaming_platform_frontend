import { useSelector } from "react-redux";
import {
  Button,
  HeaderBurgerMenu,
  HeaderLogo,
  HeaderNotificationMenu,
  HeaderProfileMenu,
  HeaderWalletMenu,
} from "../..";

import useNavigateHook from "../../../hooks/useNavigateHook";

const Header = () => {
  const { isAuthenticated } = useSelector((store) => store.auth);
  const { goToLogin, goToSignUp } = useNavigateHook();

  // Render authenticated menu
  const renderAuthenticatedMenu = () => (
    <div className="flex items-center space-x-4">
      <HeaderNotificationMenu />
      <HeaderProfileMenu />
      <HeaderWalletMenu />
    </div>
  );

  // Render unauthenticated menu
  const renderUnauthenticatedMenu = () => (
    <div className=" items-center justify-center content-center space-x-4 h-full hidden md:flex  mr-2 px-2 ">
      <Button onClick={goToLogin} variant="transparent">
        Login
      </Button>
      <Button onClick={goToSignUp}>Sign Up</Button>
    </div>
  );

  return (
    <header className="flex items-center justify-between h-16 md:h-14 bg-white shadow-md">
      {/* Logo */}
      <HeaderLogo />

      {/* Conditional rendering based on authentication */}
      {isAuthenticated
        ? renderAuthenticatedMenu()
        : renderUnauthenticatedMenu()}

      {/* Burger Menu */}
      <HeaderBurgerMenu />
    </header>
  );
};

export default Header;
