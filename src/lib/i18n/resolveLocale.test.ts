import assert from "node:assert/strict";
import test from "node:test";

import { resolveLocale } from "./resolveLocale";

test("uses stored locale when valid", () => {
  assert.equal(resolveLocale("fr", "en-US"), "fr");
  assert.equal(resolveLocale("en", "fr-FR"), "en");
});

test("falls back to browser language when nothing is stored", () => {
  assert.equal(resolveLocale(null, "en-US"), "en");
  assert.equal(resolveLocale(null, "en-GB"), "en");
  assert.equal(resolveLocale(null, "fr-FR"), "fr");
  assert.equal(resolveLocale(null, "de-DE"), "en");
});

test("ignores invalid stored values and uses browser language", () => {
  assert.equal(resolveLocale("es", "en-US"), "en");
  assert.equal(resolveLocale("invalid", "fr-FR"), "fr");
});
