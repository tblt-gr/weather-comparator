import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

test("locale provider persists the locale to a cookie", () => {
  const source = readFileSync(path.join(process.cwd(), "src/lib/i18n/LocaleProvider.tsx"), "utf8");

  assert.equal(source.includes("document.cookie ="), true);
  assert.equal(source.includes("LOCALE_COOKIE_NAME"), true);
});

test("locale provider synchronizes document language and metadata with the active locale", () => {
  const source = readFileSync(path.join(process.cwd(), "src/lib/i18n/LocaleProvider.tsx"), "utf8");

  assert.equal(source.includes('document.documentElement.lang = locale'), true);
  assert.equal(source.includes('document.title = t["app.title"]'), true);
  assert.equal(source.includes('meta[name="description"]'), true);
});
