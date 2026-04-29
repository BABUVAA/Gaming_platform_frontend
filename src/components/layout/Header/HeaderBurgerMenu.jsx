import { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FiBell, FiMenu } from "react-icons/fi";
import { CiWallet } from "react-icons/ci";
import { RiCloseFill } from "react-icons/ri";
import Button from "../../ui/Button/Button";
import useNavigateHook from "../../../hooks/useNavigateHook";
import { logout } from "../../../store/authSlice";
import { dashboardNavigation } from "../../../utils/navigation";

const HeaderBurgerMenu = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, profile } = useSelector((store) => store.auth);
  const wallet = useSelector((store) => store.payment.wallet);
  const notifications = useSelector((store) => store.notifications.items);
  const [menuOpen, setMenuOpen] = useState(false);
  const { goToLogin, goToSignUp } = useNavigateHook();
  const unreadCount = (notifications || []).filter((item) => !item.isRead).length;

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="relative md:hidden">
      <button
        type="button"
        onClick={() => setMenuOpen((current) => !current)}
        className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-200"
        aria-label="Open menu"
      >
        <FiMenu size={22} />
      </button>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 bg-[#040914] px-4 py-4 text-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-300/80">
                Menu
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">E-Gaming</h2>
            </div>
            <button
              type="button"
              onClick={closeMenu}
              className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-200"
              aria-label="Close menu"
            >
              <RiCloseFill size={24} />
            </button>
          </div>

          {isAuthenticated ? (
            <div className="mt-6 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                  Logged in as
                </p>
                <p className="mt-2 text-lg font-bold text-white">
                  {profile?.profile?.username || "Player"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-4">
                  <div className="flex items-center gap-2 text-cyan-300">
                    <CiWallet />
                    <span className="text-[11px] uppercase tracking-[0.18em]">
                      Wallet
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-white">
                    Rs {wallet?.realMoney || 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-4">
                  <div className="flex items-center gap-2 text-cyan-300">
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
            <Link
              to="/"
              onClick={closeMenu}
              className="block rounded-2xl border border-slate-800 bg-slate-950 px-4 py-4 text-sm font-semibold text-slate-200"
            >
              Home
            </Link>

            {isAuthenticated ? (
              <>
                {dashboardNavigation.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={closeMenu}
                    className="block rounded-2xl border border-slate-800 bg-slate-950 px-4 py-4 text-sm font-semibold text-slate-200"
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
                  className="block w-full rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-4 text-left text-sm font-semibold text-rose-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3 pt-4">
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
            )}
          </div>
        </div>
      ) : null}
    </nav>
  );
};

export default HeaderBurgerMenu;
