import assert from "node:assert/strict";
import test from "node:test";

import { getComparableDateRange, getComparableDateRangeByOffset } from "./dateRange";

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
