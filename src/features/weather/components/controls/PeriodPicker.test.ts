import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { hasPendingPeriodChange } from "./PeriodPicker";

test("detects when the period picker button should stay disabled", () => {
  const period = {
    startDate: "2026-05-01",
    endDate: "2026-05-25",
  };

  assert.equal(hasPendingPeriodChange(period, period), false);
});

test("detects when the period picker button should be enabled", () => {
  const period = {
    startDate: "2026-05-01",
    endDate: "2026-05-25",
  };

  assert.equal(
    hasPendingPeriodChange(period, {
      ...period,
      endDate: "2026-05-26",
    }),
    true
  );
});

test("does not keep the refresh button label hardcoded in french", () => {
  const source = readFileSync(new URL("./PeriodPicker.tsx", import.meta.url), "utf8");

  assert.equal(source.includes("Rafraîchir la période"), false);
});
