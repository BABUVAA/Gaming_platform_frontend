import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  appendUniqueMessage,
  dedupeMessages,
  isMessageForThread,
  mergeMessageLists,
  removeActiveChatByUserId,
  removeMessageThread,
  resolveMessageThreadId,
} from "../src/utils/chatMessages.js";

test("Clan chat uses canonical current membership for every clan role", async () => {
  const chats = await readFile(
    new URL("../src/pages/Chats.jsx", import.meta.url),
    "utf8",
  );

  assert.match(chats, /dispatch\(fetchUserClan\(\)\)/);
  assert.match(chats, /const clanChat = userClanData\?\.data \|\| null/);
  assert.doesNotMatch(chats, /const clanChat = profile\?\.clan/);
  assert.match(chats, /\["LEADER", "COLEADER"\]\.includes/);
  assert.doesNotMatch(chats, /ELDER/);
});

test("global chat supports bounded public messaging and explicit recruitment actions", async () => {
  const [chats, globalChat, slice, socketContext] = await Promise.all([
    readFile(new URL("../src/pages/Chats.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/common/GlobalChatBox.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/store/slices/globalChatSlice.js", import.meta.url), "utf8"),
    readFile(new URL("../src/context/socketContext.jsx", import.meta.url), "utf8"),
  ]);

  assert.match(chats, /Global Chat/);
  assert.match(chats, /invitePlayerToClan\(\{ playerTag \}\)/);
  assert.match(globalChat, /onViewProfile\(entry\.playerTag\)/);
  assert.match(globalChat, /Invite to clan/);
  assert.match(globalChat, /maxLength=\{500\}/);
  assert.match(globalChat, /timeout\(10000\)\.emit/);
  assert.match(globalChat, /Never share passwords, OTPs, or payment details/);
  assert.match(slice, /slice\(-200\)/);
  assert.match(socketContext, /socket\.on\("global_message", handleGlobalMessage\)/);
});

test("personal chat rows show server-backed unread message counts", async () => {
  const [chats, chatBox, slice, socketContext] = await Promise.all([
    readFile(new URL("../src/pages/Chats.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/common/ChatBox.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/store/slices/globalChatSlice.js", import.meta.url), "utf8"),
    readFile(new URL("../src/context/socketContext.jsx", import.meta.url), "utf8"),
  ]);

  assert.match(slice, /path: "\/api\/users\/chats"/);
  assert.match(slice, /receivePersonalMessage/);
  assert.match(chats, /new messages/);
  assert.match(chats, /chat\.unreadCount > 99 \? "99\+"/);
  assert.match(chatBox, /clearPersonalUnread\(chatId\)/);
  assert.match(slice, /activePersonalThreadId/);
  assert.match(socketContext, /socket\.emit\("personal_mark_read"/);
});

test("notifications reconcile missed alerts and use the server unread total", async () => {
  const [slice, socketContext, dashboard, headerMenu, header, burgerMenu] = await Promise.all([
    readFile(new URL("../src/store/slices/notificationSlice.js", import.meta.url), "utf8"),
    readFile(new URL("../src/context/socketContext.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/Dashboard.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/layout/Header/HeaderNotificationMenu.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/layout/Header/Header.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/layout/Header/HeaderBurgerMenu.jsx", import.meta.url), "utf8"),
  ]);

  assert.match(slice, /unreadCount: Number\(data\.unreadCount\)/);
  assert.match(slice, /\/api\/notifications\/read-all/);
  assert.match(slice, /applyReadState/);
  assert.match(slice, /localRevision === state\.localRevision/);
  assert.match(socketContext, /NOTIFICATION_READ_STATE_UPDATED/);
  assert.match(socketContext, /dispatch\(fetchNotifications\(\)\)/);
  assert.match(dashboard, /visibilitychange/);
  assert.match(headerMenu, /Mark all read/);
  assert.match(headerMenu, /99\+/);
  assert.match(headerMenu, /fixed left-2 right-2/);
  assert.match(header, /<HeaderNotificationMenu \/>/);
  assert.match(burgerMenu, /store\.notifications\.unreadCount/);
});

test("Friends, Clan roster, and direct chats expose resilient player profiles", async () => {
  const [friends, clan, chats, fallback, clanCss] = await Promise.all([
    readFile(new URL("../src/pages/Friends.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/Clan.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/Chats.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/utils/imageFallbacks.js", import.meta.url), "utf8"),
    readFile(new URL("../src/styles/index.css", import.meta.url), "utf8"),
  ]);

  assert.match(clan, /onViewProfile\(member\.clanMemberTag\)/);
  assert.match(friends, /applyAvatarFallback/);
  assert.match(friends, /ROUTES\.PROFILE/);
  assert.match(friends, /flex flex-col gap-2 sm:flex-row/);
  assert.match(friends, /className="h-10 w-full rounded-lg/);
  assert.match(friends, /className="h-10 w-10 shrink-0 rounded-lg/);
  assert.match(friends, /aria-label="Friend lists"/);
  assert.match(friends, /role="tablist"/);
  assert.match(friends, /\["friends", "Friends"/);
  assert.match(friends, /\["sent", "Sent requests"/);
  assert.match(friends, /role="tabpanel"/);
  assert.doesNotMatch(friends, /clan-surface|rounded-\[24px\]|h-20 w-20|text-2xl/);
  assert.doesNotMatch(clan, /default-avatar\.png/);
  assert.match(chats, /onViewProfile\(chat\.playerTag/);
  assert.match(chats, /applyAvatarFallback/);
  assert.match(fallback, /\/profile-pic\.png/);

  const clanProfileStyle = clanCss.match(
    /\.clan-profile-card::before\s*\{[\s\S]*?\n\}/,
  )?.[0] || "";
  assert.doesNotMatch(clanProfileStyle, /pubg/i);
  assert.match(clanProfileStyle, /radial-gradient/);
});

test("simple socket chat waits for delivery acknowledgement", async () => {
  const chatBox = await readFile(
    new URL("../src/components/common/ChatBox.jsx", import.meta.url),
    "utf8",
  );

  assert.match(chatBox, /timeout\(10000\)\.emit/);
  assert.match(chatBox, /response\?\.success !== true/);
  assert.match(chatBox, /maxLength=\{500\}/);
  assert.doesNotMatch(chatBox, /read receipt|delete message/i);
});

test("personal realtime messages use the other player's ID as the UI thread", () => {
  const message = {
    chatId: "player-a-player-b",
    senderId: "player-a",
    receiverId: "player-b",
    message: "hello",
  };

  assert.equal(resolveMessageThreadId(message, "player-a"), "player-b");
  assert.equal(resolveMessageThreadId(message, "player-b"), "player-a");
  assert.equal(
    resolveMessageThreadId({ clanId: "clan-1", message: "hello" }, "player-a"),
    "clan-1",
  );
});

test("an open chat accepts only messages owned by that thread", () => {
  const forOpenFriend = {
    senderId: "player-b",
    receiverId: "player-a",
    message: "correct thread",
  };
  const forAnotherFriend = {
    senderId: "player-c",
    receiverId: "player-a",
    message: "different thread",
  };

  assert.equal(
    isMessageForThread(forOpenFriend, "player-a", "player-b"),
    true,
  );
  assert.equal(
    isMessageForThread(forAnotherFriend, "player-a", "player-b"),
    false,
  );
  assert.equal(
    isMessageForThread({ clanId: "clan-1" }, "player-a", "clan-1"),
    true,
  );
});

test("chat layout stays viewport-bounded and keeps Back through tablet sizes", async () => {
  const [chats, chatBox] = await Promise.all([
    readFile(new URL("../src/pages/Chats.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/common/ChatBox.jsx", import.meta.url), "utf8"),
  ]);

  assert.match(chats, /h-\[calc\(100dvh-10rem\)\]/);
  assert.match(chats, /max-h-\[46rem\]/);
  assert.match(chats, /min-h-0 flex-1 space-y-2 overflow-y-auto/);
  assert.match(chatBox, /aria-label="Back to chats"/);
  assert.match(chatBox, /lg:hidden/);
  assert.doesNotMatch(chats, /Open threads|Direct chats|Clan room/);
  assert.doesNotMatch(chats, /<h1[^>]*>Chats<\/h1>/);
});

test("chat room joins wait for authenticated socket readiness", async () => {
  const [chatBox, socketContext] = await Promise.all([
    readFile(new URL("../src/components/common/ChatBox.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/context/socketContext.jsx", import.meta.url), "utf8"),
  ]);

  assert.match(socketContext, /socket\.on\("session:ready", onSessionReady\)/);
  assert.match(chatBox, /!isConnected \|\| !chatId/);
  assert.match(chatBox, /socket\?\.socket, isConnected/);
});

test("unfriending removes the direct thread from sidebar and live cache", () => {
  assert.deepEqual(
    removeActiveChatByUserId(
      [{ userId: "player-a" }, { userId: "player-b" }],
      "player-a",
    ),
    [{ userId: "player-b" }],
  );
  assert.deepEqual(
    removeMessageThread({ "player-a": [{ message: "gone" }], clan: [] }, "player-a"),
    { clan: [] },
  );
});

test("realtime and acknowledgement copies render as one message", () => {
  const delivered = {
    senderId: "player-a",
    receiverId: "player-b",
    message: "one visible message",
    timestamp: "2026-08-26T10:00:00.000Z",
  };

  assert.equal(dedupeMessages([delivered, { ...delivered }]).length, 1);
  assert.equal(appendUniqueMessage([delivered], { ...delivered }).length, 1);
});

test("a live message merges with loaded history instead of replacing it", () => {
  const history = [
    {
      _id: "message-1",
      senderId: "player-a",
      message: "older message",
      createdAt: "2026-08-26T09:59:00.000Z",
    },
  ];
  const liveMessage = {
    _id: "message-2",
    senderId: "player-b",
    receiverId: "player-a",
    message: "new message",
    timestamp: "2026-08-26T10:00:00.000Z",
  };

  const merged = mergeMessageLists(history, [liveMessage]);

  assert.deepEqual(
    merged.map((message) => message._id),
    ["message-1", "message-2"],
  );
});
