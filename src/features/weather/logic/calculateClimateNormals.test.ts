import assert from "node:assert";
import { describe, it } from "node:test";

import {
  buildClimateDatasetsFromRange,
  calculateClimateNormals,
} from "@/features/weather/logic";
import type { OpenMeteoArchiveResponse } from "@/features/weather/api";
import type { WeatherYearDataset } from "@/features/weather/types";

describe("buildClimateDatasetsFromRange", () => {
  it("builds one dataset per valid year from a multi-year response", () => {
    // Minimal response: only 3 years of data (1991, 1992, 1993) for a June 1-day period
    const period = { startDate: "2025-06-01", endDate: "2025-06-01" };

    const response: OpenMeteoArchiveResponse = {
      daily: {
        time: ["1991-06-01", "1992-06-01", "1993-06-01"],
        temperature_2m_max: [25, 26, 27],
        temperature_2m_min: [15, 16, 17],
      },
    };

    const datasets = buildClimateDatasetsFromRange(response, period);

    // Should have datasets for all 30 years (1991-2020), but only 3 have actual data
    // All 30 years are valid (2025 - 1991 to 2025 - 2020 are all positive offsets)
    assert.strictEqual(datasets.length, 30);

    // Year 1991 (offset = 2025 - 1991 = 34) should have tmax=25
    const dataset1991 = datasets.find((d) => d.offsetYears === 34);
    assert.ok(dataset1991);
    assert.strictEqual(dataset1991.values[0]?.tmax, 25);

    // Year 1992 (offset = 33) should have tmax=26
    const dataset1992 = datasets.find((d) => d.offsetYears === 33);
    assert.ok(dataset1992);
    assert.strictEqual(dataset1992.values[0]?.tmax, 26);

    // Year 2000 (offset = 25) should have tmax=null (not in response)
    const dataset2000 = datasets.find((d) => d.offsetYears === 25);
    assert.ok(dataset2000);
    assert.strictEqual(dataset2000.values[0]?.tmax, null);
  });

  it("each dataset has day=1 for the first value", () => {
    const period = { startDate: "2025-06-01", endDate: "2025-06-03" };
    const response: OpenMeteoArchiveResponse = {
      daily: {
        time: ["1991-06-01", "1991-06-02", "1991-06-03"],
        temperature_2m_max: [20, 21, 22],
        temperature_2m_min: [10, 11, 12],
      },
    };

    const datasets = buildClimateDatasetsFromRange(response, period);
    const dataset1991 = datasets.find((d) => d.offsetYears === 34);
    assert.ok(dataset1991);
    assert.strictEqual(dataset1991.values[0]?.day, 1);
    assert.strictEqual(dataset1991.values[1]?.day, 2);
    assert.strictEqual(dataset1991.values[2]?.day, 3);
  });
});

describe("calculateClimateNormals", () => {
  it("averages only matching day values across sparse datasets", () => {
    const datasets: WeatherYearDataset[] = [
      {
        id: "current",
        label: "2025",
        offsetYears: 0,
        values: [
          { date: "2025-06-01", day: 1, year: 2025, tmax: 30, tmin: 18 },
          { date: "2025-06-03", day: 3, year: 2025, tmax: 24, tmin: 15 },
        ],
      },
      {
        id: "minus-1",
        label: "2024",
        offsetYears: 1,
        values: [
          { date: "2024-06-01", day: 1, year: 2024, tmax: 28, tmin: 17 },
          { date: "2024-06-02", day: 2, year: 2024, tmax: 26, tmin: 16 },
        ],
      },
    ];

    assert.deepStrictEqual(calculateClimateNormals(datasets, "tmax"), [
      { day: 1, value: 29 },
      { day: 2, value: 26 },
    ]);
  });
});
