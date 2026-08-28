export const REALTIME_CHANNEL = "realtime:event";

export const REALTIME_EVENT_TYPES = Object.freeze({
  CHAT_PERSONAL_MESSAGE_CREATED: "chat.personal_message.created",
  MATCH_CHAT_MESSAGE_CREATED: "match.chat_message.created",
  CLAN_JOIN_REQUESTS_UPDATED: "clan.join_requests.updated",
  CLAN_JOIN_REQUEST_STATUS_UPDATED:
    "clan.join_request_status.updated",
  TEAM_UPDATED: "player.team.updated",
  CLAN_UPDATED: "clan.updated",
  LEADERBOARD_UPDATED: "leaderboard.updated",
  MATCH_ASSIGNMENT_UPDATED: "match.assignment.updated",
  MATCH_UPDATED: "match.updated",
  MATCHMAKING_QUEUE_UPDATED: "matchmaking.queue.updated",
  NOTIFICATION_CREATED: "notification.created",
  SOCIAL_CONNECTIONS_UPDATED: "social.connections.updated",
  TOURNAMENT_UPDATED: "tournament.updated",
});

const supportedEventTypes = new Set(
  Object.values(REALTIME_EVENT_TYPES),
);

// Browser validation prevents malformed or future incompatible events from
// reaching Redux reducers. Unknown versions are recovered through HTTP sync.
export const isSupportedRealtimeEvent = (event) =>
  Boolean(
    event &&
      typeof event.eventId === "string" &&
      !Number.isNaN(Date.parse(event.occurredAt)) &&
      typeof event.resourceId === "string" &&
      Number.isInteger(event.resourceVersion) &&
      event.resourceVersion >= 0 &&
      supportedEventTypes.has(event.type) &&
      event.version === 1 &&
      event.data &&
      typeof event.data === "object" &&
      !Array.isArray(event.data),
  );
