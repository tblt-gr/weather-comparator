import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  formatColdWaveDateRange,
  formatColdWaveSummary,
  groupColdWavesByYear,
} from "./ColdWaveOverlay";
import { buildColdWaveStats } from "@/lib/weather/coldWaveStats";
import type { ColdWavePeriod, WeatherYearDataset } from "@/types/weather";

const makeColdWave = (overrides: Partial<ColdWavePeriod> = {}): ColdWavePeriod => ({
  datasetId: "ds-0",
  datasetLabel: "2024",
  kind: "vague_de_froid",
  start: "2024-01-10",
  end: "2024-01-15",
  startDay: 10,
  endDay: 15,
  duration: 6,
  averageMin: -3.2,
  ...overrides,
});

const makeDataset = (overrides: Partial<WeatherYearDataset> = {}): WeatherYearDataset => ({
  id: "ds-0",
  label: "2024",
  offsetYears: 0,
  values: [],
  ...overrides,
});

describe("formatColdWaveDateRange", () => {
  it("formats date range in French", () => {
    const result = formatColdWaveDateRange("2024-01-10", "2024-01-15");
    assert.ok(result.includes("janvier"), `Expected 'janvier' in: ${result}`);
    assert.ok(result.includes("au"), `Expected 'au' in: ${result}`);
  });
});

describe("formatColdWaveSummary", () => {
  it("formats vague_de_froid summary with Tmin", () => {
    const cw = makeColdWave({ kind: "vague_de_froid", averageMin: -3.2, duration: 6 });
    const result = formatColdWaveSummary(cw);
    assert.ok(result.startsWith("Vague de froid"), `Expected 'Vague de froid' prefix: ${result}`);
    assert.ok(result.includes("6 jours"), `Expected '6 jours': ${result}`);
    assert.ok(result.includes("Tmin moyenne -3.2 degC"), `Expected Tmin info: ${result}`);
  });

  it("formats grand_froid summary", () => {
    const cw = makeColdWave({ kind: "grand_froid", averageMin: -8.5, duration: 3 });
    const result = formatColdWaveSummary(cw);
    assert.ok(result.startsWith("Grand froid"), `Expected 'Grand froid' prefix: ${result}`);
    assert.ok(result.includes("Tmin moyenne -8.5 degC"), `Expected Tmin info: ${result}`);
  });
});

describe("groupColdWavesByYear", () => {
  it("returns empty array for empty input", () => {
    const result = groupColdWavesByYear([]);
    assert.deepEqual(result, []);
  });

  it("groups cold waves by year", () => {
    const cw1 = makeColdWave({ start: "2024-01-10", end: "2024-01-15" });
    const cw2 = makeColdWave({ start: "2024-02-01", end: "2024-02-05" });
    const cw3 = makeColdWave({ start: "2023-12-20", end: "2023-12-25" });

    const result = groupColdWavesByYear([cw1, cw2, cw3]);
    assert.equal(result.length, 2);

    const group2024 = result.find((g) => g.year === "2024");
    const group2023 = result.find((g) => g.year === "2023");

    assert.ok(group2024, "Should have 2024 group");
    assert.ok(group2023, "Should have 2023 group");
    assert.equal(group2024.coldWaves.length, 2);
    assert.equal(group2023.coldWaves.length, 1);
  });

  it("preserves order within a year", () => {
    const cw1 = makeColdWave({ start: "2024-01-10", end: "2024-01-15" });
    const cw2 = makeColdWave({ start: "2024-02-01", end: "2024-02-05" });

    const result = groupColdWavesByYear([cw1, cw2]);
    assert.equal(result[0].coldWaves[0].start, "2024-01-10");
    assert.equal(result[0].coldWaves[1].start, "2024-02-01");
  });
});

describe("buildColdWaveStats", () => {
  it("returns zeros when coldWaves is empty and datasets is empty", () => {
    const stats = buildColdWaveStats([], []);
    assert.deepEqual(stats, {
      freezingDays: 0,
      extremeColdNights: 0,
      coldWaveCount: 0,
      grandFroidCount: 0,
    });
  });

  it("counts freezingDays and extremeColdNights even without a reference dataset", () => {
    const cw = makeColdWave({ kind: "vague_de_froid" });
    const nonRefDataset = makeDataset({
      offsetYears: 1,
      values: [{ date: "2023-01-10", day: 10, year: 2023, tmax: 5, tmin: -3 }],
    });
    const stats = buildColdWaveStats([cw], [nonRefDataset]);
    assert.equal(stats.freezingDays, 1);
    assert.equal(stats.extremeColdNights, 0);
    assert.equal(stats.coldWaveCount, 1);
  });

  it("counts freezing days (tmin <= 0) from reference dataset", () => {
    const referenceDataset = makeDataset({
      offsetYears: 0,
      values: [
        { date: "2024-01-01", day: 1, year: 2024, tmax: 5, tmin: 0 },
        { date: "2024-01-02", day: 2, year: 2024, tmax: 6, tmin: -2 },
        { date: "2024-01-03", day: 3, year: 2024, tmax: 8, tmin: 1 },
        { date: "2024-01-04", day: 4, year: 2024, tmax: 3, tmin: null },
      ],
    });
    const stats = buildColdWaveStats([], [referenceDataset]);
    assert.equal(stats.freezingDays, 2);
  });

  it("counts extreme cold nights (tmin <= -5) from reference dataset", () => {
    const referenceDataset = makeDataset({
      offsetYears: 0,
      values: [
        { date: "2024-01-01", day: 1, year: 2024, tmax: 0, tmin: -5 },
        { date: "2024-01-02", day: 2, year: 2024, tmax: -2, tmin: -8 },
        { date: "2024-01-03", day: 3, year: 2024, tmax: 5, tmin: -3 },
        { date: "2024-01-04", day: 4, year: 2024, tmax: 3, tmin: 0 },
      ],
    });
    const stats = buildColdWaveStats([], [referenceDataset]);
    assert.equal(stats.extremeColdNights, 2);
  });

  it("counts coldWaveCount and grandFroidCount correctly", () => {
    const coldWaves: ColdWavePeriod[] = [
      makeColdWave({ kind: "vague_de_froid" }),
      makeColdWave({ kind: "vague_de_froid", start: "2024-02-01", end: "2024-02-05" }),
      makeColdWave({ kind: "grand_froid", start: "2024-03-01", end: "2024-03-04" }),
    ];
    const stats = buildColdWaveStats(coldWaves, []);
    assert.equal(stats.coldWaveCount, 2);
    assert.equal(stats.grandFroidCount, 1);
  });

  it("aggregates day counts across all selected datasets", () => {
    const referenceDataset = makeDataset({
      offsetYears: 0,
      values: [
        { date: "2024-01-01", day: 1, year: 2024, tmax: 5, tmin: -1 },
      ],
    });
    const otherDataset = makeDataset({
      id: "ds-1",
      label: "2023",
      offsetYears: 1,
      values: [
        { date: "2023-01-01", day: 1, year: 2023, tmax: 3, tmin: -10 },
        { date: "2023-01-02", day: 2, year: 2023, tmax: 2, tmin: -6 },
      ],
    });
    const stats = buildColdWaveStats([], [referenceDataset, otherDataset]);
    assert.equal(stats.freezingDays, 3);
    assert.equal(stats.extremeColdNights, 2);
  });
});
