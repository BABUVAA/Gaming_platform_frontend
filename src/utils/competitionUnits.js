const identifier = (value) => String(value?._id || value || "");

const getCompetitionTeamSize = (match) =>
  Number(
    match?.eventBatch?.stage?.teamSize ||
      match?.eventBatch?.teamSize ||
      match?.quickMatchOffering?.teamSize ||
      1,
  );

export const usesTeamRanking = (match) =>
  getCompetitionTeamSize(match) > 1;

export const usesRankingKeys = (match) =>
  Boolean(match?.quickMatchOffering) || usesTeamRanking(match);

export const getCompetitionRankingGroups = (match) => {
  const teamRanking = usesTeamRanking(match);
  const groups = new Map();

  (match?.participants || []).forEach((participant, index) => {
    const playerId = identifier(participant?.user);
    const explicitKey = String(participant?.competitionUnitKey || "");
    // Event team identity is snapshotted by the server. Never derive it from
    // array order; the legacy Team reference is only a Quick Match fallback.
    const teamKey = explicitKey || (match?.quickMatchOffering ? identifier(participant?.team) : "");
    const key = teamRanking ? teamKey : playerId;
    if (!key) return;

    const current = groups.get(key) || {
      key,
      name:
        (teamRanking
          ? participant?.competitionUnitName ||
            participant?.team?.teamName ||
            participant?.team?.name ||
            `Team ${groups.size + 1}`
          : participant?.user?.profile?.username ||
            participant?.displayName ||
            `Player ${index + 1}`),
      participants: [],
    };
    current.participants.push({ ...participant, originalIndex: index });
    groups.set(key, current);
  });

  return [...groups.values()];
};

export const describeTeamRewardSplit = (amountMinor, teamSize) => {
  const total = Number(amountMinor) || 0;
  const size = Math.max(1, Number(teamSize) || 1);
  if (size === 1) return "";
  const base = Math.floor(total / size);
  const remainder = total % size;
  const format = (minor) => (minor / 100).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
  if (!remainder) return `${format(base)} each`;
  return `${remainder} at ${format(base + 1)}, ${size - remainder} at ${format(base)}`;
};
