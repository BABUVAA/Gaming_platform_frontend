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

  return (
    <header className="nav row align-center bs sb">
      <HeaderLogo />

      {/* Conditional rendering based on authentication */}
      {isAuthenticated ? (
        <div className="row sa gap-c p-2 hide-max-width-1080 pr-2">
          <HeaderNotificationMenu />
          <HeaderProfileMenu />
          <HeaderWalletMenu />
        </div>
      ) : (
        <div className="row sa gap-c p-2 hide-max-width-1080 ">
          <Button onClick={goToLogin} variant="transparent">
            Login
          </Button>
          <Button onClick={goToSignUp}>Sign Up</Button>
        </div>
      )}

      <HeaderBurgerMenu />
    </header>
  );
};

export default Header;
