import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { FiLogOut, FiSettings, FiUser, FiUsers } from "react-icons/fi";
import { logout } from "../../../store/authSlice";

const HeaderProfileMenu = () => {
  const dispatch = useDispatch();
  const { profile } = useSelector((store) => store.auth);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-left text-slate-100 transition hover:border-cyan-300/30 hover:bg-white/10"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-300 text-sm font-black text-slate-950">
          {(profile?.profile?.username || "P").slice(0, 1).toUpperCase()}
        </div>
        <div className="hidden xl:block">
          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
            Player
          </p>
          <p className="max-w-32 truncate text-sm font-semibold text-white">
            {profile?.profile?.username || "Account"}
          </p>
        </div>
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-50 mt-3 w-64 rounded-[28px] border border-white/10 bg-slate-950/95 shadow-[0_24px_80px_rgba(2,8,23,0.55)] backdrop-blur">
          <div className="border-b border-white/10 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/75">
              Signed in as
            </p>
            <p className="mt-2 truncate font-semibold text-white">
              {profile?.profile?.username || "Player"}
            </p>
            <p className="mt-1 truncate text-sm text-slate-400">
              {profile?.email || "No email available"}
            </p>
          </div>

          <ul className="divide-y divide-white/10 text-sm text-slate-200">
            <li>
              <Link
                to="/dashboard/profile"
                className="flex items-center gap-3 px-4 py-3 transition hover:bg-white/5"
              >
                <FiUser />
                My Profile
              </Link>
            </li>
            <li>
              <Link
                to="/dashboard/account"
                className="flex items-center gap-3 px-4 py-3 transition hover:bg-white/5"
              >
                <FiSettings />
                Account Settings
              </Link>
            </li>
            <li>
              <Link
                to="/dashboard/clan"
                className="flex items-center gap-3 px-4 py-3 transition hover:bg-white/5"
              >
                <FiUsers />
                Clan & Social
              </Link>
            </li>
            <li>
              <Link
                to="/dashboard/refer"
                className="flex items-center gap-3 px-4 py-3 transition hover:bg-white/5"
              >
                Refer a Friend
              </Link>
            </li>
            <li>
              <button
                onClick={() => dispatch(logout())}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-rose-200 transition hover:bg-rose-500/10"
              >
                <FiLogOut />
                Logout
              </button>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  );
};

export default HeaderProfileMenu;
