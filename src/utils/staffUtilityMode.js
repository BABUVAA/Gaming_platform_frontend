export const STAFF_UTILITY_MESSAGE =
  "This player area is read-only for staff. Use your assigned Staff Workspace for operational actions.";

export const isStaffUtilitySummary = (summary) => summary?.role === "staff";

const formatRole = (role = "") =>
  role
    .split("_")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");

export const getStaffUtilityRoleLabel = (summary) => {
  if (!isStaffUtilitySummary(summary)) return "Player";

  const roles = [
    ...new Set(
      (summary.staffAssignments || [])
        .map((assignment) => formatRole(assignment?.role))
        .filter(Boolean),
    ),
  ];

  return roles.length ? `Staff · ${roles.join(" / ")}` : "Staff";
};
