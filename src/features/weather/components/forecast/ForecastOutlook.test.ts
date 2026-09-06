import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("forecast outlook keeps a readable day floor and scrolls extra days", () => {
  const outlook = readFileSync(new URL("./ForecastOutlook.tsx", import.meta.url), "utf8");
  const cell = readFileSync(new URL("./ForecastDayCell.tsx", import.meta.url), "utf8");

  assert.equal(outlook.includes("overflow-x-auto"), true);
  assert.equal(outlook.includes("[contain:paint]"), true);
  assert.equal(outlook.includes("grid-auto-columns"), false);
  assert.equal(cell.includes("w-[calc(100%/7)]"), true);
  assert.equal(cell.includes("min-w-[8.5rem]"), true);
  assert.equal(cell.includes("shrink-0"), true);
});

test("summary-scroll contains paint so forecast days do not expand the page", () => {
  const css = readFileSync(new URL("../../../../app/globals.css", import.meta.url), "utf8");

  assert.match(css, /\.summary-scroll\s*\{[^}]*contain:\s*paint/);
});
