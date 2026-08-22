import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_CONCURRENT_WEATHER_REQUESTS,
  normalizeComparisonOffsets,
  normalizeWeatherOffsets,
} from "./workloadLimits";

test("normalizes every comparison offset without limiting the selection", () => {
  const offsets = [12, 4, 1, 3, 9, 8, 7, 6, 5, 2, 11, 10, 0, -1, 3];

  assert.deepEqual(normalizeComparisonOffsets(offsets), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
});

test("normalizes every weather offset while preserving request order", () => {
  const offsets = [0, 4, 2, 4, 1, 3, 5, 6, 7, 8, 9, 10, 11];

  assert.equal(MAX_CONCURRENT_WEATHER_REQUESTS, 6);
  assert.deepEqual(normalizeWeatherOffsets(offsets), [0, 4, 2, 1, 3, 5, 6, 7, 8, 9, 10, 11]);
});
