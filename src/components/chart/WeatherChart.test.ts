import assert from "node:assert/strict";
import test from "node:test";

import {
  formatChartDateTick,
  getHeatwaveFill,
  getHeatwaveLaneBounds,
  getMonthBoundaryDays,
} from "./WeatherChart";

test("formats ISO chart dates as dd/mm/yy", () => {
  assert.equal(formatChartDateTick("2026-05-25"), "25/05/26");
  assert.equal(formatChartDateTick("1999-12-01"), "01/12/99");
});

test("returns the input unchanged when the chart tick is not an ISO date", () => {
  assert.equal(formatChartDateTick("3"), "3");
  assert.equal(formatChartDateTick(3), "3");
});

test("extracts month boundary days from chart rows", () => {
  assert.deepEqual(
    getMonthBoundaryDays([
      { day: 1, label: "2026-01-01" },
      { day: 2, label: "2026-01-02" },
      { day: 31, label: "2026-01-31" },
      { day: 32, label: "2026-02-01" },
      { day: 33, label: "2026-02-02" },
    ]),
    [1, 32]
  );
});

test("uses red for canicules and orange for heatwaves", () => {
  assert.equal(getHeatwaveFill("canicule"), "oklch(0.62 0.24 28)");
  assert.equal(getHeatwaveFill("vague_de_chaleur"), "oklch(0.74 0.18 62)");
});

test("places each dataset in its own heatwave lane", () => {
  const lane = getHeatwaveLaneBounds("2025", [{ id: "2026" }, { id: "2025" }], {
    min: 10,
    max: 40,
  });

  assert.deepEqual(lane, { y1: 14.2, y2: 25 });
});
