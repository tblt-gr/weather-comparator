import assert from "node:assert/strict";
import test from "node:test";

import type { OpenMeteoArchiveResponse } from "@/lib/api/openMeteo";

import { normalizeWeatherData } from "./normalizeWeatherData";

test("normalizeWeatherData fills missing dates in the requested range", () => {
  const response: OpenMeteoArchiveResponse = {
    daily: {
      time: ["2025-07-01", "2025-07-03"],
      temperature_2m_max: [31, 29],
      temperature_2m_min: [19, 17],
    },
  };

  const dataset = normalizeWeatherData({
    offsetYears: 0,
    range: {
      startDate: "2025-07-01",
      endDate: "2025-07-03",
    },
    response,
  });

  assert.equal(dataset.id, "current");
  assert.equal(dataset.label, "2025-07-01 - 2025-07-03");
  assert.deepEqual(dataset.values, [
    { date: "2025-07-01", day: 1, year: 2025, tmax: 31, tmin: 19 },
    { date: "2025-07-02", day: 2, year: 2025, tmax: null, tmin: null },
    { date: "2025-07-03", day: 3, year: 2025, tmax: 29, tmin: 17 },
  ]);
});

test("normalizeWeatherData preserves offset ids and null API values", () => {
  const response: OpenMeteoArchiveResponse = {
    daily: {
      time: ["2024-02-28", "2024-02-29"],
      temperature_2m_max: [12, null],
      temperature_2m_min: [3, 4],
    },
  };

  const dataset = normalizeWeatherData({
    offsetYears: 2,
    range: {
      startDate: "2024-02-28",
      endDate: "2024-02-29",
    },
    response,
  });

  assert.equal(dataset.id, "minus-2");
  assert.deepEqual(dataset.values, [
    { date: "2024-02-28", day: 1, year: 2024, tmax: 12, tmin: 3 },
    { date: "2024-02-29", day: 2, year: 2024, tmax: null, tmin: 4 },
  ]);
});
