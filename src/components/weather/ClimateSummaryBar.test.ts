import assert from "node:assert/strict";
import test from "node:test";

import { buildClimateSummaryStats } from "./ClimateSummaryBar";
import { fr } from "@/lib/i18n/locales/fr";

test("keeps hot days at zero but hides tropical nights and heatwave event cards at zero", () => {
  const stats = buildClimateSummaryStats({
    datasets: [
      {
        id: "paris-2025",
        label: "2025",
        offsetYears: 0,
        values: [
          { date: "2025-07-01", day: 1, year: 2025, tmax: 28, tmin: 18 },
          { date: "2025-07-02", day: 2, year: 2025, tmax: 30, tmin: 19 },
        ],
      },
    ],
    coldWaves: [],
    heatwaves: [],
    normals: [{ day: 1, value: 27 }, { day: 2, value: 28 }],
    showNormals: false,
    temperatureMode: "tmax",
    t: fr,
  });

  assert.equal(stats.some((stat) => stat.label === fr["stats.normal"]), false);
  assert.equal(stats.some((stat) => stat.label === fr["stats.deviation"]), false);
  assert.equal(
    stats.find((stat) => stat.label === fr["stats.hotDays"])?.value,
    "0"
  );
  assert.equal(
    stats.some((stat) => stat.label === fr["stats.tropicalNights"]),
    false
  );
  assert.equal(
    stats.some((stat) => stat.label === fr["stats.heatwaves"]),
    false
  );
  assert.equal(
    stats.some((stat) => stat.label === fr["stats.canicules"]),
    false
  );
  assert.equal(
    stats.some((stat) => stat.label === fr["stats.freezingDays"]),
    false
  );
});

test("shows cold wave stat cards only when their value is greater than zero", () => {
  const stats = buildClimateSummaryStats({
    datasets: [
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
    ],
    coldWaves: [
      {
        datasetId: "paris-2025",
        datasetLabel: "2025",
        kind: "vague_de_froid",
        start: "2025-01-02",
        end: "2025-01-04",
        startDay: 2,
        endDay: 4,
        duration: 3,
        averageMin: -4.7,
      },
    ],
    heatwaves: [],
    normals: undefined,
    showNormals: false,
    temperatureMode: "tmin",
    t: fr,
  });

  assert.equal(
    stats.find((stat) => stat.label === fr["stats.freezingDays"])?.value,
    "3"
  );
  assert.equal(
    stats.find((stat) => stat.label === fr["stats.extremeColdNights"])?.value,
    "2"
  );
  assert.equal(
    stats.find((stat) => stat.label === fr["stats.coldWaves"])?.value,
    "1"
  );
  assert.equal(
    stats.some((stat) => stat.label === fr["stats.grandFroid"]),
    false
  );
});
