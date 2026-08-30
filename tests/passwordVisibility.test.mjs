import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("Login exposes an accessible password visibility toggle", async () => {
  const source = await read("../src/pages/Login.jsx");

  assert.match(source, /type=\{showPassword \? "text" : "password"\}/);
  assert.match(source, /showPassword \? "Hide password" : "Show password"/);
  assert.match(source, /setShowPassword\(\(current\) => !current\)/);
});

test("Signup toggles password and confirmation visibility independently", async () => {
  const source = await read("../src/pages/SignUp.jsx");

  assert.match(source, /type=\{showPassword \? "text" : "password"\}/);
  assert.match(source, /type=\{showConfirmPassword \? "text" : "password"\}/);
  assert.match(source, /setShowPassword\(\(current\) => !current\)/);
  assert.match(source, /setShowConfirmPassword\(\(current\) => !current\)/);
});

test("Input renders the eye action as a non-submitting labelled button", async () => {
  const source = await read("../src/components/ui/Input/Input.jsx");

  assert.match(source, /type="button"/);
  assert.match(source, /aria-label=\{iconEndLabel\}/);
  assert.match(source, /onClick=\{onIconEndClick\}/);
});
