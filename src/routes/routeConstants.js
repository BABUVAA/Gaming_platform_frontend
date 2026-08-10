// Route constants live in one file so path changes stay centralized.
// If new sections are added later, define their public path here first before
// wiring them into guards, navigation, or route trees.
export const ROUTES = {
  HOME: "/home",
  LOGIN: "/login",
  SIGNUP: "/signup",
  FORGOT_PASSWORD: "/forgotPWD",
  RESET_PASSWORD: "/reset-password",
  DASHBOARD: "/dashboard",
  ADMIN_PANEL: "/panelAdmin",
  STAFF: "/staff",
  STAFF_ACCESS_CONTROL: "/staff/access-control",
  EVENT_MANAGER: "/staff/events",
  GAME_MANAGER: "/staff/games",
  OPERATIONS: "/staff/operations",
  OPERATIONS_LEGACY: "/dashboard/operations",
  GAME: "/dashboard/game",
  TOURNAMENT: "/dashboard/tournament",
  MATCHES: "/dashboard/matches",
  CHATS: "/dashboard/chats",
  CLAN: "/dashboard/clan",
  PROFILE: "/dashboard/profile",
  GAME_ACCOUNTS: "/dashboard/game-accounts",
  ACCOUNT_SETTINGS: "/dashboard/account-settings",
  CHANGE_PASSWORD: "/dashboard/change-password",
  ACCOUNT_LEGACY: "/dashboard/account",
  WALLET: "/dashboard/wallet",
  REFER: "/dashboard/refer",
  COC: "/coc",
  LOGOUT: "/logout",
  TOURNAMENT_DETAILS: "/tournamentDetails/:id",
  TOURNAMENT_DETAILS_LEGACY: "/tournamentDeatils/:id",
  TOURNAMENT_OFFERING_DETAILS: "/dashboard/tournaments/offering/:id",
};

// Child route segments are kept beside public URLs so dashboard children can
// stay aligned with their full-page links without repeating string literals.
export const DASHBOARD_ROUTE_SEGMENTS = {
  GAME: "game",
  TOURNAMENT: "tournament",
  MATCHES: "matches",
  MATCH_ROOM: "matches/:id",
  TOURNAMENT_GAME: "tournament/:game",
  TOURNAMENT_OFFERING_DETAILS: "tournaments/offering/:id",
  CHATS: "chats",
  CLAN: "clan",
  PROFILE: "profile",
  GAME_ACCOUNTS: "game-accounts",
  ACCOUNT_SETTINGS: "account-settings",
  CHANGE_PASSWORD: "change-password",
  ACCOUNT_LEGACY: "account",
  WALLET: "wallet",
  OPERATIONS: "operations",
  REFER: "refer",
};

export const buildTournamentOfferingPath = (offeringId) =>
  `/dashboard/tournaments/offering/${offeringId}`;


export default ROUTES;
