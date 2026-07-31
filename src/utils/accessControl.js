// Roles describe a user's primary responsibility on the platform.
// Host access is intentionally excluded because hosting is an approved player
// capability, not a separate identity.
export const USER_ROLES = Object.freeze({
  ADMIN: "admin",
  OPERATOR: "operator",
  PLAYER: "player",
});

// Keeping approval states centralized prevents route guards and components
// from using slightly different status values as hosting features are added.
export const HOST_ACCESS_STATUSES = Object.freeze({
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  SUSPENDED: "suspended",
});

export const isPlayer = (profile) => {
  // A host remains a player, so all standard player access starts here.
  return profile?.role === USER_ROLES.PLAYER;
};

export const hasApprovedHostAccess = (profile) => {
  // The lightweight player summary returns hostAccess beside the base role.
  // Both conditions are required so approval can never turn another role into
  // a host accidentally.
  return (
    isPlayer(profile) &&
    profile?.hostAccess?.status === HOST_ACCESS_STATUSES.APPROVED
  );
};
