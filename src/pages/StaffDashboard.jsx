import {
  FiArrowUpRight,
  FiBriefcase,
  FiCalendar,
  FiGrid,
  FiMonitor,
  FiShield,
  FiZap,
} from "react-icons/fi";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { ROUTES } from "../routes/routeConstants";

const WORKSPACES = {
  super_admin: {
    accent: "violet",
    icon: FiShield,
    path: ROUTES.ADMIN_PANEL,
    responsibilities: ["Platform policy", "Staff authority", "Audit review"],
    title: "Super Admin",
  },
  platform_admin: {
    accent: "cyan",
    icon: FiGrid,
    path: ROUTES.ADMIN_PANEL,
    responsibilities: ["People and access", "Game control", "Financial review"],
    title: "Platform Admin",
  },
  tournament_manager: {
    accent: "cyan",
    icon: FiZap,
    path: ROUTES.TOURNAMENT_MANAGER,
    responsibilities: ["Create tournaments", "Manage lifecycle", "Monitor seats"],
    title: "Tournament Manager",
  },
  game_manager: {
    accent: "blue",
    icon: FiMonitor,
    path: ROUTES.GAME_MANAGER,
    responsibilities: ["Room schedules", "Lineups", "Account verification"],
    title: "Game Manager",
  },
  event_manager: {
    accent: "amber",
    icon: FiCalendar,
    path: ROUTES.EVENT_MANAGER,
    responsibilities: ["Templates", "Registrations", "Event rounds"],
    title: "Event Manager",
  },
  match_operator: {
    accent: "emerald",
    icon: FiBriefcase,
    path: ROUTES.OPERATIONS,
    responsibilities: ["Full rooms", "Match start", "Results"],
    title: "Match Operator",
  },
};

const ACCENT_STYLES = {
  amber: {
    icon: "border-amber-300/25 bg-amber-300/10 text-amber-200",
    line: "from-amber-300/80",
    tag: "border-amber-300/20 bg-amber-300/10 text-amber-100",
  },
  blue: {
    icon: "border-blue-300/25 bg-blue-300/10 text-blue-200",
    line: "from-blue-300/80",
    tag: "border-blue-300/20 bg-blue-300/10 text-blue-100",
  },
  cyan: {
    icon: "border-cyan-300/25 bg-cyan-300/10 text-cyan-200",
    line: "from-cyan-300/80",
    tag: "border-cyan-300/20 bg-cyan-300/10 text-cyan-100",
  },
  emerald: {
    icon: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200",
    line: "from-emerald-300/80",
    tag: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
  },
  violet: {
    icon: "border-violet-300/25 bg-violet-300/10 text-violet-200",
    line: "from-violet-300/80",
    tag: "border-violet-300/20 bg-violet-300/10 text-violet-100",
  },
};

const StaffDashboard = () => {
  const assignments = useSelector(
    (state) => state.player.summary?.staffAssignments || [],
  );
  const workspaceAssignments = assignments.filter(
    (assignment) => WORKSPACES[assignment.role],
  );

  return (
    <main className="min-w-0 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-3xl border border-cyan-300/15 bg-[linear-gradient(135deg,rgba(34,211,238,0.08),rgba(15,23,42,0.55))] px-5 py-5 sm:px-6">
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Select an assigned workspace to continue.
          </p>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-950/25 p-4 sm:p-6">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-xl font-black text-white sm:text-2xl">
              Your workspaces
            </h2>
            <p className="text-xs font-bold text-slate-500">
              {workspaceAssignments.length} active
            </p>
          </div>

          {workspaceAssignments.length ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {workspaceAssignments.map((assignment) => (
                <WorkspaceCard
                  assignment={assignment}
                  key={assignment.assignmentId}
                  workspace={WORKSPACES[assignment.role]}
                />
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-700 px-5 py-10 text-center text-sm text-slate-500">
              No active workspace is assigned.
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

const WorkspaceCard = ({ assignment, workspace }) => {
  const Icon = workspace.icon;
  const styles = ACCENT_STYLES[workspace.accent];
  const scopeCount = assignment.gameIds?.length || 0;

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 p-5 transition hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-900">
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${styles.line} to-transparent`} />
      <div className="flex items-start justify-between gap-4">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border text-xl ${styles.icon}`}>
          <Icon />
        </div>
      </div>

      <h3 className="mt-5 text-xl font-black text-white">{workspace.title}</h3>
      <ul className="mt-3 flex flex-wrap gap-2" aria-label={`${workspace.title} responsibilities`}>
        {workspace.responsibilities.map((responsibility) => (
          <li className="rounded-lg border border-slate-800 bg-slate-950/70 px-2.5 py-1.5 text-xs text-slate-300" key={responsibility}>
            {responsibility}
          </li>
        ))}
      </ul>

      <div className="mt-5 flex items-center justify-between gap-4 border-t border-slate-800 pt-4">
        <p className="text-xs font-bold text-slate-500">
          {scopeCount
            ? `${scopeCount} assigned game${scopeCount === 1 ? "" : "s"}`
            : "Platform-wide"}
        </p>
        <Link
          aria-label={`Open ${workspace.title} workspace`}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-sm font-black text-slate-950 transition group-hover:bg-cyan-200"
          to={workspace.path}
        >
          Open <FiArrowUpRight />
        </Link>
      </div>
    </article>
  );
};

WorkspaceCard.propTypes = {
  assignment: PropTypes.shape({
    assignmentId: PropTypes.string.isRequired,
    gameIds: PropTypes.arrayOf(PropTypes.string),
    role: PropTypes.string.isRequired,
  }).isRequired,
  workspace: PropTypes.shape({
    accent: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    path: PropTypes.string.isRequired,
    responsibilities: PropTypes.arrayOf(PropTypes.string).isRequired,
    title: PropTypes.string.isRequired,
  }).isRequired,
};

export default StaffDashboard;
