const balancedBatchSizes = (participantCount, roomSize) => {
  const batchCount = Math.ceil(participantCount / roomSize);
  const baseSize = Math.floor(participantCount / batchCount);
  const largerBatches = participantCount % batchCount;
  if (participantCount < 2 || baseSize < 2) return [];
  return Array.from(
    { length: batchCount },
    (_, index) => baseSize + (index < largerBatches ? 1 : 0),
  );
};

export const projectRankedStages = (capacity, stages) => {
  let participantCount = Number(capacity);
  if (!Number.isSafeInteger(participantCount) || participantCount < 2) {
    return { error: "Registration capacity must be at least two players.", rows: [] };
  }
  if (!Array.isArray(stages) || stages.length === 0) {
    return { error: "Add at least one ranked stage.", rows: [] };
  }

  const rows = [];
  for (let index = 0; index < stages.length; index += 1) {
    const stage = stages[index];
    const roomSize = Number(stage.participantsPerMatch);
    const isFinal = index === stages.length - 1;
    const advanceCount = isFinal ? 0 : Number(stage.advanceCount);
    if (!Number.isInteger(roomSize) || roomSize < 2 || roomSize > 100) {
      return { error: `Round ${index + 1} room size must be between 2 and 100.`, rows };
    }
    if (!isFinal && (!Number.isInteger(advanceCount) || advanceCount < 1 || advanceCount >= roomSize)) {
      return { error: `Round ${index + 1} must advance fewer players than its room size.`, rows };
    }
    const sizes = balancedBatchSizes(participantCount, roomSize);
    if (!sizes.length) return { error: `Round ${index + 1} would create a one-player room.`, rows };
    if (isFinal && sizes.length !== 1) return { error: "The last round must fit inside one final room.", rows };
    const qualifiedCount = isFinal
      ? 0
      : sizes.reduce((total, size) => total + Math.min(advanceCount, size), 0);
    if (!isFinal && qualifiedCount >= participantCount) {
      return { error: `Round ${index + 1} must reduce the player list.`, rows };
    }
    rows.push({
      batchCount: sizes.length,
      maximumBatchSize: Math.max(...sizes),
      minimumBatchSize: Math.min(...sizes),
      participantCount,
      qualifiedCount,
    });
    if (!isFinal) participantCount = qualifiedCount;
  }
  return { error: "", rows };
};

export const buildDefaultRankedStages = (capacity) => {
  let remaining = Math.max(2, Number(capacity) || 2);
  const stages = [];
  while (remaining > 100 && stages.length < 31) {
    const roomSize = Math.min(100, remaining);
    const batchCount = Math.ceil(remaining / roomSize);
    const topN = Math.min(10, roomSize - 1);
    stages.push({
      advanceCount: String(topN),
      batchSpacingMinutes: "0",
      checkInMinutesBefore: "0",
      participantsPerMatch: String(roomSize),
      stageDelayMinutes: "0",
    });
    remaining = batchCount * topN;
  }
  stages.push({
    advanceCount: "0",
    batchSpacingMinutes: "0",
    checkInMinutesBefore: "0",
    participantsPerMatch: String(Math.min(100, remaining)),
    stageDelayMinutes: "0",
  });
  return stages;
};
