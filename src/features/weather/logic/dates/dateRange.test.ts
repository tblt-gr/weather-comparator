import assert from "node:assert/strict";
import test from "node:test";

import {
  formatDisplayDate,
  getAvailableComparisonOffsets,
  getComparableDateRange,
  getComparableDateRangeByOffset,
  getDefaultComparisonPeriod,
  getPeriodLabel,
} from "./dateRange";

test("formats an ISO date as dd/mm/yyyy", () => {
  assert.equal(formatDisplayDate("2026-06-18"), "18/06/2026");
});

test("builds a period label with dd/mm/yyyy dates", () => {
  assert.equal(
    getPeriodLabel({ startDate: "2026-06-01", endDate: "2026-06-18" }),
    "01/06/2026 - 18/06/2026"
  );
});

test("returns a 31-day default period centered on today", () => {
  const range = getDefaultComparisonPeriod(new Date("2026-05-28T12:00:00.000Z"));

  assert.deepEqual(range, {
    startDate: "2026-05-13",
    endDate: "2026-06-12",
  });
});

test("returns a compact default period starting 2 days before today", () => {
  const range = getDefaultComparisonPeriod(new Date("2026-05-28T12:00:00.000Z"), {
    compact: true,
  });

  assert.deepEqual(range, {
    startDate: "2026-05-26",
    endDate: "2026-06-12",
  });
});

test("clamps the current year comparison range to today", () => {
  const range = getComparableDateRange({
    period: {
      startDate: "2026-05-01",
      endDate: "2026-06-15",
    },
    today: "2026-05-25",
    year: 2026,
  });

  assert.deepEqual(range, {
    startDate: "2026-05-01",
    endDate: "2026-05-25",
  });
});

test("uses the same month and day range for previous years", () => {
  const range = getComparableDateRange({
    period: {
      startDate: "2026-05-01",
      endDate: "2026-06-15",
    },
    today: "2026-05-25",
    year: 2025,
  });

  assert.deepEqual(range, {
    startDate: "2025-05-01",
    endDate: "2025-06-15",
  });
});

test("shifts multi-year periods by comparison offset", () => {
  const range = getComparableDateRangeByOffset({
    offsetYears: 1,
    period: {
      startDate: "2024-11-15",
      endDate: "2025-02-10",
    },
    today: "2026-05-25",
  });

  assert.deepEqual(range, {
    startDate: "2023-11-15",
    endDate: "2024-02-10",
  });
});

test("limits comparison offsets to Open-Meteo historical data availability", () => {
  assert.deepEqual(
    getAvailableComparisonOffsets(
      {
        endDate: "2026-05-25",
        startDate: "2026-05-01",
      },
      "2026-05-25"
    ).slice(-3),
    [84, 85, 86]
  );

  assert.equal(
    getComparableDateRangeByOffset({
      offsetYears: 87,
      period: {
        startDate: "2026-05-01",
        endDate: "2026-05-25",
      },
      today: "2026-05-25",
    }),
    null
  );
});
