import assert from "node:assert/strict";
import test from "node:test";

import { formatComparisonOffsetLabel, keepDropdownMenuOpen } from "./YearSelector";

test("formats comparison offsets with the compared year", () => {
  const period = {
    startDate: "2026-05-01",
    endDate: "2026-05-25",
  };

  assert.equal(formatComparisonOffsetLabel(period, 1), "-1 an (2025)");
  assert.equal(formatComparisonOffsetLabel(period, 2), "-2 ans (2024)");
});

test("formats comparison offsets with the compared year range", () => {
  const period = {
    startDate: "2025-12-15",
    endDate: "2026-01-10",
  };

  assert.equal(formatComparisonOffsetLabel(period, 1), "-1 an (2024-2025)");
});

test("prevents the comparison period menu from closing after a selection", () => {
  let prevented = false;

  keepDropdownMenuOpen({
    preventDefault() {
      prevented = true;
    },
  });

  assert.equal(prevented, true);
});
