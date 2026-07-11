import { useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FiBell, FiMenu } from "react-icons/fi";
import { FaArrowRight } from "react-icons/fa6";
import { CiWallet } from "react-icons/ci";
import { RiCloseFill } from "react-icons/ri";
import Button from "../../ui/Button/Button";
import useNavigateHook from "../../../hooks/useNavigateHook";
import { logout } from "../../../store/authSlice";
import { getDashboardNavigation } from "../../../utils/navigation";

const HeaderBurgerMenu = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, profile } = useSelector((store) => store.auth);
  const wallet = useSelector((store) => store.payment.wallet);
  const notifications = useSelector((store) => store.notifications.items);
  const [menuOpen, setMenuOpen] = useState(false);
  const { goToLogin, goToSignUp } = useNavigateHook();
  const unreadCount = (notifications || []).filter((item) => !item.isRead).length;
  const dashboardNavigation = getDashboardNavigation(profile?.role);
  const showPlayerWallet = ["player", "host"].includes(profile?.role);

  const closeMenu = () => setMenuOpen(false);

  const menuOverlay = (
    <div className="fixed inset-0 z-[999] overflow-y-auto bg-[#05070d] px-4 py-4 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,_rgba(251,191,36,0.12),_rgba(5,7,13,0))]" />
      <div className="relative flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-amber-200">
            Player menu
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">E-Gaming</h2>
        </div>
        <button
          type="button"
          onClick={closeMenu}
          className="rounded-xl border border-slate-700 bg-slate-950 p-2 text-slate-100 transition hover:border-amber-200/60 hover:text-amber-100"
          aria-label="Close menu"
        >
          <RiCloseFill size={24} />
        </button>
      </div>

      {isAuthenticated ? (
        <div className="relative mt-6 grid gap-3">
          <div className="rounded-2xl border border-slate-700 bg-[#0b1019] px-4 py-4 shadow-[0_16px_36px_rgba(0,0,0,0.35)]">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-200">
              Logged in as
            </p>
            <p className="mt-2 text-lg font-bold text-white">
              {profile?.profile?.username || "Player"}
            </p>
          </div>

          <div
            className={`grid gap-3 ${
              showPlayerWallet ? "grid-cols-2" : "grid-cols-1"
            }`}
          >
            {showPlayerWallet ? (
              <div className="rounded-2xl border border-slate-700 bg-[#0b1019] px-4 py-4 shadow-[0_16px_36px_rgba(0,0,0,0.28)]">
                <div className="flex items-center gap-2 text-amber-200">
                  <CiWallet />
                  <span className="text-[11px] uppercase tracking-[0.18em]">
                    Wallet
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-white">
                  Rs {wallet?.realMoney || 0}
                </p>
              </div>
            ) : null}
            <div className="rounded-2xl border border-slate-700 bg-[#0b1019] px-4 py-4 shadow-[0_16px_36px_rgba(0,0,0,0.28)]">
              <div className="flex items-center gap-2 text-amber-200">
                <FiBell />
                <span className="text-[11px] uppercase tracking-[0.18em]">
                  Alerts
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-white">
                {unreadCount} unread
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-6 space-y-2">
        {!isAuthenticated ? (
          <Link
            to="/"
            onClick={closeMenu}
            className="block rounded-2xl border border-slate-700 bg-[#0b1019] px-4 py-4 text-sm font-bold text-slate-100 shadow-[0_12px_26px_rgba(0,0,0,0.26)]"
          >
            Home
          </Link>
        ) : null}

        {isAuthenticated ? (
          <>
            {dashboardNavigation.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={closeMenu}
                className="block rounded-2xl border border-slate-700 bg-[#0b1019] px-4 py-4 text-sm font-bold text-slate-100 shadow-[0_12px_26px_rgba(0,0,0,0.26)] transition hover:border-amber-200/50 hover:text-amber-100"
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => {
                dispatch(logout());
                closeMenu();
              }}
              className="block w-full rounded-2xl border border-rose-400/40 bg-rose-950/40 px-4 py-4 text-left text-sm font-bold text-rose-100 shadow-[0_12px_26px_rgba(0,0,0,0.26)]"
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
        className="rounded-xl border border-amber-200/30 bg-slate-950 px-3 py-2 text-amber-100 shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition hover:border-amber-200/60"
        aria-label="Open menu"
      >
        <FiMenu size={22} />
      </button>

      {menuOpen ? createPortal(menuOverlay, document.body) : null}
    </nav>
  );
};

export default HeaderBurgerMenu;
