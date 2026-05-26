import assert from "node:assert/strict";
import test from "node:test";

import { aggregateWeatherQueryErrors, getWeatherQueryKey } from "./useWeatherData";

test("getWeatherQueryKey only depends on the city id, period and offset", () => {
  const period = {
    startDate: "2025-05-01",
    endDate: "2025-05-25",
  };

  assert.deepEqual(
    getWeatherQueryKey(
      {
        id: "paris",
        name: "Paris",
        latitude: 48.8566,
        longitude: 2.3522,
        country: "France",
      },
      period,
      2
    ),
    ["weather", "paris", "2025-05-01", "2025-05-25", 2]
  );

  assert.deepEqual(
    getWeatherQueryKey(
      {
        id: "paris",
        name: "Paris",
        latitude: 48.9,
        longitude: 2.4,
        country: "France",
      },
      period,
      2
    ),
    ["weather", "paris", "2025-05-01", "2025-05-25", 2]
  );
});

test("aggregateWeatherQueryErrors preserves the offset that failed", () => {
  assert.equal(
    aggregateWeatherQueryErrors([
      { error: new Error("Missing archive"), offsetYears: 0 },
      { error: null, offsetYears: 1 },
      { error: "Unavailable", offsetYears: 3 },
    ]),
    "annee de reference: Missing archive | -3 ans: Unavailable"
  );
});
