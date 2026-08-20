const identityId = (identity) =>
  String(
    identity?.userId ||
      identity?._id ||
      identity?.id ||
      (typeof identity === "string" ? identity : ""),
  );

export const canReviewEventProposal = ({ currentUser, item }) => {
  const actorId = identityId(currentUser);
  if (!actorId) return false;

  return (
    identityId(item?.createdBy) !== actorId &&
    identityId(item?.submittedBy) !== actorId
  );
};

