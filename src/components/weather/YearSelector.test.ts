import assert from "node:assert/strict";
import test from "node:test";

import {
  canClearComparisonOffsets,
  formatComparisonOffsetLabel,
  keepDropdownMenuOpen,
} from "./YearSelector";

test("formats comparison offsets with the compared year in french", () => {
  const period = {
    startDate: "2026-05-01",
    endDate: "2026-05-25",
  };

  assert.equal(formatComparisonOffsetLabel(period, 1, "fr"), "-1 an (2025)");
  assert.equal(formatComparisonOffsetLabel(period, 2, "fr"), "-2 ans (2024)");
});

test("formats comparison offsets with the compared year in english", () => {
  const period = {
    startDate: "2026-05-01",
    endDate: "2026-05-25",
  };

  assert.equal(formatComparisonOffsetLabel(period, 1, "en"), "-1 year (2025)");
  assert.equal(formatComparisonOffsetLabel(period, 2, "en"), "-2 years (2024)");
});

test("formats comparison offsets with the compared year range", () => {
  const period = {
    startDate: "2025-12-15",
    endDate: "2026-01-10",
  };

  assert.equal(formatComparisonOffsetLabel(period, 1, "fr"), "-1 an (2024-2025)");
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

test("enables the clear action whenever at least one offset is stored", () => {
  assert.equal(canClearComparisonOffsets([]), false);
  assert.equal(canClearComparisonOffsets([2]), true);
});
