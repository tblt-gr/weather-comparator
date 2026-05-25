import assert from "node:assert/strict";
import test from "node:test";

import { formatChartDateTick } from "./WeatherChart";

test("formats ISO chart dates as dd/mm/yy", () => {
  assert.equal(formatChartDateTick("2026-05-25"), "25/05/26");
  assert.equal(formatChartDateTick("1999-12-01"), "01/12/99");
});

test("returns the input unchanged when the chart tick is not an ISO date", () => {
  assert.equal(formatChartDateTick("3"), "3");
  assert.equal(formatChartDateTick(3), "3");
});
