import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  buildWeatherUrlSearch,
  shouldReplaceWeatherUrl,
} from "./useWeatherUrlState";

const source = readFileSync(
  path.join(process.cwd(), "src/features/weather/hooks/useWeatherUrlState.ts"),
  "utf8"
);

test("buildWeatherUrlSearch serializes canonical query params from store state", () => {
  const search = buildWeatherUrlSearch({
    city: {
      id: "2988507",
      name: "Paris",
      latitude: 48.85341,
      longitude: 2.3488,
      country: "France",
    },
    comparisonOffsets: [3, 1],
    period: {
      startDate: "2026-05-01",
      endDate: "2026-05-26",
    },
    showNormals: true,
    showForecast: true,
    temperatureMode: "tmin",
    forecastModel: "best_match",
  });

  assert.equal(
    search,
    "city=%257B%2522id%2522%253A%25222988507%2522%252C%2522name%2522%253A%2522Paris%2522%252C%2522lat%2522%253A48.85341%252C%2522lon%2522%253A2.3488%252C%2522country%2522%253A%2522France%2522%257D&start=2026-05-01&end=2026-05-26&compare=1%2C3&normals=1&temp=tmin"
  );
});

test("shouldReplaceWeatherUrl skips redundant URL rewrites", () => {
  assert.equal(shouldReplaceWeatherUrl("start=2026-05-01", "start=2026-05-01"), false);
  assert.equal(shouldReplaceWeatherUrl("start=2026-05-01", "start=2026-05-02"), true);
});

test("useWeatherUrlState uses router.replace with scroll disabled", () => {
  assert.equal(source.includes('router.replace(nextUrl, { scroll: false })'), true);
});
