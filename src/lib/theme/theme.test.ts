import assert from "node:assert/strict";
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
