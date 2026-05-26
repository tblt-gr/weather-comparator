import assert from "node:assert/strict";
import test from "node:test";

import { isValidDatePeriod, normalizeDatePeriod, validateDatePeriod } from "./periodValidation";

test("accepts single-day periods", () => {
  assert.equal(
    isValidDatePeriod({
      startDate: "2026-05-26",
      endDate: "2026-05-26",
    }),
    true
  );
});

test("keeps the start date when the end date is edited before it", () => {
  assert.deepEqual(
    normalizeDatePeriod(
      {
        startDate: "2026-05-10",
        endDate: "2026-05-09",
      },
      "endDate"
    ),
    {
      startDate: "2026-05-08",
      endDate: "2026-05-09",
    }
  );
});

test("preserves single-day periods when the start date reaches the end date", () => {
  assert.deepEqual(
    normalizeDatePeriod(
      {
        startDate: "2026-05-25",
        endDate: "2026-05-25",
      },
      "startDate"
    ),
    {
      startDate: "2026-05-25",
      endDate: "2026-05-25",
    }
  );
});

test("preserves valid ranges as-is", () => {
  assert.deepEqual(
    normalizeDatePeriod(
      {
        startDate: "2026-05-01",
        endDate: "2026-05-25",
      },
      "endDate"
    ),
    {
      startDate: "2026-05-01",
      endDate: "2026-05-25",
    }
  );
});

test("returns error.invalidDate for malformed dates", () => {
  const errors = validateDatePeriod({ startDate: "not-a-date", endDate: "2026-05-25" });
  assert.equal(errors.startDate, "error.invalidDate");
  assert.equal(errors.endDate, undefined);
});

test("returns error.beforeEndDate when start is after end", () => {
  const errors = validateDatePeriod({ startDate: "2026-05-25", endDate: "2026-05-01" });
  assert.equal(errors.startDate, "error.beforeEndDate");
  assert.equal(errors.endDate, undefined);
});

test("returns no errors for a valid period", () => {
  const errors = validateDatePeriod({ startDate: "2026-05-01", endDate: "2026-05-25" });
  assert.deepEqual(errors, {});
});
