import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (relativePath) =>
  readFileSync(new URL(relativePath, import.meta.url), "utf8");

test("a late anonymous session check cannot clear a newer successful login", () => {
  const authSource = read("../src/store/slices/authSlice.js");
  const lifecycleSource = read(
    "../src/store/middleware/sessionLifecycleMiddleware.js",
  );

  assert.match(
    authSource,
    /sessionVerificationRequestId = action\.meta\.requestId/,
  );
  assert.match(
    authSource,
    /sessionVerificationRequestId !== action\.meta\.requestId\) return/,
  );
  assert.match(
    authSource,
    /credential attempt supersedes[\s\S]*sessionVerificationRequestId = null/,
  );
  assert.match(
    lifecycleSource,
    /sessionVerificationRequestId ===[\s\S]*action\.meta\.requestId/,
  );
});
