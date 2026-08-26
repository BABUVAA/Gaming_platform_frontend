import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("staff Discord workspace uses compact Redux-owned connection controls", () => {
  const page = read("src/pages/DiscordOperations.jsx");
  const slice = read("src/store/slices/discordOperationsSlice.js");
  const routes = read("src/routes/staffRoutes.jsx");
  assert.match(slice, /path: "\/api\/discord\/status"/);
  assert.match(slice, /path: "\/api\/discord\/connect"/);
  assert.match(slice, /path: "\/api\/discord\/sync"/);
  assert.match(page, /Connect Discord/);
  assert.match(page, /Open Discord/);
  assert.doesNotMatch(page, /textarea|New update|Publish/);
  assert.doesNotMatch(page, /axios|DISCORD_BOT_TOKEN|channelId/);
  assert.match(routes, /componentKey: "DiscordOperations", access: "staff"/);
});
