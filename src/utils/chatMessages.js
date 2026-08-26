const normalizeId = (value) => String(value || "").trim();

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
