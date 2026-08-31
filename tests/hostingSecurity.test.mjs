import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vercelConfig = JSON.parse(
  readFileSync(path.join(root, "vercel.json"), "utf8"),
);

test("Vercel serves the SPA with baseline browser security headers", () => {
  const catchAllHeaders = vercelConfig.headers?.find(
    ({ source }) => source === "/(.*)",
  )?.headers;
  assert.ok(catchAllHeaders, "catch-all security headers must be configured");

  const headers = Object.fromEntries(
    catchAllHeaders.map(({ key, value }) => [key.toLowerCase(), value]),
  );
  assert.match(headers["content-security-policy"], /base-uri 'self'/);
  assert.match(headers["content-security-policy"], /object-src 'none'/);
  assert.match(headers["content-security-policy"], /frame-ancestors 'none'/);
  assert.equal(headers["x-frame-options"], "DENY");
  assert.equal(headers["x-content-type-options"], "nosniff");
  assert.equal(headers["referrer-policy"], "strict-origin-when-cross-origin");
  assert.equal(
    headers["permissions-policy"],
    "camera=(), microphone=(), geolocation=()",
  );

  assert.deepEqual(vercelConfig.rewrites, [
    { source: "/(.*)", destination: "/index.html" },
  ]);
});
