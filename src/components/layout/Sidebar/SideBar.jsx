import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { getDashboardNavigation } from "../../../utils/navigation";
import { selectPlayerSummary } from "../../../store/selectors/playerSelectors";
import { isStaffUtilitySummary } from "../../../utils/staffUtilityMode";

const SideBar = () => {
  const playerSummary = useSelector(selectPlayerSummary);
  // This shell is player-owned even when staff open its read-only utility
  // view. Operational workspaces stay on the dedicated staff surface.
  const dashboardNavigation = getDashboardNavigation(playerSummary, {
    includeStaffWorkspaces: false,
  });
  const isStaffUtilityMode = isStaffUtilitySummary(playerSummary);

  return (
    <>
      <aside className="hidden md:flex md:w-72 md:flex-col md:border-r md:border-slate-700 md:bg-[#182235]/90 md:px-4 md:py-5 md:backdrop-blur">
        <div className="rounded-2xl border border-cyan-400/20 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.16),transparent_42%),linear-gradient(135deg,#1e3a4a,#25344a)] p-4 shadow-[0_18px_40px_rgba(2,8,23,0.18)]">
          <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-300">
            {isStaffUtilityMode ? "Staff utility" : "Player Arena"}
          </p>
          <h2 className="mt-3 text-2xl font-black text-white">
            {isStaffUtilityMode ? "Read-only player view" : "Competition Hub"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {isStaffUtilityMode
              ? "Inspect safe player-facing information, then use your assigned workspace for operational actions."
              : "Find tournaments, follow your matches, and stay connected with your team."}
          </p>
        </div>

        <nav className="mt-6 space-y-2">
          {dashboardNavigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/dashboard"}
                className={({ isActive }) =>
                  `group flex items-center gap-4 rounded-2xl border px-4 py-3 transition ${
                    isActive
                      ? "border-cyan-400/40 bg-cyan-400/15 text-white shadow-[0_14px_30px_rgba(8,145,178,0.10)]"
                      : "border-slate-700 bg-slate-800/80 text-slate-300 hover:border-slate-600 hover:bg-slate-700 hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-xl transition ${
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
                      <span className="block truncate text-xs text-slate-500">
                        {item.description}
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
