import assert from "node:assert/strict";
import test from "node:test";

import { buildColdWaveStats } from "@/features/weather/logic";
import type { ColdWavePeriod, WeatherYearDataset } from "@/features/weather/types";

test("counts freezing days, extreme cold nights, cold waves and grand froid across all selected datasets", () => {
  const datasets: WeatherYearDataset[] = [
    {
      id: "paris-2025",
      label: "2025",
      offsetYears: 0,
      values: [
        { date: "2025-01-01", day: 1, year: 2025, tmax: 4, tmin: 1 },
        { date: "2025-01-02", day: 2, year: 2025, tmax: 2, tmin: 0 },
        { date: "2025-01-03", day: 3, year: 2025, tmax: -2, tmin: -6 },
        { date: "2025-01-04", day: 4, year: 2025, tmax: -4, tmin: -8 },
      ],
    },
    {
      id: "paris-2024",
      label: "2024",
      offsetYears: 1,
      values: [
        { date: "2024-01-01", day: 1, year: 2024, tmax: 2, tmin: 0 },
        { date: "2024-01-02", day: 2, year: 2024, tmax: -1, tmin: -5 },
        { date: "2024-01-03", day: 3, year: 2024, tmax: 4, tmin: 3 },
      ],
    },
  ];
  const coldWaves: ColdWavePeriod[] = [
    buildColdWave({ kind: "vague_de_froid", start: "2025-01-02", end: "2025-01-04" }),
    buildColdWave({ kind: "grand_froid", start: "2025-02-10", end: "2025-02-13" }),
  ];

  assert.deepEqual(buildColdWaveStats(coldWaves, datasets), {
    freezingDays: 5,
    extremeColdNights: 3,
    coldWaveCount: 1,
    grandFroidCount: 1,
  });
});

function buildColdWave(
  overrides: Pick<ColdWavePeriod, "kind" | "start" | "end">
): ColdWavePeriod {
  return {
    datasetId: "paris-2025",
    datasetLabel: "2025",
    kind: overrides.kind,
    start: overrides.start,
    end: overrides.end,
    startDay: 1,
    endDay: 4,
    duration: 4,
    averageMin: -7.5,
  };
}
