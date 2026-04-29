import { NavLink, useLocation } from "react-router-dom";
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
import {
  dashboardNavigation,
  getNavigationTitle,
} from "../../../utils/navigation";

const Header = () => {
  const { isAuthenticated } = useSelector((store) => store.auth);
  const { goToLogin, goToSignUp } = useNavigateHook();
  const location = useLocation();
  const currentArea = getNavigationTitle(location.pathname);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-[#040914]/95 backdrop-blur">
      <div className="mx-auto flex h-16 items-center justify-between gap-4 px-3 md:h-20 md:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <HeaderLogo />

          {isAuthenticated && (
            <div className="hidden min-w-0 lg:block">
              <p className="text-[11px] uppercase tracking-[0.26em] text-slate-500">
                Current Area
              </p>
              <p className="truncate text-sm font-semibold text-slate-100">
                {currentArea.label}
              </p>
            </div>
          )}
        </div>

        {isAuthenticated ? (
          <div className="hidden xl:flex xl:items-center xl:gap-2">
            {dashboardNavigation.slice(0, 5).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/dashboard"}
                className={({ isActive }) =>
                  `rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                    isActive
                      ? "bg-cyan-400/14 text-cyan-200"
                      : "text-slate-500 hover:text-slate-200"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <div className="hidden items-center gap-3 md:flex">
              <HeaderNotificationMenu />
              <HeaderProfileMenu />
              <HeaderWalletMenu />
            </div>
          ) : (
            <div className="hidden items-center gap-3 md:flex">
              <Button onClick={goToLogin} variant="transparent">
                Login
              </Button>
              <Button onClick={goToSignUp}>Sign Up</Button>
            </div>
          )}

          <HeaderBurgerMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;
