import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { ROUTES } from "../routes/routeConstants";

const WORKSPACES = {
  super_admin: ["Super Admin", "Platform governance and staff access.", ROUTES.ADMIN_PANEL],
  platform_admin: ["Platform Admin", "Staff, games, and platform operations.", ROUTES.ADMIN_PANEL],
  game_manager: ["Game Manager", "Assigned game configuration.", ROUTES.GAME_MANAGER],
  event_manager: ["Event Manager", "Create templates and schedule Events.", ROUTES.EVENT_MANAGER],
  match_operator: ["Match Operator", "Run lobbies, check-ins, and results.", ROUTES.OPERATIONS],
};

const StaffDashboard = () => {
  const assignments = useSelector((state) => state.player.summary?.staffAssignments || []);

  return (
    <section className="mx-auto max-w-5xl rounded-[28px] border border-slate-800 bg-slate-950/90 p-6 text-slate-100">
      <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/75">Staff Workspace</p>
      <h1 className="mt-2 text-3xl font-black text-white">Choose a workspace</h1>
      <p className="mt-2 text-sm text-slate-400">Select the role you want to work in. Your player dashboard remains separate.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {assignments.map((assignment) => {
          const workspace = WORKSPACES[assignment.role];
          if (!workspace) return null;
          const [title, description, path] = workspace;
          return (
            <article key={assignment.assignmentId} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <p className="text-lg font-bold text-white">{title}</p>
              <p className="mt-2 text-sm text-slate-400">{description}</p>
              <p className="mt-4 text-xs text-cyan-200">{assignment.gameIds.length ? `${assignment.gameIds.length} assigned game scope(s)` : "Platform-wide workspace"}</p>
              <Link className="mt-5 inline-flex rounded-lg bg-cyan-300 px-3 py-2 text-sm font-bold text-slate-950" to={path}>Open workspace</Link>
            </article>
          );
        })}
      </div>
      <Link className="mt-6 inline-flex rounded-lg border border-slate-600 px-3 py-2 text-sm font-bold text-slate-200" to={ROUTES.GAME}>Open player dashboard</Link>
    </section>
  );
};

export default StaffDashboard;
