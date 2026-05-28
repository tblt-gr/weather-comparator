import assert from "node:assert/strict";
import test from "node:test";

import { detectHeatwaves } from "./detectHeatwaves";
import type { WeatherYearDataset } from "@/features/weather/types";

test("classifies a hot spell as a canicule when it crosses the higher threshold", () => {
  const datasets: WeatherYearDataset[] = [
    buildDataset("minus-1", "2025", [
      [30, 16],
      [31, 17],
      [32, 18],
    ]),
    buildDataset("minus-4", "2022", [
      [33, 15],
      [34, 18],
      [35, 19],
    ]),
  ];

  const heatwaves = detectHeatwaves(datasets);

  assert.deepEqual(
    heatwaves.map((heatwave) => ({
      label: heatwave.datasetLabel,
      kind: heatwave.kind,
    })),
    [
      { label: "2025", kind: "vague_de_chaleur" },
      { label: "2022", kind: "canicule" },
    ]
  );
});

test("does not classify a long heatwave as canicule when only one day crosses the higher threshold", () => {
  const datasets: WeatherYearDataset[] = [
    buildDataset("minus-7", "2019", [
      [30, 16],
      [31, 17],
      [33, 18],
      [31, 18],
      [30, 17],
      [31, 16],
      [30, 15],
    ]),
  ];

  const [heatwave] = detectHeatwaves(datasets);

  assert.equal(heatwave?.kind, "vague_de_chaleur");
});

test("detects a forecast-only heatwave and marks it as forecast", () => {
  const datasets: WeatherYearDataset[] = [
    buildDataset("current", "2026", [
      [30, 18, true],
      [31, 19, true],
      [32, 20, true],
    ]),
  ];

  const [heatwave] = detectHeatwaves(datasets);

  assert.deepEqual(heatwave, {
    datasetId: "current",
    datasetLabel: "2026",
    kind: "vague_de_chaleur",
    start: "2026-07-01",
    end: "2026-07-03",
    startDay: 1,
    endDay: 3,
    duration: 3,
    averageMax: 31,
    includesForecast: true,
    forecastStartDay: 1,
  });
});

test("keeps one heatwave across the observed to forecast boundary and records where forecast starts", () => {
  const datasets: WeatherYearDataset[] = [
    buildDataset("current", "2026", [
      [30, 18, false],
      [31, 19, false],
      [32, 20, true],
      [33, 21, true],
    ]),
  ];

  const [heatwave] = detectHeatwaves(datasets);

  assert.equal(heatwave?.duration, 4);
  assert.equal(heatwave?.includesForecast, true);
  assert.equal(heatwave?.forecastStartDay, 3);
});

function buildDataset(
  id: string,
  label: string,
  temperatures: [tmax: number, tmin: number, isForecast?: boolean][]
): WeatherYearDataset {
  return {
    id,
    label,
    offsetYears: 0,
    values: temperatures.map(([tmax, tmin, isForecast], index) => ({
      date: `2026-07-${String(index + 1).padStart(2, "0")}`,
      day: index + 1,
      year: 2026,
      tmax,
      tmin,
      isForecast,
    })),
  };
}
