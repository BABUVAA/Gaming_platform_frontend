// This registry keeps game-specific artwork and labels outside page components.
// Adding a new game here makes its visual treatment available across the app.
const GAME_PRESENTATIONS = Object.freeze({
  bgmi: Object.freeze({
    key: "bgmi",
    label: "BGMI",
    description: "Battle royale",
    image: "/bgmi-tournament-v2.jpg",
  }),
  coc: Object.freeze({
    key: "coc",
    label: "Clash of Clans",
    description: "Clan strategy",
    image: "/coc-tournament-v2.jpg",
  }),
});

// Backend data can identify the same game by its short code or display name.
// Aliases convert those values into the single keys used by filters and artwork.
const GAME_KEY_ALIASES = Object.freeze({
  bgmi: "bgmi",
  pubg: "bgmi",
  "pubg mobile": "bgmi",
  "battlegrounds mobile india": "bgmi",
  coc: "coc",
  "clash of clans": "coc",
});

export const gameFilterOptions = Object.freeze([
  Object.freeze({
    key: "all",
    label: "All games",
    description: "Every tournament",
    images: Object.freeze([
      GAME_PRESENTATIONS.bgmi.image,
      GAME_PRESENTATIONS.coc.image,
    ]),
  }),
  ...Object.values(GAME_PRESENTATIONS),
]);

export const getGameKey = (game) => {
  // Normalizing user- or API-provided values prevents casing and whitespace
  // differences from breaking tournament filters.
  const normalizedGame = String(game || "")
    .trim()
    .toLowerCase();

  return GAME_KEY_ALIASES[normalizedGame] || normalizedGame;
};

export const getGamePresentation = (game) => {
  const gameKey = getGameKey(game);

  // Unknown games temporarily use the battle-arena artwork so cards never
  // render with a broken image while their dedicated art is being prepared.
  return (
    GAME_PRESENTATIONS[gameKey] || {
      key: gameKey || "game",
      label: game || "Game",
      image: GAME_PRESENTATIONS.bgmi.image,
    }
  );
};
