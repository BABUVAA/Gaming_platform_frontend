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
import { ROUTES } from "../routes/routeConstants";
import { USER_ROLES } from "./accessControl";

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

const playerNavigation = [
  {
    label: "Compete",
    description: "Find your next challenge",
    to: ROUTES.DASHBOARD,
    icon: FaGamepad,
    match: [ROUTES.DASHBOARD],
  },
  {
    label: "Tournaments",
    description: "Browse and join events",
    to: ROUTES.TOURNAMENT,
    icon: FaTrophy,
    match: [
      ROUTES.TOURNAMENT,
      "/dashboard/tournaments",
      "/tournamentDetails",
    ],
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
    description: "Check in and play",
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
];

export const getDefaultRouteForRole = (role) => {
  // This helper is the single redirect source for role-based landings.
  // If a new role is introduced later, add its safe default destination here.
  if (role === USER_ROLES.ADMIN) return ROUTES.ADMIN_PANEL;
  if (role === USER_ROLES.OPERATOR) return ROUTES.OPERATIONS;
  return ROUTES.DASHBOARD;
};

export const getDashboardNavigation = (role) => {
  if (role === USER_ROLES.ADMIN) return adminNavigation;
  if (role === USER_ROLES.OPERATOR) return operatorNavigation;
  return playerNavigation;
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
