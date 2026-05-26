import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectColdWaves } from "./detectColdWaves";
import type { WeatherYearDataset } from "@/types/weather";

function makeDataset(values: { date: string; day: number; tmin: number | null; tmax: number | null }[]): WeatherYearDataset {
  return {
    id: "ds1",
    label: "2024",
    offsetYears: 0,
    values: values.map((v) => ({ ...v, year: 2024 })),
  };
}

describe("detectColdWaves", () => {
  it("ignores sequences shorter than 3 days", () => {
    const dataset = makeDataset([
      { date: "2024-01-01", day: 1, tmin: -6, tmax: -1 },
      { date: "2024-01-02", day: 2, tmin: -7, tmax: -1 },
    ]);
    const result = detectColdWaves([dataset]);
    assert.deepEqual(result, []);
  });

  it("detects vague_de_froid for 3+ qualifying days", () => {
    const dataset = makeDataset([
      { date: "2024-01-01", day: 1, tmin: -6, tmax: -1 },
      { date: "2024-01-02", day: 2, tmin: -7, tmax: -1 },
      { date: "2024-01-03", day: 3, tmin: -8, tmax: -1 },
    ]);
    const result = detectColdWaves([dataset]);
    assert.equal(result.length, 1);
    assert.equal(result[0].kind, "vague_de_froid");
    assert.equal(result[0].duration, 3);
    assert.equal(result[0].start, "2024-01-01");
    assert.equal(result[0].end, "2024-01-03");
    assert.ok(Math.abs(result[0].averageMin - (-7)) < 0.001);
  });

  it("detects grand_froid when 3+ consecutive days have tmin <= -10", () => {
    const dataset = makeDataset([
      { date: "2024-01-01", day: 1, tmin: -6, tmax: -1 },
      { date: "2024-01-02", day: 2, tmin: -11, tmax: -1 },
      { date: "2024-01-03", day: 3, tmin: -12, tmax: -1 },
      { date: "2024-01-04", day: 4, tmin: -11, tmax: -1 },
    ]);
    const result = detectColdWaves([dataset]);
    assert.equal(result.length, 1);
    assert.equal(result[0].kind, "grand_froid");
  });

  it("detects grand_froid when 3+ consecutive days have tmax <= -5", () => {
    const dataset = makeDataset([
      { date: "2024-01-01", day: 1, tmin: -6, tmax: -6 },
      { date: "2024-01-02", day: 2, tmin: -7, tmax: -6 },
      { date: "2024-01-03", day: 3, tmin: -8, tmax: -6 },
    ]);
    const result = detectColdWaves([dataset]);
    assert.equal(result.length, 1);
    assert.equal(result[0].kind, "grand_froid");
  });

  it("interrupts sequence when tmin is null", () => {
    const dataset = makeDataset([
      { date: "2024-01-01", day: 1, tmin: -6, tmax: -1 },
      { date: "2024-01-02", day: 2, tmin: -7, tmax: -1 },
      { date: "2024-01-03", day: 3, tmin: -8, tmax: -1 },
      { date: "2024-01-04", day: 4, tmin: null, tmax: -1 },
      { date: "2024-01-05", day: 5, tmin: -7, tmax: -1 },
      { date: "2024-01-06", day: 6, tmin: -8, tmax: -1 },
      { date: "2024-01-07", day: 7, tmin: -9, tmax: -1 },
    ]);
    const result = detectColdWaves([dataset]);
    assert.equal(result.length, 2);
    assert.equal(result[0].start, "2024-01-01");
    assert.equal(result[0].end, "2024-01-03");
    assert.equal(result[1].start, "2024-01-05");
    assert.equal(result[1].end, "2024-01-07");
  });

  it("interrupts sequence when tmax is null", () => {
    const dataset = makeDataset([
      { date: "2024-01-01", day: 1, tmin: -6, tmax: -1 },
      { date: "2024-01-02", day: 2, tmin: -7, tmax: -1 },
      { date: "2024-01-03", day: 3, tmin: -8, tmax: -1 },
      { date: "2024-01-04", day: 4, tmin: -9, tmax: null },
      { date: "2024-01-05", day: 5, tmin: -6, tmax: -1 },
      { date: "2024-01-06", day: 6, tmin: -7, tmax: -1 },
      { date: "2024-01-07", day: 7, tmin: -8, tmax: -1 },
    ]);
    const result = detectColdWaves([dataset]);
    assert.equal(result.length, 2);
    assert.equal(result[0].start, "2024-01-01");
    assert.equal(result[0].end, "2024-01-03");
    assert.equal(result[1].start, "2024-01-05");
    assert.equal(result[1].end, "2024-01-07");
  });

  it("produces two separate periods when an out-of-threshold day interrupts the sequence", () => {
    const dataset = makeDataset([
      { date: "2024-01-01", day: 1, tmin: -6, tmax: -1 },
      { date: "2024-01-02", day: 2, tmin: -7, tmax: -1 },
      { date: "2024-01-03", day: 3, tmin: -8, tmax: -1 },
      { date: "2024-01-04", day: 4, tmin: 2, tmax: 5 },
      { date: "2024-01-05", day: 5, tmin: -6, tmax: -1 },
      { date: "2024-01-06", day: 6, tmin: -7, tmax: -1 },
      { date: "2024-01-07", day: 7, tmin: -8, tmax: -1 },
    ]);
    const result = detectColdWaves([dataset]);
    assert.equal(result.length, 2);
    assert.equal(result[0].start, "2024-01-01");
    assert.equal(result[0].end, "2024-01-03");
    assert.equal(result[1].start, "2024-01-05");
    assert.equal(result[1].end, "2024-01-07");
  });
});
