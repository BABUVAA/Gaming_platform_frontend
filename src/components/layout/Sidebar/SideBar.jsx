import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { getDashboardNavigation } from "../../../utils/navigation";
import { selectPlayerSummary } from "../../../store/selectors/playerSelectors";

const SideBar = () => {
  const playerSummary = useSelector(selectPlayerSummary);
  // This shell is player-owned even when staff open its read-only utility
  // view. Operational workspaces stay on the dedicated staff surface.
  const dashboardNavigation = getDashboardNavigation(playerSummary, {
    includeStaffWorkspaces: false,
  });
  return (
    <>
      <aside className="hidden md:flex md:w-56 md:flex-col md:border-r md:border-slate-700 md:bg-[#182235]/90 md:px-3 md:py-4 md:backdrop-blur">
        <nav className="space-y-1.5">
          {dashboardNavigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/dashboard"}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
                    isActive
                      ? "border-cyan-400/40 bg-cyan-400/15 text-white shadow-[0_14px_30px_rgba(8,145,178,0.10)]"
                      : "border-slate-700 bg-slate-800/80 text-slate-300 hover:border-slate-600 hover:bg-slate-700 hover:text-white"
                  }`
                }
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
                    <span className="min-w-0">
                      <span className="block text-sm font-bold">
                        {item.label}
                      </span>
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex gap-2 overflow-x-auto border-t border-slate-700 bg-[#182235]/95 px-2 py-2 shadow-[0_-12px_30px_rgba(2,8,23,0.18)] backdrop-blur md:hidden">
        {dashboardNavigation.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/dashboard"}
              className={({ isActive }) =>
                `flex min-w-[84px] flex-col items-center justify-center rounded-xl px-1 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] transition ${
                  isActive
                    ? "bg-cyan-400/15 text-cyan-200"
                    : "text-slate-400 hover:bg-slate-700 hover:text-slate-100"
                }`
              }
            >
              <Icon size={18} />
              <span className="mt-1 truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
};

export default SideBar;
