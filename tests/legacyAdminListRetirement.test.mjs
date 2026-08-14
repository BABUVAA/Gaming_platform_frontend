import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("retired unbounded admin list clients are not exported or kept in Redux", async () => {
  const [adminSlice, componentIndex] = await Promise.all([
    readFile(new URL("../src/store/slices/adminSlice.js", import.meta.url), "utf8"),
    readFile(new URL("../src/components/index.js", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(adminSlice, /findUsers|findTransactions|\/api\/admin\/findUsers|\/api\/admin\/findTransactions/);
  assert.doesNotMatch(componentIndex, /UserManagement|WalletManagement/);
  await assert.rejects(access(new URL("../src/components/adminComponents/userMangaement/UserManagement.jsx", import.meta.url)));
  await assert.rejects(access(new URL("../src/components/adminComponents/walletManagement/WalletManagement.jsx", import.meta.url)));
});
