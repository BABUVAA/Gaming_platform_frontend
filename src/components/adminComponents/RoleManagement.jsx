import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import {
  changeAccessAssignmentScopes,
  changeAccessAssignmentStatus,
  clearAccessCandidate,
  createAccessAssignment,
  createStaffRecommendation,
  fetchAccessActivity,
  fetchAccessAssignments,
  fetchAccessPolicy,
  fetchAccessReports,
  fetchScopeGames,
  fetchStaffRecommendations,
  findAccessCandidate,
  reviewStaffRecommendation,
  withdrawStaffRecommendation,
} from "../../store/slices/accessControlSlice";
import {
  buildStaffReassignmentPayload,
  isStaffDirectoryAssignment,
} from "../../utils/staffDirectory";

const titleCase = (value = "") =>
  value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const personName = (person) => person?.profile?.username || person?.email || "Unknown account";
const formatDate = (value) => value ? new Date(value).toLocaleString() : "Not recorded";
const badge = {
  active: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  approved: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  pending: "border-amber-400/30 bg-amber-400/10 text-amber-100",
  suspended: "border-amber-400/30 bg-amber-400/10 text-amber-100",
  rejected: "border-rose-400/30 bg-rose-400/10 text-rose-100",
  revoked: "border-rose-400/30 bg-rose-400/10 text-rose-100",
  withdrawn: "border-slate-600 bg-slate-800 text-slate-300",
  expired: "border-slate-600 bg-slate-800 text-slate-300",
};
const actionLabels = {
  STAFF_RECOMMENDATION_CREATED: "recommended",
  STAFF_RECOMMENDATION_APPROVED: "approved a recommendation for",
  STAFF_RECOMMENDATION_REJECTED: "rejected a recommendation for",
  STAFF_RECOMMENDATION_WITHDRAWN: "withdrew a recommendation for",
  STAFF_ROLE_ASSIGNED: "assigned a role to",
  STAFF_ROLE_REACTIVATED: "reactivated a role for",
  STAFF_ROLE_ACTIVE: "restored access for",
  STAFF_ROLE_SUSPENDED: "suspended access for",
  STAFF_ROLE_REVOKED: "revoked access for",
  STAFF_ROLE_SCOPE_UPDATED: "changed game scope for",
};

const RoleManagement = ({ showStaffingActions = true }) => {
  const dispatch = useDispatch();
  const state = useSelector((root) => root.accessControl);
  const [tab, setTab] = useState(showStaffingActions ? "people" : "directory");
  const [email, setEmail] = useState("");
  const [roleForm, setRoleForm] = useState({ gameIds: [], mode: "", reason: "", role: "" });
  const [historyCategory, setHistoryCategory] = useState("");
  const [reviewNotes, setReviewNotes] = useState({});
  const [directoryQuery, setDirectoryQuery] = useState("");
  const [directoryRole, setDirectoryRole] = useState("all");

  const loadWorkspace = () => {
    dispatch(fetchAccessPolicy());
    dispatch(fetchScopeGames());
    dispatch(fetchAccessAssignments());
    if (showStaffingActions) dispatch(fetchStaffRecommendations());
    dispatch(fetchAccessReports());
    dispatch(fetchAccessActivity({ limit: 150 }));
  };

  useEffect(loadWorkspace, [dispatch, showStaffingActions]);

  const selectedRole = state.roles.find((role) => role.role === roleForm.role);
  const canAssign = state.manageableRoles.includes(roleForm.role);
  const canRecommend = state.recommendableRoles.includes(roleForm.role);
  const needsGames = selectedRole?.scope === "game";

  const groupedAssignments = useMemo(() => {
    const groups = new Map();
    state.assignments
      .filter(isStaffDirectoryAssignment)
      .forEach((assignment) => {
      const userId = assignment.user?._id || "unknown";
      const current = groups.get(userId) || { user: assignment.user, assignments: [] };
      current.assignments.push(assignment);
      groups.set(userId, current);
      });
    return [...groups.values()];
  }, [state.assignments]);

  const filteredDirectoryGroups = useMemo(() => {
    const normalizedQuery = directoryQuery.trim().toLowerCase();
    return groupedAssignments
      .map((group) => ({
        ...group,
        assignments: group.assignments.filter(
          (assignment) =>
            directoryRole === "all" || assignment.role === directoryRole,
        ),
      }))
      .filter((group) => {
        const matchesPerson = `${personName(group.user)} ${group.user?.email || ""}`
          .toLowerCase()
          .includes(normalizedQuery);
        return group.assignments.length > 0 && matchesPerson;
      });
  }, [directoryQuery, directoryRole, groupedAssignments]);

  const searchCandidate = async (event) => {
    event.preventDefault();
    dispatch(clearAccessCandidate());
    setRoleForm({ gameIds: [], mode: "", reason: "", role: "" });
    await dispatch(findAccessCandidate(email)).unwrap();
  };

  const selectRole = (roleName) => {
    const direct = state.manageableRoles.includes(roleName);
    setRoleForm({
      gameIds: [],
      mode: direct ? "assign" : "recommend",
      reason: "",
      role: roleName,
    });
  };

  const toggleGame = (gameId) => setRoleForm((current) => ({
    ...current,
    gameIds: current.gameIds.includes(gameId)
      ? current.gameIds.filter((id) => id !== gameId)
      : [...current.gameIds, gameId],
  }));

  const submitRoleAction = async (event) => {
    event.preventDefault();
    const payload = { gameIds: roleForm.gameIds, role: roleForm.role };
    if (roleForm.mode === "assign") {
      await dispatch(createAccessAssignment({ ...payload, userId: state.candidate._id })).unwrap();
    } else {
      await dispatch(createStaffRecommendation({
        ...payload,
        candidateId: state.candidate._id,
        reason: roleForm.reason,
      })).unwrap();
    }
    await Promise.all([
      dispatch(fetchAccessAssignments()).unwrap(),
      dispatch(fetchStaffRecommendations()).unwrap(),
      dispatch(fetchAccessActivity({ limit: 150 })).unwrap(),
      dispatch(findAccessCandidate(email)).unwrap(),
    ]);
    setRoleForm({ gameIds: [], mode: "", reason: "", role: "" });
  };

  const refreshAfterMutation = async () => Promise.all([
    dispatch(fetchAccessAssignments()).unwrap(),
    dispatch(fetchStaffRecommendations()).unwrap(),
    dispatch(fetchAccessReports()).unwrap(),
    dispatch(fetchAccessActivity({ limit: 150, category: historyCategory })).unwrap(),
  ]);

  const changeStatus = async (assignmentId, status) => {
    await dispatch(changeAccessAssignmentStatus({ assignmentId, status })).unwrap();
    await refreshAfterMutation();
  };

  const reassignRole = async (assignment) => {
    await dispatch(
      createAccessAssignment(buildStaffReassignmentPayload(assignment)),
    ).unwrap();
    await refreshAfterMutation();
  };

  const changeScopes = async (assignmentId, gameIds) => {
    await dispatch(changeAccessAssignmentScopes({ assignmentId, gameIds })).unwrap();
    await refreshAfterMutation();
  };

  const review = async (recommendationId, decision) => {
    await dispatch(reviewStaffRecommendation({
      decision,
      recommendationId,
      reviewNote: reviewNotes[recommendationId] || "",
    })).unwrap();
    await refreshAfterMutation();
  };

  const withdraw = async (recommendationId) => {
    await dispatch(withdrawStaffRecommendation({ recommendationId })).unwrap();
    await refreshAfterMutation();
  };

  const filterHistory = (category) => {
    setHistoryCategory(category);
    dispatch(fetchAccessActivity({ category, limit: 150 }));
  };

  return (
    <section className="overflow-hidden rounded-[30px] border border-slate-800 bg-[#07111f] shadow-[0_28px_80px_rgba(2,8,23,0.45)]">

      <nav className="flex gap-2 overflow-x-auto border-b border-slate-800 bg-slate-950/55 px-5 py-3">
        {(showStaffingActions
          ? ["people", "hiring", "directory", "history", "policy"]
          : ["directory", "history", "policy"]
        ).map((item) => (
          <button className={item === tab ? "rounded-xl bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950" : "rounded-xl px-4 py-2 text-sm font-bold text-slate-400 hover:bg-slate-900 hover:text-white"} key={item} onClick={() => setTab(item)} type="button">{titleCase(item)}</button>
        ))}
      </nav>

      <div className="p-5 lg:p-8">
        {showStaffingActions && tab === "people" && (
          <PeoplePanel
            candidate={state.candidate}
            canAssign={canAssign}
            canRecommend={canRecommend}
            email={email}
            form={roleForm}
            isLoading={state.isLoading}
            needsGames={needsGames}
            onEmailChange={setEmail}
            onModeChange={(mode) => setRoleForm((current) => ({ ...current, mode }))}
            onReasonChange={(reason) => setRoleForm((current) => ({ ...current, reason }))}
            onRoleSelect={selectRole}
            onSearch={searchCandidate}
            onSubmit={submitRoleAction}
            onToggleGame={toggleGame}
            roles={state.roles}
            scopeGames={state.scopeGames}
          />
        )}
        {showStaffingActions && tab === "hiring" && <HiringPanel onNoteChange={(id, note) => setReviewNotes((current) => ({ ...current, [id]: note }))} onReview={review} onWithdraw={withdraw} recommendations={state.recommendations} reviewNotes={reviewNotes} />}
        {tab === "directory" && <DirectoryPanel directoryQuery={directoryQuery} directoryRole={directoryRole} groups={filteredDirectoryGroups} onQueryChange={setDirectoryQuery} onReassign={reassignRole} onRoleChange={setDirectoryRole} onScopeChange={changeScopes} onStatusChange={changeStatus} roles={state.roles} scopeGames={state.scopeGames} />}
        {tab === "history" && <HistoryPanel activity={state.activity} category={historyCategory} onCategoryChange={filterHistory} reports={state.reports} />}
        {tab === "policy" && <PolicyPanel manageableRoles={state.manageableRoles} recommendableRoles={state.recommendableRoles} roles={state.roles} />}
      </div>
    </section>
  );
};

const Metric = ({ label, value }) => <div className="min-w-24 rounded-2xl border border-slate-700/70 bg-slate-950/70 px-3 py-3"><p className="text-xl font-black text-cyan-100">{value}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">{label}</p></div>;
Metric.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.number.isRequired };

const PeoplePanel = ({ candidate, canAssign, canRecommend, email, form, isLoading, needsGames, onEmailChange, onModeChange, onReasonChange, onRoleSelect, onSearch, onSubmit, onToggleGame, roles, scopeGames }) => {
  return (
  <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
    <div className="rounded-2xl border border-slate-800 bg-slate-950/55 p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">Find account</p>
      <h3 className="mt-2 text-xl font-black text-white">Search by exact email</h3>
      <p className="mt-2 text-sm text-slate-400">Only verified, eligible accounts are returned. This prevents browsing the entire player directory.</p>
      <form className="mt-5 flex flex-col gap-3 sm:flex-row" onSubmit={onSearch}>
        <input className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-300" onChange={(event) => onEmailChange(event.target.value)} placeholder="player@example.com" type="email" value={email} />
        <button className="rounded-xl bg-cyan-300 px-5 py-3 font-black text-slate-950 disabled:opacity-50" disabled={isLoading || !email.trim()} type="submit">Search</button>
      </form>
      {!candidate && <div className="mt-6 rounded-2xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-500">Search for an account to view identity and role details.</div>}
      {candidate && <CandidateCard candidate={candidate} />}
    </div>

    <form className="rounded-2xl border border-slate-800 bg-slate-950/55 p-5" onSubmit={onSubmit}>
      <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">Role action</p>
      <h3 className="mt-2 text-xl font-black text-white">
        Add a role
      </h3>
      <p className="mt-2 text-sm text-slate-400">One person may hold several different roles. Existing roles are shown before you continue.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {roles.map((role) => {
          const existingStatus = candidate?.assignments?.find(
            (assignment) => assignment.role === role.role,
          )?.status;
          const unavailable = Boolean(existingStatus);
          const statusText = existingStatus === "active"
            ? "Already active"
            : existingStatus === "suspended"
              ? "Restore in Directory"
              : existingStatus === "revoked"
                ? "Reassign in Directory"
                : "Available";

          return (
            <button
              className={form.role === role.role
                ? "rounded-2xl border border-cyan-300 bg-cyan-300/10 p-4 text-left"
                : "rounded-2xl border border-slate-700 bg-slate-900/70 p-4 text-left hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-45"}
              disabled={unavailable || !candidate}
              key={role.role}
              onClick={() => onRoleSelect(role.role)}
              type="button"
            >
              <span className="font-bold text-white">{titleCase(role.role)}</span>
              <p className="mt-2 text-xs leading-5 text-slate-400">{role.description}</p>
              <p className={existingStatus === "revoked" ? "mt-3 text-xs font-bold text-amber-200" : "mt-3 text-xs font-bold text-slate-500"}>
                {statusText}
              </p>
            </button>
          );
        })}
      </div>
      {form.role && <div className="mt-5 space-y-4 rounded-2xl border border-slate-800 bg-slate-900/45 p-4">
        {canAssign && canRecommend && <div className="flex gap-2"><ModeButton active={form.mode === "assign"} label="Assign directly" onClick={() => onModeChange("assign")} /><ModeButton active={form.mode === "recommend"} label="Recommend for review" onClick={() => onModeChange("recommend")} /></div>}
        <p className="text-sm text-slate-300">Action: <strong className="text-white">{form.mode === "assign" ? "Direct assignment" : "Higher-authority review"}</strong></p>
        {needsGames && <GameChoices games={scopeGames} selected={form.gameIds} onToggle={onToggleGame} />}
        {form.mode === "recommend" && <textarea className="min-h-28 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white" maxLength={1000} onChange={(event) => onReasonChange(event.target.value)} placeholder="Why is this person suitable? Include experience, reliability, and expected responsibilities." value={form.reason} />}
        <button className="w-full rounded-xl bg-cyan-300 px-5 py-3 font-black text-slate-950 disabled:opacity-40" disabled={!candidate || !form.role || (needsGames && form.gameIds.length === 0) || (form.mode === "recommend" && form.reason.trim().length < 20)} type="submit">{form.mode === "assign" ? "Assign role" : "Send recommendation"}</button>
      </div>}
    </form>
  </div>
  );
};

const CandidateCard = ({ candidate }) => <div className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/5 p-5"><div className="flex items-center gap-4"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300 font-black text-slate-950">{personName(candidate).slice(0, 2).toUpperCase()}</div><div><p className="font-black text-white">{personName(candidate)}</p><p className="text-sm text-slate-400">{candidate.email}</p><p className="mt-1 text-xs text-emerald-200">Verified account</p></div></div><div className="mt-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Visible role history</p><div className="mt-2 flex flex-wrap gap-2">{candidate.assignments?.map((item) => <StatusPill key={item._id} status={item.status} text={titleCase(item.role) + " · " + titleCase(item.status)} />)}{!candidate.assignments?.length && <span className="text-sm text-slate-500">No existing visible staff roles.</span>}</div></div></div>;
CandidateCard.propTypes = { candidate: PropTypes.object.isRequired };

const ModeButton = ({ active, label, onClick }) => <button className={active ? "rounded-lg bg-cyan-300 px-3 py-2 text-sm font-bold text-slate-950" : "rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300"} onClick={onClick} type="button">{label}</button>;
ModeButton.propTypes = { active: PropTypes.bool.isRequired, label: PropTypes.string.isRequired, onClick: PropTypes.func.isRequired };

const GameChoices = ({ games, onToggle, selected }) => <div><p className="text-sm font-bold text-white">Game scope</p><div className="mt-2 flex flex-wrap gap-2">{games.map((game) => <label className="flex cursor-pointer gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300" key={game._id}><input checked={selected.includes(game._id)} onChange={() => onToggle(game._id)} type="checkbox" />{game.name}</label>)}</div></div>;
GameChoices.propTypes = { games: PropTypes.array.isRequired, onToggle: PropTypes.func.isRequired, selected: PropTypes.array.isRequired };

const HiringPanel = ({ onNoteChange, onReview, onWithdraw, recommendations, reviewNotes }) => <div className="space-y-4"><SectionHeading title="Hiring queue" text="Recommendations stay powerless until a different authorized reviewer approves them." />{recommendations.map((item) => <article className="rounded-2xl border border-slate-800 bg-slate-950/55 p-5" key={item._id}><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="text-lg font-black text-white">{personName(item.candidate)}</p><StatusPill status={item.status} text={titleCase(item.status)} /></div><p className="mt-1 text-sm text-slate-400">{item.candidate?.email}</p><p className="mt-3 text-sm text-cyan-100">Requested role: {titleCase(item.role)}</p><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">{item.reason}</p><p className="mt-3 text-xs text-slate-500">Recommended by {personName(item.recommendedBy)} on {formatDate(item.createdAt)} · expires {formatDate(item.expiresAt)}</p>{item.reviewedBy && <p className="mt-2 text-xs text-slate-400">Reviewed by {personName(item.reviewedBy)}: {item.reviewNote || "No note"}</p>}</div>{item.status === "pending" && <div className="w-full max-w-md space-y-2">{item.canReview && <textarea className="min-h-20 w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white" onChange={(event) => onNoteChange(item._id, event.target.value)} placeholder="Review note (required when rejecting)" value={reviewNotes[item._id] || ""} /> }<div className="flex flex-wrap gap-2">{item.canReview && <><button className="rounded-lg bg-emerald-300 px-3 py-2 text-sm font-black text-slate-950" onClick={() => onReview(item._id, "approved")} type="button">Approve</button><button className="rounded-lg border border-rose-400/40 px-3 py-2 text-sm font-bold text-rose-100" disabled={(reviewNotes[item._id] || "").trim().length < 10} onClick={() => onReview(item._id, "rejected")} type="button">Reject</button></>}{item.canWithdraw && <button className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300" onClick={() => onWithdraw(item._id)} type="button">Withdraw</button>}</div></div>}</div></article>)}{recommendations.length === 0 && <Empty text="No hiring recommendations are visible to your current roles." />}</div>;

const DirectoryPanel = ({ directoryQuery, directoryRole, groups, onQueryChange, onReassign, onRoleChange, onScopeChange, onStatusChange, roles, scopeGames }) => {
  const visibleRoleCount = groups.reduce(
    (total, group) => total + group.assignments.length,
    0,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          title="Staff directory"
          text="One row per role. Revoked roles remain available for deliberate reassignment."
        />
        <div className="flex flex-wrap gap-2">
          <input
            className="min-w-56 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search name or email"
            value={directoryQuery}
          />
          <select
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            onChange={(event) => onRoleChange(event.target.value)}
            value={directoryRole}
          >
            <option value="all">All roles</option>
            {roles.map((role) => (
              <option key={role.role} value={role.role}>{titleCase(role.role)}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Showing {visibleRoleCount} role{visibleRoleCount === 1 ? "" : "s"}
        {groups.length ? ` across ${groups.length} staff account${groups.length === 1 ? "" : "s"}` : ""}.
      </p>

      <div className="overflow-hidden rounded-2xl border border-slate-800">
        <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(12rem,0.9fr)_15rem] gap-4 bg-slate-900/80 px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 lg:grid">
          <span>Email address</span>
          <span>Role</span>
          <span className="text-right">Actions</span>
        </div>
        {groups.flatMap((group) =>
          group.assignments.map((assignment) => (
            <AssignmentRow
              assignment={assignment}
              key={assignment._id}
              onScopeChange={onScopeChange}
              onStatusChange={onStatusChange}
              onReassign={onReassign}
              role={roles.find((item) => item.role === assignment.role)}
              scopeGames={scopeGames}
              user={group.user}
            />
          )),
        )}
        {groups.length === 0 && <Empty text="No staff accounts match these filters." />}
      </div>
    </div>
  );
};

const AssignmentRow = ({ assignment, onReassign, onScopeChange, onStatusChange, role, scopeGames, user }) => {
  const [editing, setEditing] = useState(false);
  const [gameIds, setGameIds] = useState(
    () => assignment.gameScopes?.map((game) => game._id) || [],
  );
  const toggle = (id) => setGameIds((current) =>
    current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id],
  );
  const scopeLabel = assignment.gameScopes?.map((game) => game.name).join(", ")
    || `${titleCase(role?.scope || "assigned work")} scope`;

  return (
    <div className="border-t border-slate-800 bg-slate-950/55 px-4 py-3 first:border-t-0">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(12rem,0.9fr)_15rem] lg:items-center lg:gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">{user?.email || "Email unavailable"}</p>
          <p className="truncate text-xs text-slate-500">{personName(user)}</p>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-slate-100">{titleCase(assignment.role)}</p>
            <StatusPill status={assignment.status} text={titleCase(assignment.status)} />
          </div>
          <p className="mt-1 truncate text-xs text-slate-500">{scopeLabel}</p>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          {role?.scope === "game" && assignment.status !== "revoked" && (
            <button className="rounded-lg border border-sky-400/40 px-2.5 py-1.5 text-xs font-bold text-sky-100" onClick={() => setEditing((value) => !value)} type="button">
              Scope
            </button>
          )}
          {assignment.status === "active" && (
            <button className="rounded-lg border border-amber-400/40 px-2.5 py-1.5 text-xs font-bold text-amber-100" onClick={() => onStatusChange(assignment._id, "suspended")} type="button">
              Suspend
            </button>
          )}
          {assignment.status === "suspended" && (
            <button className="rounded-lg border border-cyan-400/40 px-2.5 py-1.5 text-xs font-bold text-cyan-100" onClick={() => onStatusChange(assignment._id, "active")} type="button">
              Restore
            </button>
          )}
          {assignment.status === "revoked" ? (
            <button className="rounded-lg border border-emerald-400/40 px-2.5 py-1.5 text-xs font-bold text-emerald-100" onClick={() => onReassign(assignment)} type="button">
              Reassign
            </button>
          ) : (
            <button className="rounded-lg border border-rose-400/40 px-2.5 py-1.5 text-xs font-bold text-rose-100" onClick={() => onStatusChange(assignment._id, "revoked")} type="button">
              Revoke
            </button>
          )}
        </div>
      </div>

      {editing && (
        <div className="mt-3 border-t border-slate-800 pt-3">
          <GameChoices games={scopeGames} onToggle={toggle} selected={gameIds} />
          <button
            className="mt-3 rounded-lg bg-cyan-300 px-3 py-2 text-xs font-black text-slate-950 disabled:opacity-40"
            disabled={!gameIds.length}
            onClick={async () => {
              await onScopeChange(assignment._id, gameIds);
              setEditing(false);
            }}
            type="button"
          >
            Save scope
          </button>
        </div>
      )}
    </div>
  );
};
AssignmentRow.propTypes = { assignment: PropTypes.object.isRequired, onReassign: PropTypes.func.isRequired, onScopeChange: PropTypes.func.isRequired, onStatusChange: PropTypes.func.isRequired, role: PropTypes.object, scopeGames: PropTypes.array.isRequired, user: PropTypes.object.isRequired };

const HistoryPanel = ({ activity, category, onCategoryChange, reports }) => <div><div className="grid gap-3 md:grid-cols-3">{reports.map((report) => <div className="rounded-2xl border border-slate-800 bg-slate-950/55 p-4" key={report.role}><p className="text-sm font-bold text-cyan-100">{titleCase(report.role)}</p><p className="mt-2 text-2xl font-black text-white">{report.activeStaff}</p><p className="text-xs text-slate-500">active · {report.serviceActionsLast30Days} service actions in 30 days</p></div>)}</div><div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><SectionHeading title="Who changed what" text="Every row identifies the actor, action, affected person, role, and time." /><select className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" onChange={(event) => onCategoryChange(event.target.value)} value={category}><option value="">All history</option><option value="access">Role history</option><option value="service">Service history</option></select></div><div className="mt-4 space-y-3">{activity.map((item) => <article className="grid gap-3 rounded-xl border border-slate-800 bg-slate-950/55 p-4 md:grid-cols-[1fr_auto]" key={item._id}><div><p className="text-sm text-slate-200"><strong className="text-white">{personName(item.actor)}</strong> {actionLabels[item.action] || titleCase(item.action)} <strong className="text-white">{personName(item.targetUser)}</strong></p><div className="mt-2 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-cyan-300/10 px-2 py-1 text-cyan-100">{titleCase(item.role)}</span><span className="rounded-full bg-slate-800 px-2 py-1 text-slate-300">{titleCase(item.category)}</span>{item.metadata?.reviewNote && <span className="text-slate-400">Note: {item.metadata.reviewNote}</span>}</div></div><time className="text-xs text-slate-500">{formatDate(item.createdAt)}</time></article>)}{activity.length === 0 && <Empty text="No history matches this filter." />}</div></div>;

const PolicyPanel = ({ manageableRoles, recommendableRoles, roles }) => <div className="grid gap-4 lg:grid-cols-2">{roles.map((role) => <article className="rounded-2xl border border-slate-800 bg-slate-950/55 p-5" key={role.role}><div className="flex justify-between gap-3"><div><h3 className="text-lg font-black text-white">{titleCase(role.role)}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{role.description}</p></div><span className="h-fit rounded-full border border-slate-700 px-2 py-1 text-xs text-cyan-100">{titleCase(role.scope)}</span></div><div className="mt-4 flex gap-2">{manageableRoles.includes(role.role) && <StatusPill status="approved" text="You can assign" />}{recommendableRoles.includes(role.role) && <StatusPill status="pending" text="You can recommend" />}</div><p className="mt-4 text-xs text-slate-500">Permissions: {role.permissions?.map(titleCase).join(", ") || "None"}</p></article>)}</div>;

const StatusPill = ({ status, text }) => <span className={(badge[status] || badge.withdrawn) + " rounded-full border px-2 py-1 text-[11px] font-bold"}>{text}</span>;
StatusPill.propTypes = { status: PropTypes.string.isRequired, text: PropTypes.string.isRequired };
const SectionHeading = ({ text, title }) => <div><h3 className="text-xl font-black text-white">{title}</h3><p className="mt-1 text-sm text-slate-400">{text}</p></div>;
SectionHeading.propTypes = { text: PropTypes.string.isRequired, title: PropTypes.string.isRequired };
const Empty = ({ text }) => <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">{text}</div>;
Empty.propTypes = { text: PropTypes.string.isRequired };

PeoplePanel.propTypes = { candidate: PropTypes.object, canAssign: PropTypes.bool.isRequired, canRecommend: PropTypes.bool.isRequired, email: PropTypes.string.isRequired, form: PropTypes.object.isRequired, isLoading: PropTypes.bool.isRequired, needsGames: PropTypes.bool.isRequired, onEmailChange: PropTypes.func.isRequired, onModeChange: PropTypes.func.isRequired, onReasonChange: PropTypes.func.isRequired, onRoleSelect: PropTypes.func.isRequired, onSearch: PropTypes.func.isRequired, onSubmit: PropTypes.func.isRequired, onToggleGame: PropTypes.func.isRequired, roles: PropTypes.array.isRequired, scopeGames: PropTypes.array.isRequired };
HiringPanel.propTypes = { onNoteChange: PropTypes.func.isRequired, onReview: PropTypes.func.isRequired, onWithdraw: PropTypes.func.isRequired, recommendations: PropTypes.array.isRequired, reviewNotes: PropTypes.object.isRequired };
DirectoryPanel.propTypes = { directoryQuery: PropTypes.string.isRequired, directoryRole: PropTypes.string.isRequired, groups: PropTypes.array.isRequired, onQueryChange: PropTypes.func.isRequired, onReassign: PropTypes.func.isRequired, onRoleChange: PropTypes.func.isRequired, onScopeChange: PropTypes.func.isRequired, onStatusChange: PropTypes.func.isRequired, roles: PropTypes.array.isRequired, scopeGames: PropTypes.array.isRequired };
HistoryPanel.propTypes = { activity: PropTypes.array.isRequired, category: PropTypes.string.isRequired, onCategoryChange: PropTypes.func.isRequired, reports: PropTypes.array.isRequired };
PolicyPanel.propTypes = { manageableRoles: PropTypes.array.isRequired, recommendableRoles: PropTypes.array.isRequired, roles: PropTypes.array.isRequired };
RoleManagement.propTypes = { showStaffingActions: PropTypes.bool };

export default RoleManagement;
