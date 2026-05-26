import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

test("root layout uses next/script for the theme bootstrap script", () => {
  const source = readFileSync(path.join(process.cwd(), "src/app/layout.tsx"), "utf8");

  assert.equal(source.includes('import Script from "next/script";'), true);
  assert.equal(source.includes('src="/theme-init.js"'), true);
  assert.equal(source.includes("<script"), false);
});

test("theme bootstrap defaults to dark when no stored preference exists", () => {
  const source = readFileSync(path.join(process.cwd(), "public/theme-init.js"), "utf8");

  assert.equal(source.includes('var isDark = storedTheme ? storedTheme === "dark" : true;'), true);
});
