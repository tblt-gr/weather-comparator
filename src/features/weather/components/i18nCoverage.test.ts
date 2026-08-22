import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("city search does not keep visible labels hardcoded in french", () => {
  const source = readFileSync(new URL("./controls/CitySearch.tsx", import.meta.url), "utf8");

  assert.equal(source.includes(">Ville<"), false);
  assert.equal(source.includes("Aucune ville trouvée."), false);
  assert.equal(source.includes('t["city.searchError"]'), true);
  assert.equal(source.includes('t["city.retry"]'), true);
});

test("extreme criteria buttons include the episode name in their accessible label", () => {
  const source = readFileSync(new URL("./controls/ExtremeFilters.tsx", import.meta.url), "utf8");

  assert.equal(source.includes('t["extremes.criteriaForAriaLabel"]'), true);
  assert.equal(source.includes('.replace("{kind}", t[labelKey])'), true);
});

test("dashboard loading state does not keep the weather loading label hardcoded in french", () => {
  const source = readFileSync(new URL("./dashboard/WeatherDashboardPanel.tsx", import.meta.url), "utf8");

  assert.equal(source.includes("Chargement des données météo…"), false);
});

test("shared dialog primitives do not keep hardcoded english labels", () => {
  const dialogSource = readFileSync(
    new URL("../../../components/ui/dialog.tsx", import.meta.url),
    "utf8"
  );
  const commandSource = readFileSync(
    new URL("../../../components/ui/command.tsx", import.meta.url),
    "utf8"
  );

  assert.equal(dialogSource.includes(">Close<"), false);
  assert.equal(commandSource.includes('"Command Palette"'), false);
  assert.equal(commandSource.includes('"Search for a command to run..."'), false);
});
