const normalizeId = (value) => String(value || "").trim();

export const getMessageSignature = (message = {}, fallbackIndex = 0) => {
  const messageId = normalizeId(message._id);
  if (messageId) return messageId;

  const senderId = normalizeId(message.senderId) || "unknown";
  const targetId = normalizeId(
    message.receiverId || message.clanId || message.chatId,
  ) || "thread";
  const body = String(message.message || "");
  const occurredAt = String(message.timestamp || message.createdAt || "");

  // Valid server messages always contain body and time. Their list position
  // must not be part of identity because realtime and acknowledgement paths
  // can deliver the same message at different positions.
  if (body || occurredAt) {
    return [senderId, targetId, body, occurredAt].join("::");
  }
  return `unknown::${fallbackIndex}`;
};

export const dedupeMessages = (messageList = []) => {
  const seenSignatures = new Set();
  return messageList.filter((entry, index) => {
    const signature = getMessageSignature(entry, index);
    if (seenSignatures.has(signature)) return false;
    seenSignatures.add(signature);
    return true;
  });
};

export const appendUniqueMessage = (messageList = [], newMessage) =>
  dedupeMessages([...messageList, newMessage]);

export const mergeMessageLists = (...messageLists) =>
  dedupeMessages(messageLists.flat());

export const resolveMessageThreadId = (message = {}, currentUserId) => {
  const senderId = normalizeId(message.senderId);
  const receiverId = normalizeId(message.receiverId);
  const viewerId = normalizeId(currentUserId);

  // Personal conversations are indexed in the UI by the other player's ID.
  // The backend chatId is a composite room key and must not replace that key.
  if (senderId && receiverId && viewerId) {
    return senderId === viewerId ? receiverId : senderId;
  }

  return normalizeId(
    message.clanId || message.chatId || receiverId || senderId,
  ) || null;
};

export const isMessageForThread = (message, currentUserId, threadId) =>
  normalizeId(resolveMessageThreadId(message, currentUserId)) ===
  normalizeId(threadId);

export const removeActiveChatByUserId = (activeChats = [], userId) => {
  const removedUserId = normalizeId(userId);
  return activeChats.filter((chat) =>
    ![chat?.userId, chat?._id, chat?.id]
      .map(normalizeId)
      .includes(removedUserId)
  );
};

export const removeMessageThread = (messages = {}, threadId) => {
  const next = { ...messages };
  delete next[normalizeId(threadId)];
  return next;
};
