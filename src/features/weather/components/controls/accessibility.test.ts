import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const citySearchSource = readFileSync(new URL("./CitySearch.tsx", import.meta.url), "utf8");
const extremeFiltersSource = readFileSync(new URL("./ExtremeFilters.tsx", import.meta.url), "utf8");
const globalStyles = readFileSync(new URL("../../../../app/globals.css", import.meta.url), "utf8");

test("city search keeps its combobox relationships valid", () => {
  assert.equal(citySearchSource.includes('label={t["city.searchAriaLabel"]}'), true);
  assert.equal(citySearchSource.includes('<CommandList aria-hidden className="hidden" />'), true);
});

test("city search separates and enlarges its touch targets", () => {
  assert.equal(citySearchSource.includes("city-search-control"), true);
  assert.equal(citySearchSource.includes("city-search-clear"), true);
  assert.equal(globalStyles.includes(".city-search-control"), true);
  assert.equal(globalStyles.includes("min-height: 3rem;"), true);
});

test("unavailable extreme labels retain readable contrast", () => {
  assert.equal(extremeFiltersSource.includes("has-disabled:opacity"), false);
});
