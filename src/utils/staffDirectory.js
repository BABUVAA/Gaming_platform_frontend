const DIRECTORY_STATUSES = new Set(["active", "suspended", "revoked"]);

// Role Management's Directory is a current staffing view, not an audit log.
// Revoked roles remain visible so governance can deliberately reassign them.
export const isStaffDirectoryAssignment = (assignment) =>
  DIRECTORY_STATUSES.has(assignment?.status);

export const buildStaffReassignmentPayload = (assignment) => ({
  gameIds: assignment?.gameScopes?.map((game) => game._id) || [],
  role: assignment?.role,
  userId: assignment?.user?._id,
});
