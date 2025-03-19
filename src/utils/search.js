import Fuse from "fuse.js";

export const searchTournaments = (query, tournaments) => {
  if (!query) return tournaments;

  const fuse = new Fuse(tournaments, {
    keys: ["name", "game", "prizeAmount", "entryFee"],
    threshold: 0.3, // Lower = stricter matching
  });

  return fuse.search(query).map((result) => result.item);
};
