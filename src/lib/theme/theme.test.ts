import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import { DEFAULT_THEME, parseTheme } from "./theme";

test("parseTheme returns the stored light theme", () => {
  assert.equal(parseTheme("light"), "light");
});

test("parseTheme returns the stored dark theme", () => {
  assert.equal(parseTheme("dark"), "dark");
});

test("parseTheme falls back to the default theme for unknown values", () => {
  assert.equal(parseTheme("system"), DEFAULT_THEME);
  assert.equal(parseTheme(undefined), DEFAULT_THEME);
});

test("weather accents and browser surfaces use semantic theme tokens", () => {
  const styles = readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");
  const summary = readFileSync(
    path.join(process.cwd(), "src/features/weather/components/summary/ClimateSummaryBar.tsx"),
    "utf8"
  );

  assert.equal(styles.includes("--heat-summary:"), true);
  assert.equal(styles.includes("--cold-summary:"), true);
  assert.equal(styles.includes("scrollbar-color: var(--scrollbar-thumb) transparent;"), true);
  assert.equal(styles.includes("border-radius: var(--radius-full);"), true);
  assert.equal(summary.includes("text-heat-summary"), true);
  assert.equal(summary.includes("text-cold-summary"), true);
  assert.equal(summary.includes("text-orange-"), false);
  assert.equal(summary.includes("text-sky-"), false);
});

test("the Apple icon uses the same vector weather mark as the installable icon", () => {
  const source = readFileSync(path.join(process.cwd(), "src/app/apple-icon.tsx"), "utf8");

  assert.equal(source.includes("APP_ICON_BACKGROUND"), true);
  assert.equal(source.includes("<svg"), true);
  assert.equal(source.includes("☀"), false);
});
