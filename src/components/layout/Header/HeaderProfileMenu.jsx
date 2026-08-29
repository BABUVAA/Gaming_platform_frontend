import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  FiActivity,
  FiLogOut,
  FiLink,
  FiSettings,
  FiShield,
  FiUser,
  FiUserPlus,
  FiUsers,
} from "react-icons/fi";
import { logout } from "../../../store/slices/authSlice";
import { ROUTES } from "../../../routes/routeConstants";
import {
  hasApprovedHostAccess,
  USER_ROLES,
} from "../../../utils/accessControl";
import { selectPlayerSummary } from "../../../store/selectors/playerSelectors";
import {
  getStaffUtilityRoleLabel,
  isStaffUtilitySummary,
} from "../../../utils/staffUtilityMode";

const HeaderProfileMenu = () => {
  const dispatch = useDispatch();
  const playerSummary = useSelector(selectPlayerSummary);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const isStaffUtilityMode = isStaffUtilitySummary(playerSummary);
  const roleLabel = isStaffUtilityMode
    ? getStaffUtilityRoleLabel(playerSummary)
    : hasApprovedHostAccess(playerSummary)
    ? "Player / Approved Host"
    : playerSummary?.role
      ? playerSummary.role.charAt(0).toUpperCase() + playerSummary.role.slice(1)
      : "Player";

  const menuItems = isStaffUtilityMode
    ? [
        { to: ROUTES.STAFF, label: "Staff Workspace", icon: FiShield },
        {
          to: ROUTES.ACCOUNT_SETTINGS,
          label: "Account Settings",
          icon: FiSettings,
        },
      ]
    : playerSummary?.role === USER_ROLES.ADMIN
      ? [{ to: "/panelAdmin", label: "Admin Panel", icon: FiShield }]
      : playerSummary?.role === USER_ROLES.OPERATOR
        ? [
            {
              to: ROUTES.OPERATIONS,
              label: "Operator Control",
              icon: FiActivity,
            },
          ]
        : [
            { to: ROUTES.PROFILE, label: "My Profile", icon: FiUser },
            {
              to: ROUTES.GAME_ACCOUNTS,
              label: "Game Accounts",
              icon: FiLink,
            },
            {
              to: ROUTES.ACCOUNT_SETTINGS,
              label: "Account Settings",
              icon: FiSettings,
            },
            { to: ROUTES.FRIENDS, label: "Friends", icon: FiUserPlus },
            { to: ROUTES.CLAN, label: "Clan", icon: FiUsers },
            { to: ROUTES.REFER, label: "Refer a Friend", icon: FiUsers },
          ];

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
        className="inline-flex items-center gap-3 rounded-2xl border border-slate-600 bg-slate-800 px-3 py-2.5 text-left text-slate-100 transition hover:border-cyan-400/50 hover:bg-slate-700"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-300 text-sm font-black text-slate-950">
          {(playerSummary?.username || "P").slice(0, 1).toUpperCase()}
        </div>
        <div className="hidden xl:block">
          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
            {roleLabel}
          </p>
          <p className="max-w-32 truncate text-sm font-semibold text-white">
            {playerSummary?.username || "Account"}
          </p>
        </div>
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-50 mt-3 w-64 rounded-[28px] border border-slate-600 bg-slate-800/95 shadow-[0_24px_80px_rgba(2,8,23,0.28)] backdrop-blur">
          <div className="border-b border-slate-700 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">
              Signed in as
            </p>
            <p className="mt-2 truncate font-semibold text-white">
              {playerSummary?.username || (isStaffUtilityMode ? "Staff" : "Player")}
            </p>
            <p className="mt-1 truncate text-sm text-slate-400">
              {playerSummary?.email || "No email available"}
            </p>
          </div>

          <ul className="divide-y divide-slate-700 text-sm text-slate-200">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-700"
                  >
                    <Icon />
                    {item.label}
                  </Link>
                </li>
              );
            })}
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
