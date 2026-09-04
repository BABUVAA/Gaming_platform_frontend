import {
  FaCrown,
  FaGamepad,
  FaLayerGroup,
  FaMapMarkedAlt,
  FaSatelliteDish,
  FaShieldAlt,
  FaTrophy,
  FaUser,
  FaUsers,
  FaWallet,
  FaLink,
  FaDiscord,
  FaGift,
  FaUserFriends,
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
  {
    label: "Game Manager",
    description: "Supervise rooms, schedules and game accounts",
    to: ROUTES.GAME_MANAGER,
    icon: FaGamepad,
    match: [ROUTES.GAME_MANAGER],
    requiredStaffRoles: ["game_manager"],
  },
];

const staffUtilityNavigation = [
  {
    label: "Discord",
    description: "Connect and sync staff roles",
    to: ROUTES.DISCORD_OPERATIONS,
    icon: FaDiscord,
    match: [ROUTES.DISCORD_OPERATIONS],
  },
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
    mobileLabel: "Games",
    description: "View linked-account and request status",
    to: ROUTES.GAME_ACCOUNTS,
    icon: FaLink,
    match: [ROUTES.GAME_ACCOUNTS, ROUTES.ACCOUNT_LEGACY],
  },
  {
    label: "Account Settings",
    mobileLabel: "Settings",
    description: "Email, password and sign-in security",
    to: ROUTES.ACCOUNT_SETTINGS,
    icon: FaShieldAlt,
    match: [ROUTES.ACCOUNT_SETTINGS],
  },
];

const playerNavigation = [
  {
    label: "Compete",
    mobilePrimary: true,
    mobileOrder: 1,
    description: "Find your next challenge",
    to: ROUTES.DASHBOARD,
    icon: FaGamepad,
    match: [ROUTES.DASHBOARD],
  },
  {
    label: "Clans",
    mobileLabel: "Clan",
    mobilePrimary: true,
    mobileOrder: 2,
    description: "Build and play together",
    to: ROUTES.CLAN,
    icon: MdOutlineCastle,
    match: [ROUTES.CLAN],
  },
  {
    label: "Friends",
    description: "Find players and manage connections",
    to: ROUTES.FRIENDS,
    icon: FaUserFriends,
    match: [ROUTES.FRIENDS],
  },
  {
    label: "Teams",
    description: "Create and manage your lineups",
    to: ROUTES.TEAMS,
    icon: FaUsers,
    match: [ROUTES.TEAMS],
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
    mobileLabel: "Chat",
    mobilePrimary: true,
    mobileOrder: 5,
    description: "Talk with friends and teams",
    to: ROUTES.CHATS,
    icon: FaLayerGroup,
    match: [ROUTES.CHATS],
  },
  {
    label: "Wallet",
    mobilePrimary: true,
    mobileOrder: 4,
    description: "Balance, prizes and history",
    to: ROUTES.WALLET,
    icon: FaWallet,
    match: [ROUTES.WALLET],
  },
  {
    label: "Refer & Earn",
    mobileLabel: "Earn",
    description: "Invite players and earn tournament credit",
    to: ROUTES.REFER,
    icon: FaGift,
    match: [ROUTES.REFER],
  },
  {
    label: "Profile",
    mobilePrimary: true,
    mobileOrder: 3,
    description: "Gaming record and identity",
    to: ROUTES.PROFILE,
    icon: FaUser,
    match: [ROUTES.PROFILE],
  },
  {
    label: "Game Accounts",
    mobileLabel: "Games",
    description: "Connect your game identities",
    to: ROUTES.GAME_ACCOUNTS,
    icon: FaLink,
    match: [ROUTES.GAME_ACCOUNTS, ROUTES.ACCOUNT_LEGACY],
  },
  {
    label: "Account Settings",
    mobileLabel: "Settings",
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

export const getStaffWorkspaceNavigation = (
  summary,
  pathname = ROUTES.STAFF,
) => {
  if (summary?.role && summary.role !== "staff") return [];
  const workspaceSwitcher = {
    ...staffUtilityNavigation[1],
    navigationKind: "switcher",
  };
  const destinations = [
    {
      label: "Admin dashboard",
      description: "Platform administration",
      to: ROUTES.ADMIN_PANEL,
      icon: FaCrown,
      match: [ROUTES.ADMIN_PANEL],
    },
    {
      label: "Access control",
      description: "Review staff access and assignments",
      to: ROUTES.STAFF_ACCESS_CONTROL,
      icon: FaShieldAlt,
      match: [ROUTES.STAFF_ACCESS_CONTROL],
    },
    {
      label: "Match Operator dashboard",
      description: "Assigned rooms and matches",
      to: ROUTES.OPERATIONS,
      icon: FaSatelliteDish,
      match: [ROUTES.OPERATIONS],
      tabs: [
        { id: "rooms", label: "Active rooms" },
        { id: "queue", label: "Full rooms" },
        { id: "matches", label: "Assigned matches" },
      ],
    },
    {
      label: "Event Manager dashboard",
      description: "Templates, Events, registrations and rounds",
      to: ROUTES.EVENT_MANAGER,
      icon: FaTrophy,
      match: [ROUTES.EVENT_MANAGER],
      tabs: [
        { id: "templates", label: "Templates" },
        { id: "invitations", label: "Invitations" },
        { id: "results", label: "Results & rewards" },
        { id: "events", label: "Events" },
      ],
    },
    {
      label: "Tournament Manager dashboard",
      description: "Quick Match offerings and lifecycle",
      to: ROUTES.TOURNAMENT_MANAGER,
      icon: FaTrophy,
      match: [ROUTES.TOURNAMENT_MANAGER],
      tabs: [
        { id: "overview", label: "Overview" },
        { id: "create", label: "Create" },
        { id: "ready", label: "Drafts & paused" },
        { id: "live", label: "Live tournaments" },
        { id: "history", label: "History" },
      ],
    },
    {
      label: "Game Manager dashboard",
      description: "Rooms, schedules and account verification",
      to: ROUTES.GAME_MANAGER,
      icon: FaGamepad,
      match: [ROUTES.GAME_MANAGER],
      tabs: [
        { id: "overview", label: "Overview" },
        { id: "rooms", label: "Rooms & schedules" },
        { id: "events", label: "Events" },
        { id: "attention", label: "Attention" },
        { id: "operators", label: "Operators" },
        { id: "verification", label: "Account verification" },
        { id: "history", label: "History" },
      ],
    },
    {
      label: "Discord workspace",
      description: "Connect and sync staff roles",
      to: ROUTES.DISCORD_OPERATIONS,
      icon: FaDiscord,
      match: [ROUTES.DISCORD_OPERATIONS],
    },
  ];
  const selectedWorkspace = destinations.find((item) =>
    item.match.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    ),
  );

  if (!selectedWorkspace) return [workspaceSwitcher];

  const workspaceDashboard = {
    ...selectedWorkspace,
    navigationKind: "dashboard",
  };
  const workspaceTabs = (selectedWorkspace.tabs || []).map((tab, index) => ({
    ...tab,
    description: `${selectedWorkspace.label}: ${tab.label}`,
    icon: FaLayerGroup,
    isDefaultTab: index === 0,
    match: selectedWorkspace.match,
    navigationKind: "tab",
    to: `${selectedWorkspace.to}?tab=${tab.id}`,
  }));

  return [workspaceSwitcher, workspaceDashboard, ...workspaceTabs];
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
