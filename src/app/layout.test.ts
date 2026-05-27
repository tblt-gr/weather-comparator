import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

test("root layout uses next/script for the theme bootstrap script", () => {
  const source = readFileSync(path.join(process.cwd(), "src/app/layout.tsx"), "utf8");

  assert.equal(source.includes('import { cookies } from "next/headers";'), true);
  assert.equal(source.includes('src="/theme-init.js"'), false);
  assert.equal(source.includes("await cookies()"), true);
});

test("root layout reads the theme cookie and passes the resolved theme to Providers", () => {
  const source = readFileSync(path.join(process.cwd(), "src/app/layout.tsx"), "utf8");

  assert.equal(source.includes("parseTheme(cookieStore.get(THEME_COOKIE_NAME)?.value)"), true);
  assert.equal(source.includes("<Providers initialTheme={theme}>"), true);
});
