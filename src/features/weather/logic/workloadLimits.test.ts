import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_COMPARISON_OFFSETS,
  MAX_WEATHER_DATASETS,
  limitComparisonOffsets,
  limitWeatherOffsets,
} from "./workloadLimits";

test("limits comparison offsets to the available chart palette", () => {
  const offsets = [12, 4, 1, 3, 9, 8, 7, 6, 5, 2, 11, 10, 0, -1, 3];

  assert.equal(MAX_COMPARISON_OFFSETS, 9);
  assert.deepEqual(limitComparisonOffsets(offsets), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
});

test("caps weather datasets defensively while preserving request order", () => {
  const offsets = [0, 4, 2, 4, 1, 3, 5, 6, 7, 8, 9, 10, 11];

  assert.equal(MAX_WEATHER_DATASETS, 10);
  assert.deepEqual(limitWeatherOffsets(offsets), [0, 4, 2, 1, 3, 5, 6, 7, 8, 9]);
});
