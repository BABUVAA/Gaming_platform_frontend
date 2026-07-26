// Route constants live in one file so path changes stay centralized.
// If new sections are added later, define their public path here first before
// wiring them into guards, navigation, or route trees.
export const ROUTES = {
  HOME: "/home",
  LOGIN: "/login",
  SIGNUP: "/signup",
  FORGOT_PASSWORD: "/forgotPWD",
  DASHBOARD: "/dashboard",
  ADMIN_PANEL: "/panelAdmin",
  OPERATIONS: "/dashboard/operations",
  GAME: "/dashboard/game",
  TOURNAMENT: "/dashboard/tournament",
  MATCHES: "/dashboard/matches",
  CHATS: "/dashboard/chats",
  CLAN: "/dashboard/clan",
  PROFILE: "/dashboard/profile",
  ACCOUNT: "/dashboard/account",
  WALLET: "/dashboard/wallet",
  REFER: "/dashboard/refer",
  COC: "/coc",
  LOGOUT: "/logout",
  TOURNAMENT_DETAILS: "/tournamentDetails/:id",
  TOURNAMENT_DETAILS_LEGACY: "/tournamentDeatils/:id",
};

// Child route segments are kept beside public URLs so dashboard children can
// stay aligned with their full-page links without repeating string literals.
export const DASHBOARD_ROUTE_SEGMENTS = {
  GAME: "game",
  TOURNAMENT: "tournament",
  MATCHES: "matches",
  MATCH_ROOM: "matches/:id",
  TOURNAMENT_GAME: "tournament/:game",
  CHATS: "chats",
  CLAN: "clan",
  PROFILE: "profile",
  ACCOUNT: "account",
  WALLET: "wallet",
  OPERATIONS: "operations",
  REFER: "refer",
};

export default ROUTES;
