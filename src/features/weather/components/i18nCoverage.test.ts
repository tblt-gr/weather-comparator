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

test("forecast outlook uses translated weather labels instead of hardcoded french copy", () => {
  const outlook = readFileSync(new URL("./forecast/ForecastOutlook.tsx", import.meta.url), "utf8");
  const dayCell = readFileSync(new URL("./forecast/ForecastDayCell.tsx", import.meta.url), "utf8");
  const uvScale = readFileSync(new URL("./forecast/UvScaleInfo.tsx", import.meta.url), "utf8");
  const format = readFileSync(
    new URL("./forecast/forecastOutlookFormat.ts", import.meta.url),
    "utf8"
  );
  const source = `${outlook}\n${dayCell}\n${uvScale}\n${format}`;

  assert.equal(outlook.includes('t["forecast.outlookTitle"]'), true);
  assert.equal(dayCell.includes("`weather.${day.condition.kind}`"), true);
  assert.equal(source.includes("forecast.uv.low"), true);
  assert.equal(source.includes("forecast.uv.extreme"), true);
  assert.equal(uvScale.includes('t["forecast.uv.scaleAriaLabel"]'), true);
  assert.equal(uvScale.includes('t["forecast.uv.scaleTitle"]'), true);
  assert.equal(source.includes(">Soleil<"), false);
  assert.equal(source.includes(">Orage<"), false);
  assert.equal(source.includes(">Faible<"), false);
});

test("dashboard cards use translated section titles", () => {
  const filters = readFileSync(
    new URL("./dashboard/WeatherDashboardFilters.tsx", import.meta.url),
    "utf8"
  );
  const panel = readFileSync(
    new URL("./dashboard/WeatherDashboardPanel.tsx", import.meta.url),
    "utf8"
  );

  assert.equal(filters.includes('t["filters.title"]'), true);
  assert.equal(panel.includes('t["chart.title"]'), true);
  assert.equal(filters.includes(">Filtres<"), false);
  assert.equal(panel.includes(">Graphique<"), false);
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
