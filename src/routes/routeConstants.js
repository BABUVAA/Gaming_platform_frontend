// Route constants live in one file so path changes stay centralized.
// If new sections are added later, define their public path here first before
// wiring them into guards, navigation, or route trees.
export const ROUTES = {
  HOME: "/home",
  LOGIN: "/login",
  SIGNUP: "/signup",
  FORGOT_PASSWORD: "/forgotPWD",
  RESET_PASSWORD: "/reset-password",
  REFERRAL_LANDING: "/ref/:referralCode",
  DASHBOARD: "/dashboard",
  ADMIN_PANEL: "/panelAdmin",
  STAFF: "/staff",
  STAFF_ACCESS_CONTROL: "/staff/access-control",
  EVENT_MANAGER: "/staff/events",
  TOURNAMENT_MANAGER: "/staff/tournaments",
  GAME_MANAGER: "/staff/games",
  OPERATIONS: "/staff/operations",
  DISCORD_OPERATIONS: "/staff/discord",
  OPERATIONS_LEGACY: "/dashboard/operations",
  GAME: "/dashboard/game",
  TOURNAMENT: "/dashboard/tournament",
  EVENTS: "/dashboard/events",
  EVENT_DETAILS: "/dashboard/events/:runId",
  MATCHES: "/dashboard/matches",
  CHATS: "/dashboard/chats",
  CLAN: "/dashboard/clan",
  FRIENDS: "/dashboard/friends",
  TEAMS: "/dashboard/teams",
  PROFILE: "/dashboard/profile",
  GAME_ACCOUNTS: "/dashboard/game-accounts",
  ACCOUNT_SETTINGS: "/dashboard/account-settings",
  CHANGE_PASSWORD: "/dashboard/change-password",
  ACCOUNT_LEGACY: "/dashboard/account",
  WALLET: "/dashboard/wallet",
  REFER: "/dashboard/refer",
  LOGOUT: "/logout",
  TOURNAMENT_OFFERING_DETAILS: "/dashboard/tournaments/offering/:id",
  HOST_TOURNAMENT_PROPOSAL: "/dashboard/host/tournament-proposal",
};

export const STAFF_ROUTE_SEGMENTS = Object.freeze({
  ACCESS_CONTROL: "access-control",
  EVENTS: "events",
  GAMES: "games",
  OPERATIONS: "operations",
  TOURNAMENTS: "tournaments",
  DISCORD: "discord",
});

// Child route segments are kept beside public URLs so dashboard children can
// stay aligned with their full-page links without repeating string literals.
export const DASHBOARD_ROUTE_SEGMENTS = {
  GAME: "game",
  TOURNAMENT: "tournament",
  EVENTS: "events",
  EVENT_DETAILS: "events/:runId",
  MATCHES: "matches",
  MATCH_ROOM: "matches/:id",
  TOURNAMENT_GAME: "tournament/:game",
  TOURNAMENT_OFFERING_DETAILS: "tournaments/offering/:id",
  HOST_TOURNAMENT_PROPOSAL: "host/tournament-proposal",
  CHATS: "chats",
  CLAN: "clan",
  FRIENDS: "friends",
  TEAMS: "teams",
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
