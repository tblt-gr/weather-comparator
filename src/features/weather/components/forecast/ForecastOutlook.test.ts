import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("forecast outlook keeps a readable day floor and scrolls extra days", () => {
  const outlook = readFileSync(new URL("./ForecastOutlook.tsx", import.meta.url), "utf8");
  const cell = readFileSync(new URL("./ForecastDayCell.tsx", import.meta.url), "utf8");

  assert.equal(outlook.includes("overflow-x-auto"), true);
  assert.equal(outlook.includes("grid-auto-columns"), false);
  assert.equal(cell.includes("w-[calc(100%/7)]"), true);
  assert.equal(cell.includes("min-w-[8.5rem]"), true);
  assert.equal(cell.includes("shrink-0"), true);
});
