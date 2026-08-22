import {
  FaCrown,
  FaGamepad,
  FaLayerGroup,
  FaMapMarkedAlt,
  FaSatelliteDish,
  FaShieldAlt,
  FaTrophy,
  FaUser,
  FaWallet,
  FaLink,
} from "react-icons/fa";
import { MdOutlineCastle } from "react-icons/md";
import { ROUTES } from "../routes/routeConstants.js";
import { USER_ROLES } from "./accessControl.js";

// Navigation data reuses route constants so the menu, guards, and router all
// point at the same URLs. That keeps future role/domain splits from drifting.

const adminNavigation = [
  {
    label: "Admin",
    description: "Platform operations",
    to: ROUTES.ADMIN_PANEL,
    icon: FaCrown,
    match: [ROUTES.ADMIN_PANEL],
  },
];

const operatorNavigation = [
  {
    label: "Operations",
    description: "Lobby ops and dispute flow",
    to: ROUTES.OPERATIONS,
    icon: FaSatelliteDish,
    match: [ROUTES.OPERATIONS],
  },
];

const staffNavigation = [
  {
    label: "Admin",
    description: "Platform administration",
    to: ROUTES.ADMIN_PANEL,
    icon: FaCrown,
    match: [ROUTES.ADMIN_PANEL],
    requiredStaffRoles: ["super_admin", "platform_admin"],
  },
  {
    label: "Operations",
    description: "Lobby and match operations",
    to: ROUTES.OPERATIONS,
    icon: FaSatelliteDish,
    match: [ROUTES.OPERATIONS],
    requiredStaffRoles: ["super_admin", "platform_admin", "match_operator"],
  },
  {
    label: "Event Manager",
    description: "Create and schedule Events",
    to: ROUTES.EVENT_MANAGER,
    icon: FaTrophy,
    match: [ROUTES.EVENT_MANAGER],
    requiredStaffRoles: ["event_manager"],
  },
  {
    label: "Tournament Manager",
    description: "Create and manage assigned tournaments",
    to: ROUTES.TOURNAMENT_MANAGER,
    icon: FaTrophy,
    match: [ROUTES.TOURNAMENT_MANAGER],
    requiredStaffRoles: ["tournament_manager"],
  },
];

const staffUtilityNavigation = [
  {
    label: "Staff Workspace",
    description: "Open your assigned operational tools",
    to: ROUTES.STAFF,
    icon: FaShieldAlt,
    match: [ROUTES.STAFF],
  },
  {
    label: "Compete",
    description: "View player-facing competitions",
    to: ROUTES.GAME,
    icon: FaGamepad,
    match: [ROUTES.GAME],
  },
  {
    label: "Matches",
    description: "View safe match information",
    to: ROUTES.MATCHES,
    icon: FaMapMarkedAlt,
    match: [ROUTES.MATCHES],
  },
  {
    label: "Wallet history",
    description: "View account ledger without money actions",
    to: ROUTES.WALLET,
    icon: FaWallet,
    match: [ROUTES.WALLET],
  },
  {
    label: "Profile",
    description: "View account identity information",
    to: ROUTES.PROFILE,
    icon: FaUser,
    match: [ROUTES.PROFILE],
  },
  {
    label: "Game Accounts",
    description: "View linked-account and request status",
    to: ROUTES.GAME_ACCOUNTS,
    icon: FaLink,
    match: [ROUTES.GAME_ACCOUNTS, ROUTES.ACCOUNT_LEGACY],
  },
  {
    label: "Account Settings",
    description: "Email, password and sign-in security",
    to: ROUTES.ACCOUNT_SETTINGS,
    icon: FaShieldAlt,
    match: [ROUTES.ACCOUNT_SETTINGS],
  },
];

const playerNavigation = [
  {
    label: "Compete",
    description: "Find your next challenge",
    to: ROUTES.DASHBOARD,
    icon: FaGamepad,
    match: [ROUTES.DASHBOARD],
  },
  {
    label: "Clans",
    description: "Build and play together",
    to: ROUTES.CLAN,
    icon: MdOutlineCastle,
    match: [ROUTES.CLAN],
  },
  {
    label: "Matches",
    description: "Schedules and results",
    to: ROUTES.MATCHES,
    icon: FaMapMarkedAlt,
    match: [ROUTES.MATCHES],
  },
  {
    label: "Chats",
    description: "Talk with friends and teams",
    to: ROUTES.CHATS,
    icon: FaLayerGroup,
    match: [ROUTES.CHATS],
  },
  {
    label: "Wallet",
    description: "Balance, prizes and history",
    to: ROUTES.WALLET,
    icon: FaWallet,
    match: [ROUTES.WALLET],
  },
  {
    label: "Profile",
    description: "Gaming record and identity",
    to: ROUTES.PROFILE,
    icon: FaUser,
    match: [ROUTES.PROFILE],
  },
  {
    label: "Game Accounts",
    description: "Connect your game identities",
    to: ROUTES.GAME_ACCOUNTS,
    icon: FaLink,
    match: [ROUTES.GAME_ACCOUNTS, ROUTES.ACCOUNT_LEGACY],
  },
  {
    label: "Account Settings",
    description: "Email, security and sign-in",
    to: ROUTES.ACCOUNT_SETTINGS,
    icon: FaShieldAlt,
    match: [ROUTES.ACCOUNT_SETTINGS],
  },
];

const allNavigation = [
  ...adminNavigation,
  ...operatorNavigation,
  ...playerNavigation,
  ...staffUtilityNavigation,
  ...staffNavigation,
];

export const getStaffWorkspaceNavigation = (summary) => {
  const staffRoles = new Set(
    summary?.staffAssignments?.map((assignment) => assignment.role) || [],
  );
  return [
    staffUtilityNavigation[0],
    ...staffNavigation.filter((item) =>
      item.requiredStaffRoles.some((role) => staffRoles.has(role)),
    ),
  ];
};

export const getDefaultRouteForRole = (role) => {
  // This helper is the single redirect source for role-based landings.
  // If a new role is introduced later, add its safe default destination here.
  if (role === USER_ROLES.ADMIN) return ROUTES.ADMIN_PANEL;
  if (role === USER_ROLES.OPERATOR) return ROUTES.OPERATIONS;
  return ROUTES.DASHBOARD;
};

export const getDashboardNavigation = (
  summaryOrRole,
  { includeStaffWorkspaces = true } = {},
) => {
  // Compatibility with older callers is retained while navigation moves from
  // legacy user roles to server-provided staff assignments.
  if (typeof summaryOrRole === "string") {
    if (summaryOrRole === USER_ROLES.ADMIN) return adminNavigation;
    if (summaryOrRole === USER_ROLES.OPERATOR) return operatorNavigation;
    return playerNavigation;
  }

  const staffRoles = new Set(
    summaryOrRole?.staffAssignments?.map((assignment) => assignment.role) || [],
  );
  if (summaryOrRole?.role === "staff") {
    const assignedWorkspaces = includeStaffWorkspaces
      ? staffNavigation.filter((item) =>
          item.requiredStaffRoles.some((role) => staffRoles.has(role)),
        )
      : [];

    return [...staffUtilityNavigation, ...assignedWorkspaces];
  }
  return [
    ...playerNavigation,
    ...staffNavigation.filter((item) =>
      item.requiredStaffRoles.some((role) => staffRoles.has(role)),
    ),
  ];
};

export const getNavigationTitle = (pathname) => {
  const found = allNavigation
    .flatMap((item) => item.match.map((prefix) => ({ item, prefix })))
    .filter(({ prefix }) => pathname.startsWith(prefix))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0]?.item;

  if (!found) {
    return {
      label: "Platform",
      description: "Your gaming home",
    };
  }

  return {
    label: found.label,
    description: found.description,
  };
};
