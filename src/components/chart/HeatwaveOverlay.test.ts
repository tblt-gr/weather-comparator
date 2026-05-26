import assert from "node:assert/strict";
import test from "node:test";

import {
  buildHeatwaveStats,
  formatHeatwaveDateRange,
  formatHeatwaveSummary,
  groupHeatwavesByYear,
} from "@/components/chart/HeatwaveOverlay";
import type { HeatwavePeriod, WeatherYearDataset } from "@/types/weather";

test("formats a heatwave period as a readable french date range", () => {
  assert.equal(formatHeatwaveDateRange("2026-05-05", "2026-05-08"), "05 mai au 08 mai");
  assert.equal(formatHeatwaveDateRange("2026-05-30", "2026-06-02"), "30 mai au 02 juin");
});

test("groups heatwaves by dataset year while preserving event order", () => {
  const heatwaves: HeatwavePeriod[] = [
    buildHeatwave({
      datasetId: "year-2025",
      datasetLabel: "2025-05-01 - 2025-05-31",
      kind: "vague_de_chaleur",
      start: "2025-05-05",
      end: "2025-05-08",
    }),
    buildHeatwave({
      datasetId: "year-2024",
      datasetLabel: "2024-08-01 - 2024-08-31",
      kind: "canicule",
      start: "2024-08-10",
      end: "2024-08-14",
    }),
    buildHeatwave({
      datasetId: "year-2025",
      datasetLabel: "2025-08-01 - 2025-08-31",
      kind: "canicule",
      start: "2025-08-12",
      end: "2025-08-16",
    }),
  ];

  assert.deepEqual(groupHeatwavesByYear(heatwaves), [
    {
      year: "2025",
      heatwaves: [heatwaves[0], heatwaves[2]],
    },
    {
      year: "2024",
      heatwaves: [heatwaves[1]],
    },
  ]);
});

test("keeps duration and average temperature details in the summary", () => {
  assert.equal(
    formatHeatwaveSummary(
      buildHeatwave({
        datasetId: "year-2025",
        datasetLabel: "2025",
        kind: "canicule",
        start: "2025-05-05",
        end: "2025-05-08",
      })
    ),
    "Canicule 05 mai au 08 mai (4 jours, Tmax moyenne 32.5 degC)"
  );
});

test("buildHeatwaveStats returns all zeros when datasets is empty", () => {
  const heatwaves: HeatwavePeriod[] = [
    buildHeatwave({ datasetId: "d1", datasetLabel: "2025", kind: "vague_de_chaleur", start: "2025-07-01", end: "2025-07-05" }),
  ];
  assert.deepEqual(buildHeatwaveStats(heatwaves, []), { hotDays: 0, tropicalNights: 0, heatwaveCount: 1, canicula: 0 });
});

test("buildHeatwaveStats counts hotDays with tmax > 30", () => {
  const dataset = buildDataset({ offsetYears: 0, values: [
    { date: "2025-07-01", day: 1, year: 2025, tmax: 31, tmin: 18 },
    { date: "2025-07-02", day: 2, year: 2025, tmax: 29, tmin: 19 },
    { date: "2025-07-03", day: 3, year: 2025, tmax: 35, tmin: 22 },
    { date: "2025-07-04", day: 4, year: 2025, tmax: null, tmin: 20 },
  ]});
  const stats = buildHeatwaveStats([], [dataset]);
  assert.equal(stats.hotDays, 2);
});

test("buildHeatwaveStats counts tropicalNights with tmin >= 20", () => {
  const dataset = buildDataset({ offsetYears: 0, values: [
    { date: "2025-07-01", day: 1, year: 2025, tmax: 28, tmin: 19 },
    { date: "2025-07-02", day: 2, year: 2025, tmax: 30, tmin: 20 },
    { date: "2025-07-03", day: 3, year: 2025, tmax: 33, tmin: 21 },
    { date: "2025-07-04", day: 4, year: 2025, tmax: 31, tmin: null },
  ]});
  const stats = buildHeatwaveStats([], [dataset]);
  assert.equal(stats.tropicalNights, 2);
});

test("buildHeatwaveStats counts heatwaveCount and canicula correctly", () => {
  const heatwaves: HeatwavePeriod[] = [
    buildHeatwave({ datasetId: "d1", datasetLabel: "2025", kind: "vague_de_chaleur", start: "2025-06-01", end: "2025-06-05" }),
    buildHeatwave({ datasetId: "d1", datasetLabel: "2025", kind: "canicule", start: "2025-07-10", end: "2025-07-15" }),
    buildHeatwave({ datasetId: "d1", datasetLabel: "2025", kind: "vague_de_chaleur", start: "2025-08-01", end: "2025-08-04" }),
  ];
  const stats = buildHeatwaveStats(heatwaves, []);
  assert.equal(stats.heatwaveCount, 2);
  assert.equal(stats.canicula, 1);
});

test("buildHeatwaveStats uses only the reference dataset (offsetYears === 0)", () => {
  const refDataset = buildDataset({ offsetYears: 0, values: [
    { date: "2025-07-01", day: 1, year: 2025, tmax: 35, tmin: 22 },
  ]});
  const otherDataset = buildDataset({ offsetYears: 1, values: [
    { date: "2024-07-01", day: 1, year: 2024, tmax: 36, tmin: 23 },
    { date: "2024-07-02", day: 2, year: 2024, tmax: 37, tmin: 24 },
  ]});
  const stats = buildHeatwaveStats([], [refDataset, otherDataset]);
  assert.equal(stats.hotDays, 1);
  assert.equal(stats.tropicalNights, 1);
});

function buildDataset(overrides: { offsetYears: number; values: WeatherYearDataset["values"] }): WeatherYearDataset {
  return {
    id: `dataset-${overrides.offsetYears}`,
    label: `Dataset ${overrides.offsetYears}`,
    offsetYears: overrides.offsetYears,
    values: overrides.values,
  };
}

function buildHeatwave(
  overrides: Pick<HeatwavePeriod, "datasetId" | "datasetLabel" | "kind" | "start" | "end">
): HeatwavePeriod {
  return {
    datasetId: overrides.datasetId,
    datasetLabel: overrides.datasetLabel,
    kind: overrides.kind,
    start: overrides.start,
    end: overrides.end,
    startDay: 1,
    endDay: 4,
    duration: 4,
    averageMax: 32.5,
  };
}
