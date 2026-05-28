import assert from "node:assert/strict";
import test from "node:test";

import { buildHeatwaveStats } from "@/features/weather/logic";
import type { HeatwavePeriod, WeatherYearDataset } from "@/features/weather/types";

test("counts hot days, tropical nights, heatwaves and canicules across all selected datasets", () => {
  const datasets: WeatherYearDataset[] = [
    {
      id: "paris-2025",
      label: "2025",
      offsetYears: 0,
      values: [
        { date: "2025-07-01", day: 1, year: 2025, tmax: 29, tmin: 19 },
        { date: "2025-07-02", day: 2, year: 2025, tmax: 31, tmin: 20 },
        { date: "2025-07-03", day: 3, year: 2025, tmax: 35, tmin: 24 },
        { date: "2025-07-04", day: 4, year: 2025, tmax: 33, tmin: 18 },
      ],
    },
    {
      id: "paris-2024",
      label: "2024",
      offsetYears: 1,
      values: [
        { date: "2024-07-01", day: 1, year: 2024, tmax: 30, tmin: 19 },
        { date: "2024-07-02", day: 2, year: 2024, tmax: 34, tmin: 22 },
        { date: "2024-07-03", day: 3, year: 2024, tmax: 36, tmin: 24 },
      ],
    },
  ];
  const heatwaves: HeatwavePeriod[] = [
    buildHeatwave({ kind: "vague_de_chaleur", start: "2025-07-02", end: "2025-07-04" }),
    buildHeatwave({ kind: "canicule", start: "2025-08-10", end: "2025-08-13" }),
  ];

  assert.deepEqual(buildHeatwaveStats(heatwaves, datasets), {
    hotDays: 5,
    tropicalNights: 4,
    heatwaveCount: 1,
    caniculeCount: 1,
  });
});

function buildHeatwave(
  overrides: Pick<HeatwavePeriod, "kind" | "start" | "end">
): HeatwavePeriod {
  return {
    datasetId: "paris-2025",
    datasetLabel: "2025",
    kind: overrides.kind,
    start: overrides.start,
    end: overrides.end,
    startDay: 1,
    endDay: 4,
    duration: 4,
    averageMax: 32.5,
    includesForecast: false,
    forecastStartDay: null,
  };
}
