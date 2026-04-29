import {
  FaGamepad,
  FaLayerGroup,
  FaMapMarkedAlt,
  FaShieldAlt,
  FaTrophy,
  FaWallet,
} from "react-icons/fa";
import { MdOutlineCastle } from "react-icons/md";

export const dashboardNavigation = [
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

export const getNavigationTitle = (pathname) => {
  const found = dashboardNavigation.find((item) =>
    item.match.some((prefix) => pathname.startsWith(prefix))
  );

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
