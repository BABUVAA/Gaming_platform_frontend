import { NavLink, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectPlayerSummary } from "../../../store/selectors/playerSelectors";
import {
  getNavigationTitle,
  getStaffWorkspaceNavigation,
} from "../../../utils/navigation";
import { ROUTES } from "../../../routes/routeConstants.js";

const StaffSideBar = () => {
  const summary = useSelector(selectPlayerSummary);
  const location = useLocation();
  const navigation = getStaffWorkspaceNavigation(summary);
  const currentArea = getNavigationTitle(location.pathname);

  const links = navigation.map((item) => {
    const Icon = item.icon;
    return (
      <NavLink
        className={({ isActive }) =>
          `group flex items-center gap-4 rounded-2xl border px-4 py-3 transition ${
            isActive
              ? "border-cyan-400/40 bg-cyan-400/15 text-white shadow-[0_14px_30px_rgba(8,145,178,0.10)]"
              : "border-slate-700 bg-slate-800/80 text-slate-300 hover:border-slate-600 hover:bg-slate-700 hover:text-white"
          }`
        }
        end={item.to === ROUTES.STAFF}
        key={item.to}
        to={item.to}
      >
        {({ isActive }) => (
          <>
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${
                isActive
                  ? "bg-cyan-600 text-white"
                  : "bg-slate-700 text-cyan-300 group-hover:bg-slate-600"
              }`}
            >
              <Icon size={18} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold">
                {item.label}
              </span>
              <span className="block truncate text-xs text-slate-500">
                {item.description}
              </span>
            </span>
          </>
        )}
      </NavLink>
    );
  });

  return (
    <>
      <aside className="hidden md:flex md:w-72 md:flex-col md:border-r md:border-slate-700 md:bg-[#182235]/90 md:px-4 md:py-5 md:backdrop-blur">
        <div className="rounded-2xl border border-cyan-400/20 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.13),transparent_42%),linear-gradient(135deg,#132b3a,#25344a)] p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.25em] text-cyan-300">
            Staff workspace
          </p>
          <h2 className="mt-3 truncate text-2xl font-black text-white">
            {currentArea.label}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Your active assignments and scoped tools.
          </p>
        </div>
        <nav className="mt-6 space-y-2">{links}</nav>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-50 flex gap-2 overflow-x-auto border-t border-slate-700 bg-[#182235]/95 px-2 py-2 shadow-[0_-12px_30px_rgba(2,8,23,0.18)] backdrop-blur md:hidden">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              className={({ isActive }) =>
                `flex min-w-[84px] flex-col items-center justify-center rounded-xl px-1 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] transition ${
                  isActive
                    ? "bg-cyan-400/15 text-cyan-200"
                    : "text-slate-400 hover:bg-slate-700 hover:text-slate-100"
                }`
              }
              end={item.to === ROUTES.STAFF}
              key={item.to}
              to={item.to}
            >
              <Icon size={18} />
              <span className="mt-1 max-w-20 truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
};

export default StaffSideBar;
