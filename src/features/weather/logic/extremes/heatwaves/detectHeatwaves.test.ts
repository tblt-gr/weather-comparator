import assert from "node:assert/strict";
import test from "node:test";

import { detectHeatwaves } from "./detectHeatwaves";
import type { WeatherYearDataset } from "@/features/weather/types";

test("classifies a hot spell as a canicule when it crosses the higher threshold both day and night", () => {
  const datasets: WeatherYearDataset[] = [
    buildDataset("minus-1", "2025", [
      [30, 20],
      [31, 20],
      [32, 20],
    ]),
    buildDataset("minus-4", "2022", [
      [33, 21],
      [34, 21],
      [35, 21],
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
      [30, 20],
      [31, 20],
      [33, 21],
      [31, 20],
      [30, 20],
      [31, 20],
      [30, 20],
    ]),
  ];

  const [heatwave] = detectHeatwaves(datasets);

  assert.equal(heatwave?.kind, "vague_de_chaleur");
});

test("detects a heatwave from tmax alone even when nights stay cool", () => {
  const datasets: WeatherYearDataset[] = [
    buildDataset("minus-1", "2025", [
      [31, 18],
      [32, 19],
      [33, 19],
    ]),
  ];

  const [heatwave] = detectHeatwaves(datasets);

  assert.equal(heatwave?.kind, "vague_de_chaleur");
  assert.equal(heatwave?.duration, 3);
});

test("does not classify as canicule when tmax crosses the higher threshold but nights stay cool", () => {
  const datasets: WeatherYearDataset[] = [
    buildDataset("minus-1", "2025", [
      [34, 18],
      [35, 19],
      [36, 19],
    ]),
  ];

  const [heatwave] = detectHeatwaves(datasets);

  assert.equal(heatwave?.kind, "vague_de_chaleur");
});

test("does not split a heatwave in two when a single day dips only slightly", () => {
  const datasets: WeatherYearDataset[] = [
    buildDataset("minus-1", "2025", [
      [32, 21],
      [32, 21],
      [32, 21],
      [28, 19],
      [32, 21],
      [32, 21],
      [32, 21],
    ]),
  ];

  const heatwaves = detectHeatwaves(datasets);

  assert.equal(heatwaves.length, 1);
  assert.equal(heatwaves[0].duration, 7);
  assert.equal(heatwaves[0].startDay, 1);
  assert.equal(heatwaves[0].endDay, 7);
});

test("still splits into two heatwaves when the dip is a real cold break", () => {
  const datasets: WeatherYearDataset[] = [
    buildDataset("minus-1", "2025", [
      [32, 21],
      [32, 21],
      [32, 21],
      [18, 10],
      [32, 21],
      [32, 21],
      [32, 21],
    ]),
  ];

  const heatwaves = detectHeatwaves(datasets);

  assert.equal(heatwaves.length, 2);
});

test("does not extend an episode past its real end even though the trailing average is still elevated", () => {
  const datasets: WeatherYearDataset[] = [
    buildDataset("minus-1", "2025", [
      [34, 22],
      [34, 22],
      [34, 22],
      [27, 19],
      [29, 19],
    ]),
  ];

  const [heatwave] = detectHeatwaves(datasets);

  assert.equal(heatwave?.duration, 3);
  assert.equal(heatwave?.startDay, 1);
  assert.equal(heatwave?.endDay, 3);
});

test("detects a forecast-only heatwave and marks it as forecast", () => {
  const datasets: WeatherYearDataset[] = [
    buildDataset("current", "2026", [
      [30, 20, true],
      [31, 20, true],
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
      [30, 20, false],
      [31, 20, false],
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
