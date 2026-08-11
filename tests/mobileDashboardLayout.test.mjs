import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("dashboard content owns one bounded mobile grid column", async () => {
  const [app, dashboard] = await Promise.all([
    readFile(new URL("../src/pages/App.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/Dashboard.jsx", import.meta.url), "utf8"),
  ]);

  assert.match(dashboard, /grid-cols-\[minmax\(0,1fr\)\]/);
  assert.match(dashboard, /md:grid-cols-\[18rem_minmax\(0,1fr\)\]/);
  assert.match(dashboard, /min-w-0 w-full overflow-x-hidden/);
  assert.match(dashboard, /w-full max-w-full/);
  assert.match(app, /min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto/);
});
