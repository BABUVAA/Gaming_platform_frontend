import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const projectFile = (path) => new URL(`../${path}`, import.meta.url);

test("landing hero uses optimized original gameplay video with a reduced-motion fallback", async () => {
  const source = await readFile(projectFile("src/pages/Home.jsx"), "utf8");

  assert.match(source, /landing-gameplay\.webm/);
  assert.match(source, /landing-gameplay\.mp4/);
  assert.match(source, /landing-gameplay-poster\.webp/);
  assert.match(source, /motion-reduce:hidden/);
  assert.match(source, /preload="metadata"/);
  assert.doesNotMatch(source, /Battlefield\.mp4/);

  await Promise.all([
    access(projectFile("public/landing-gameplay.webm")),
    access(projectFile("public/landing-gameplay.mp4")),
    access(projectFile("public/landing-gameplay-poster.webp")),
  ]);
});
