// Matchmaking selectors keep component code independent from the slice shape.
export const selectQuickMatchJoinStatus = (state) =>
  state.matchmaking.joinStatus;

export const selectJoiningOfferingId = (state) =>
  state.matchmaking.joiningOfferingId;

export const selectQuickMatchJoinError = (state) =>
  state.matchmaking.joinError;
