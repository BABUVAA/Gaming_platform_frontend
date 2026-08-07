const DEFAULT_CONNECTION = {
  instructions: "",
  integrationKey: "none",
  method: "manual_review",
  supportsStatsSync: false,
};

// A fresh object is returned for every form so nested edits never leak between
// a completed creation flow and the next game an administrator opens.
export const createEmptyGameForm = () => ({
  accountConnection: { ...DEFAULT_CONNECTION },
  link: "",
  name: "",
  supportedMaps: [],
  supportedModes: [],
});

// Legacy fields remain readable during migration, but every edit is converted
// into the canonical nested catalog shape before it reaches the API.
export const createGameFormFromRecord = (game) => ({
  accountConnection: {
    instructions:
      game.accountConnection?.instructions ||
      game.verificationInstructions ||
      "",
    integrationKey:
      game.accountConnection?.integrationKey ||
      (game.link === "coc" ? "supercell_coc" : "none"),
    method:
      game.accountConnection?.method ||
      game.verificationMethod ||
      "manual_review",
    supportsStatsSync:
      game.accountConnection?.supportsStatsSync === true ||
      game.supportsStatsSync === true,
  },
  link: game.link,
  name: game.name,
  supportedMaps: [...(game.supportedMaps || [])],
  supportedModes: [...(game.supportedModes || [])],
});
