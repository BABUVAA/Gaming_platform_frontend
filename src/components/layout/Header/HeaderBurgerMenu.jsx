import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FiBell, FiMenu } from "react-icons/fi";
import { FaArrowRight } from "react-icons/fa6";
import { CiWallet } from "react-icons/ci";
import { RiCloseFill } from "react-icons/ri";
import Button from "../../ui/Button/Button";
import useNavigateHook from "../../../hooks/useNavigateHook";
import { logout } from "../../../store/slices/authSlice";
import { getDashboardNavigation } from "../../../utils/navigation";
import { USER_ROLES } from "../../../utils/accessControl";
import { selectPlayerSummary } from "../../../store/selectors/playerSelectors";
import { ROUTES } from "../../../routes/routeConstants";
import {
  getStaffUtilityRoleLabel,
  isStaffUtilitySummary,
} from "../../../utils/staffUtilityMode";

const formatAvailableBalance = (wallet) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: wallet?.currency || "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format((Number(wallet?.availableMinor) || 0) / 100);

const HeaderBurgerMenu = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(
    (store) => store.auth.isAuthenticated,
  );
  const playerSummary = useSelector(selectPlayerSummary);
  const wallet = useSelector((store) => store.payment.wallet);
  const unreadCount = useSelector((store) => store.notifications.unreadCount);
  const [menuOpen, setMenuOpen] = useState(false);
  const { goToLogin, goToSignUp } = useNavigateHook();
  const location = useLocation();
  const dashboardNavigation = getDashboardNavigation(playerSummary, {
    includeStaffWorkspaces: !location.pathname.startsWith(ROUTES.DASHBOARD),
  });
  const showPlayerWallet = playerSummary?.role === USER_ROLES.PLAYER;
  const isStaffUtilityMode = isStaffUtilitySummary(playerSummary);

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  // Authenticated navigation follows the light dashboard palette, while the
  // public menu retains the dark marketing presentation used on the home page.
  const menuOverlay = (
    <div className="fixed inset-0 z-[999] overflow-y-auto bg-[#182235] px-4 py-4 text-slate-100">
      <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(14,165,233,0.14),transparent)]" />
      <div className="relative flex items-center justify-between border-b border-slate-700 pb-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-300">
            {isStaffUtilityMode ? "Staff utility" : "Player menu"}
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            E-Gaming
          </h2>
        </div>
        <button
          type="button"
          onClick={closeMenu}
          className="rounded-xl border border-slate-600 bg-slate-800 p-2 text-slate-200 transition hover:border-cyan-400/50 hover:text-cyan-200"
          aria-label="Close menu"
        >
          <RiCloseFill size={24} />
        </button>
      </div>

      {isAuthenticated ? (
        <div className="relative mt-6 grid gap-3">
          <div className="rounded-2xl border border-slate-600 bg-slate-800 px-4 py-4 shadow-[0_16px_36px_rgba(2,8,23,0.18)]">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-300">
              Logged in as
            </p>
            <p className="mt-2 text-lg font-bold text-white">
              {playerSummary?.username || "Player"}
            </p>
            {isStaffUtilityMode ? (
              <p className="mt-1 text-sm text-amber-200">
                {getStaffUtilityRoleLabel(playerSummary)} · Read-only player view
              </p>
            ) : null}
          </div>

          <div
            className={`grid gap-3 ${
              showPlayerWallet ? "grid-cols-2" : "grid-cols-1"
            }`}
          >
            {showPlayerWallet ? (
              <div className="rounded-2xl border border-slate-600 bg-slate-800 px-4 py-4 shadow-[0_16px_36px_rgba(2,8,23,0.16)]">
                <div className="flex items-center gap-2 text-amber-300">
                  <CiWallet />
                  <span className="text-[11px] uppercase tracking-[0.18em]">
                    Wallet
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-white">
                  {formatAvailableBalance(wallet)}
                </p>
              </div>
            ) : null}
            <div className="rounded-2xl border border-slate-600 bg-slate-800 px-4 py-4 shadow-[0_16px_36px_rgba(2,8,23,0.16)]">
              <div className="flex items-center gap-2 text-amber-300">
                <FiBell />
                <span className="text-[11px] uppercase tracking-[0.18em]">
                  Alerts
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-white">
                {unreadCount} unread
              </p>
              <p className="mt-1 text-xs text-slate-400">Use the bell above to review alerts.</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-6 space-y-2">
        {!isAuthenticated ? (
          <Link
            to="/"
            onClick={closeMenu}
            className="block rounded-2xl border border-slate-600 bg-slate-800 px-4 py-4 text-sm font-bold text-slate-100 shadow-[0_12px_26px_rgba(2,8,23,0.16)]"
          >
            Home
          </Link>
        ) : null}

        {isAuthenticated ? (
          <>
            <p className="px-1 pb-1 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
              All player areas
            </p>
            <div className="grid grid-cols-2 gap-2">
              {dashboardNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === ROUTES.DASHBOARD}
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex min-h-20 items-center gap-3 rounded-xl border px-3 py-3 text-sm font-bold shadow-[0_10px_24px_rgba(2,8,23,0.14)] transition ${
                        isActive
                          ? "border-cyan-400/50 bg-cyan-400/15 text-cyan-100"
                          : "border-slate-600 bg-slate-800 text-slate-200 hover:border-cyan-400/40 hover:bg-slate-700"
                      }`
                    }
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-700 text-cyan-300">
                      <Icon size={17} />
                    </span>
                    <span className="min-w-0 leading-tight">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => {
                dispatch(logout());
                closeMenu();
              }}
              className="block w-full rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-4 text-left text-sm font-bold text-rose-200 shadow-[0_12px_26px_rgba(2,8,23,0.16)]"
            >
              Logout
            </button>
          </>
        ) : (
          <div className="grid gap-3 pt-4">
            <Button
              onClick={() => {
                closeMenu();
                goToLogin();
              }}
              variant="transparent"
              className="w-full"
            >
              Login
            </Button>
            <Button
              onClick={() => {
                closeMenu();
                goToSignUp();
              }}
              className="w-full"
              endIcon={<FaArrowRight />}
            >
              Start competing
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <nav className="relative md:hidden">
      <button
        type="button"
        onClick={() => setMenuOpen((current) => !current)}
        className="rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-slate-200 shadow-[0_10px_30px_rgba(2,8,23,0.18)] transition hover:border-cyan-400/50"
        aria-label="Open menu"
        aria-expanded={menuOpen}
        aria-controls="mobile-player-menu"
      >
        <FiMenu size={22} />
      </button>

      {menuOpen
        ? createPortal(
            <div id="mobile-player-menu">{menuOverlay}</div>,
            document.body,
          )
        : null}
    </nav>
  );
};

export default HeaderBurgerMenu;
