import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createStaffAssignment,
  fetchCatalogGames,
  fetchStaffAssignments,
  fetchStaffActivity,
  fetchStaffReports,
  fetchStaffRoles,
  findUsers,
  updateStaffAssignmentStatus,
} from "../../store/slices/adminSlice";

const readableLabel = (value) => value.replaceAll("_", " ");

const RoleManagement = () => {
  const dispatch = useDispatch();
  const { catalogGames, staffActivity, staffAssignments, staffReports, staffRoles, users } = useSelector(
    (state) => state.admin,
  );
  const [form, setForm] = useState({ gameIds: [], role: "", userId: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("assignments");

  useEffect(() => {
    // The assignment form needs verified users, server-owned roles, and both
    // active and draft games before it can grant scoped access safely.
    dispatch(findUsers());
    dispatch(fetchStaffRoles());
    dispatch(fetchStaffAssignments());
    dispatch(fetchStaffReports());
    dispatch(fetchStaffActivity());
    dispatch(fetchCatalogGames());
  }, [dispatch]);

  const eligibleUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return users.filter((user) => {
      const identity = `${user.profile?.username || ""} ${user.email || ""}`;
      return (
        user.isVerified === true &&
        user.isBanned !== true &&
        identity.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, users]);

  const toggleGameScope = (gameId) => {
    setForm((currentForm) => ({
      ...currentForm,
      gameIds: currentForm.gameIds.includes(gameId)
        ? currentForm.gameIds.filter((id) => id !== gameId)
        : [...currentForm.gameIds, gameId],
    }));
  };

  const assignRole = async (event) => {
    event.preventDefault();
    await dispatch(createStaffAssignment(form)).unwrap();
    setForm({ gameIds: [], role: "", userId: "" });
  };

  const setAssignmentStatus = (assignmentId, status) =>
    dispatch(updateStaffAssignmentStatus({ assignmentId, status }));

  return (
    <section className="rounded-[28px] border border-slate-800 bg-slate-950/90 p-6">
      <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/75">
        Staff Access
      </p>
      <h2 className="mt-2 text-2xl font-black text-white">Role Management</h2>
      <div className="mt-5 flex gap-2 border-b border-slate-800 pb-3 text-sm">
        {["assignments", "reports"].map((tab) => (
          <button key={tab} className={`rounded-lg px-3 py-2 font-bold ${activeTab === tab ? "bg-cyan-300 text-slate-950" : "text-slate-400"}`} onClick={() => setActiveTab(tab)} type="button">
            {tab === "assignments" ? "Assignments" : "Role Reports & History"}
          </button>
        ))}
      </div>

      {activeTab === "assignments" ? (
        <>
      <form className="mt-6 grid gap-3 lg:grid-cols-4" onSubmit={assignRole}>
        <input
          className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white"
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search verified users"
          value={searchQuery}
        />
        <select
          className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white"
          onChange={(event) => setForm({ ...form, userId: event.target.value })}
          required
          value={form.userId}
        >
          <option value="">Choose employee</option>
          {eligibleUsers.map((user) => (
            <option key={user._id} value={user._id}>
              {user.profile?.username || user.email}
            </option>
          ))}
        </select>
        <select
          className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white"
          onChange={(event) => setForm({ ...form, role: event.target.value })}
          required
          value={form.role}
        >
          <option value="">Choose role</option>
          {staffRoles.map((role) => (
            <option key={role.role} value={role.role}>
              {readableLabel(role.role)}
            </option>
          ))}
        </select>
        <button className="rounded-xl bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950">
          Assign role
        </button>
      </form>

      <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
        <p className="text-sm font-semibold text-white">Game access</p>
        <p className="mt-1 text-xs text-slate-400">
          Staff can only work on games selected here. Leave empty only for a role
          that has no game work yet.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {catalogGames.map((game) => (
            <label
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200"
              key={game._id}
            >
              <input
                checked={form.gameIds.includes(game._id)}
                onChange={() => toggleGameScope(game._id)}
                type="checkbox"
              />
              {game.name} ({game.status})
            </label>
          ))}
          {catalogGames.length === 0 && (
            <p className="text-sm text-slate-400">Create a game before assigning game access.</p>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {staffAssignments.map((assignment) => {
          const isRevoked = assignment.status === "revoked";
          const gameNames = assignment.gameScopes?.map((game) => game.name).join(", ");

          return (
            <article
              className="flex flex-col gap-3 rounded-2xl border border-slate-800 p-4 md:flex-row md:items-center md:justify-between"
              key={assignment._id}
            >
              <div>
                <p className="font-semibold text-white">
                  {assignment.user?.profile?.username || assignment.user?.email}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {readableLabel(assignment.role)} · {assignment.status}
                </p>
                <p className="mt-1 text-xs text-cyan-100/80">
                  {gameNames || "No game access assigned"}
                </p>
              </div>
              <div className="flex gap-2 text-sm">
                {assignment.status === "active" && (
                  <button
                    className="rounded-lg border border-amber-400/40 px-3 py-2 text-amber-200"
                    onClick={() => setAssignmentStatus(assignment._id, "suspended")}
                    type="button"
                  >
                    Suspend
                  </button>
                )}
                {assignment.status === "suspended" && (
                  <button
                    className="rounded-lg border border-cyan-400/40 px-3 py-2 text-cyan-200"
                    onClick={() => setAssignmentStatus(assignment._id, "active")}
                    type="button"
                  >
                    Restore
                  </button>
                )}
                <button
                  className="rounded-lg border border-rose-400/40 px-3 py-2 text-rose-200 disabled:border-slate-700 disabled:text-slate-600"
                  disabled={isRevoked}
                  onClick={() => setAssignmentStatus(assignment._id, "revoked")}
                  type="button"
                >
                  {isRevoked ? "Revoked" : "Revoke"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
        </>
      ) : (
        <RoleReports activity={staffActivity} reports={staffReports} />
      )}
    </section>
  );
};

export default RoleManagement;

const RoleReports = ({ activity, reports }) => (
  <div className="mt-6 space-y-6">
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {reports.map((report) => (
        <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4" key={report.role}>
          <p className="font-bold text-white">{readableLabel(report.role)}</p>
          <p className="mt-3 text-2xl font-black text-cyan-200">{report.activeStaff}</p>
          <p className="text-xs uppercase tracking-wide text-slate-500">active staff</p>
          <p className="mt-3 text-sm text-slate-400">{report.serviceActionsLast30Days} service actions in 30 days</p>
        </article>
      ))}
    </div>
    <div>
      <h3 className="text-lg font-bold text-white">Service history</h3>
      <div className="mt-3 space-y-2">
        {activity.map((item) => (
          <article className="rounded-xl border border-slate-800 p-3 text-sm" key={item._id}>
            <span className="font-semibold text-white">{item.actor?.profile?.username || item.actor?.email || "System"}</span>
            <span className="mx-2 text-cyan-200">{item.action.replaceAll("_", " ")}</span>
            <span className="text-slate-500">{new Date(item.createdAt).toLocaleString()}</span>
          </article>
        ))}
        {activity.length === 0 && <p className="text-sm text-slate-400">No staff activity recorded yet.</p>}
      </div>
    </div>
  </div>
);
