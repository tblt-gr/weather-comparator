import assert from "node:assert/strict";
import test from "node:test";

import { buildClimateSummaryStats } from "./ClimateSummaryBar";

test("hides climate normal stats when normals are disabled", () => {
  const stats = buildClimateSummaryStats({
    datasets: [
      {
        id: "paris-2025",
        label: "2025",
        offsetYears: 0,
        values: [
          { date: "2025-07-01", day: 1, year: 2025, tmax: 30, tmin: 18 },
          { date: "2025-07-02", day: 2, year: 2025, tmax: 32, tmin: 20 },
        ],
      },
    ],
    normals: [{ day: 1, value: 27 }, { day: 2, value: 28 }],
    showNormals: false,
    temperatureMode: "tmax",
  });

  assert.equal(stats.some((stat) => stat.label === "Normale 1991–2020"), false);
  assert.equal(stats.some((stat) => stat.label === "Écart"), false);
});
