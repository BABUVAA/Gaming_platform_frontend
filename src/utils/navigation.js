import {
  FaCrown,
  FaGamepad,
  FaLayerGroup,
  FaMapMarkedAlt,
  FaSatelliteDish,
  FaShieldAlt,
  FaTrophy,
  FaWallet,
} from "react-icons/fa";
import { MdOutlineCastle } from "react-icons/md";

const adminNavigation = [
  {
    label: "Admin",
    description: "Platform operations",
    to: "/panelAdmin",
    icon: FaCrown,
    match: ["/panelAdmin"],
  },
];

const operatorNavigation = [
  {
    label: "Operations",
    description: "Lobby ops and dispute flow",
    to: "/dashboard/operations",
    icon: FaSatelliteDish,
    match: ["/dashboard/operations"],
  },
];

const playerNavigation = [
  {
    label: "Compete",
    description: "Overview and readiness",
    to: "/dashboard",
    icon: FaGamepad,
    match: ["/dashboard"],
  },
  {
    label: "Tournaments",
    description: "Join active formats",
    to: "/dashboard/tournament",
    icon: FaTrophy,
    match: ["/dashboard/tournament", "/tournamentDetails"],
  },
  {
    label: "Clans",
    description: "Manage your roster",
    to: "/dashboard/clan",
    icon: MdOutlineCastle,
    match: ["/dashboard/clan"],
  },
  {
    label: "Matches",
    description: "Rooms, check-in, and results",
    to: "/dashboard/matches",
    icon: FaMapMarkedAlt,
    match: ["/dashboard/matches"],
  },
  {
    label: "Chats",
    description: "Messages and social coordination",
    to: "/dashboard/chats",
    icon: FaLayerGroup,
    match: ["/dashboard/chats"],
  },
  {
    label: "Wallet",
    description: "Balance and settlements",
    to: "/dashboard/wallet",
    icon: FaWallet,
    match: ["/dashboard/wallet"],
  },
  {
    label: "Account",
    description: "Verification and links",
    to: "/dashboard/account",
    icon: FaShieldAlt,
    match: ["/dashboard/account", "/dashboard/profile"],
  },
];

const allNavigation = [
  ...adminNavigation,
  ...operatorNavigation,
  ...playerNavigation,
];

export const getDefaultRouteForRole = (role) => {
  if (role === "admin") return "/panelAdmin";
  if (role === "operator") return "/dashboard/operations";
  return "/dashboard";
};

export const getDashboardNavigation = (role) => {
  if (role === "admin") return adminNavigation;
  if (role === "operator") return operatorNavigation;
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
      description: "Competition control room",
    };
  }

  return {
    label: found.label,
    description: found.description,
  };
};
