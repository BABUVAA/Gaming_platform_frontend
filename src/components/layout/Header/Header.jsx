import { Link, NavLink, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaArrowRight } from "react-icons/fa6";
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
  getDashboardNavigation,
  getNavigationTitle,
} from "../../../utils/navigation";

const Header = () => {
  const { isAuthenticated, profile } = useSelector((store) => store.auth);
  const { goToLogin, goToSignUp } = useNavigateHook();
  const location = useLocation();
  const currentArea = getNavigationTitle(location.pathname);
  const dashboardNavigation = getDashboardNavigation(profile?.role);
  const showPlayerWallet = ["player", "host"].includes(profile?.role);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#04070d]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-3 md:h-20 md:px-5">
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
        ) : (
          <nav className="hidden items-center gap-2 lg:flex">
            <Link
              to="/signup"
              className="rounded-full px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400 transition hover:text-amber-100"
            >
              Tournaments
            </Link>
            <Link
              to="/signup"
              className="rounded-full px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400 transition hover:text-amber-100"
            >
              Clans
            </Link>
            <Link
              to="/signup"
              className="rounded-full px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400 transition hover:text-amber-100"
            >
              Rewards
            </Link>
          </nav>
        )}

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <div className="hidden items-center gap-3 md:flex">
              <HeaderNotificationMenu />
              <HeaderProfileMenu />
              {showPlayerWallet ? <HeaderWalletMenu /> : null}
            </div>
          ) : (
            <div className="hidden items-center gap-3 md:flex">
              <Button
                onClick={goToLogin}
                variant="transparent"
                className="min-w-24"
              >
                Login
              </Button>
              <Button
                onClick={goToSignUp}
                endIcon={<FaArrowRight />}
                className="min-w-40"
              >
                Start competing
              </Button>
            </div>
          )}

          <HeaderBurgerMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;
