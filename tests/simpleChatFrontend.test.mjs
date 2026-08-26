import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
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
  assert.doesNotMatch(chats, /LEADER|COLEADER|ELDER/);
});

test("simple socket chat waits for delivery acknowledgement", async () => {
  const chatBox = await readFile(
    new URL("../src/components/common/ChatBox.jsx", import.meta.url),
    "utf8",
  );

  assert.match(chatBox, /timeout\(10000\)\.emit/);
  assert.match(chatBox, /response\?\.success !== true/);
  assert.match(chatBox, /maxLength=\{500\}/);
  assert.doesNotMatch(chatBox, /read receipt|unread|delete message/i);
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
