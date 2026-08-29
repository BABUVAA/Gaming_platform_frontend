import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectPlayerSummary } from "../../../store/selectors/playerSelectors";
import { getStaffWorkspaceNavigation } from "../../../utils/navigation";
import { ROUTES } from "../../../routes/routeConstants.js";

const StaffSideBar = () => {
  const summary = useSelector(selectPlayerSummary);
  const navigation = getStaffWorkspaceNavigation(summary);

  const links = navigation.map((item) => {
    const Icon = item.icon;
    return (
      <NavLink
        className={({ isActive }) =>
          `group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
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
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${
                isActive
                  ? "bg-cyan-600 text-white"
                  : "bg-slate-700 text-cyan-300 group-hover:bg-slate-600"
              }`}
            >
              <Icon size={18} />
            </span>
            <span className="min-w-0 truncate text-sm font-bold">{item.label}</span>
          </>
        )}
      </NavLink>
    );
  });

  return (
    <>
      <aside className="hidden md:fixed md:bottom-0 md:left-[max(0px,calc((100vw-1600px)/2))] md:top-20 md:z-30 md:flex md:w-56 md:flex-col md:overflow-y-auto md:border-r md:border-slate-700 md:bg-[#182235]/90 md:px-3 md:py-4 md:backdrop-blur">
        <nav className="space-y-1.5">{links}</nav>
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
