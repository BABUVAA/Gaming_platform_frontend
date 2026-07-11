import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { getDashboardNavigation } from "../../../utils/navigation";

const SideBar = () => {
  const role = useSelector((store) => store.auth?.profile?.role);
  const dashboardNavigation = getDashboardNavigation(role);

  return (
    <>
      <aside className="hidden md:flex md:w-72 md:flex-col md:border-r md:border-slate-800 md:bg-[#050b14] md:px-4 md:py-5">
        <div className="rounded-2xl border border-cyan-500/20 bg-[linear-gradient(135deg,_rgba(34,211,238,0.14),_rgba(15,23,42,0.98))] p-4 shadow-[0_18px_40px_rgba(2,8,23,0.55)]">
          <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-300/80">
            Live Ops
          </p>
          <h2 className="mt-3 text-2xl font-black text-white">
            Competition Hub
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Your tournament, roster, wallet, and verification flow now live in
            one command surface.
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
                      ? "border-cyan-400/30 bg-cyan-400/12 text-white shadow-[0_14px_30px_rgba(6,182,212,0.08)]"
                      : "border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700 hover:bg-slate-900 hover:text-slate-200"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-xl transition ${
                        isActive
                          ? "bg-cyan-300 text-slate-950"
                          : "bg-slate-900 text-cyan-300 group-hover:bg-slate-800"
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

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex gap-2 overflow-x-auto border-t border-slate-800 bg-[#050b14]/95 px-2 py-2 backdrop-blur md:hidden">
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
                    ? "bg-cyan-400/14 text-cyan-200"
                    : "text-slate-500 hover:text-slate-200"
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
