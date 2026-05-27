import assert from "node:assert/strict";
import test from "node:test";

import type { WeatherYearDataset } from "@/features/weather/types";

import { exportWeatherCsv } from "./exportCsv";

test("exportWeatherCsv includes the header and one row per value", () => {
  const datasets: WeatherYearDataset[] = [
    {
      id: "current",
      label: "Paris, France",
      offsetYears: 0,
      values: [
        { date: "2025-07-01", day: 1, year: 2025, tmax: 30, tmin: 18 },
        { date: "2025-07-02", day: 2, year: 2025, tmax: null, tmin: 17 },
      ],
    },
    {
      id: "minus-1",
      label: "2024-07-01 - 2024-07-02",
      offsetYears: 1,
      values: [{ date: "2024-07-01", day: 1, year: 2024, tmax: 28, tmin: null }],
    },
  ];

  assert.equal(
    exportWeatherCsv(datasets),
    [
      "datasetId,datasetLabel,offsetYears,date,year,tmax,tmin",
      'current,"Paris, France",0,2025-07-01,2025,30,18',
      'current,"Paris, France",0,2025-07-02,2025,,17',
      "minus-1,2024-07-01 - 2024-07-02,1,2024-07-01,2024,28,",
    ].join("\n")
  );
});
