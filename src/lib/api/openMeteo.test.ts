import assert from "node:assert/strict";
import { mock, test } from "node:test";

import { fetchHistoricalWeather } from "./openMeteo";

const baseCity = {
  id: "1",
  name: "Paris",
  latitude: 48.85,
  longitude: 2.35,
  country: "France",
};

const basePeriod = { startDate: "2024-07-01", endDate: "2024-07-31" };

test("fetchHistoricalWeather throws error with API reason when response not ok", async () => {
  mock.method(globalThis, "fetch", async () =>
    new Response(JSON.stringify({ reason: "Parameter end_date is in the future" }), {
      status: 400,
    })
  );

  await assert.rejects(
    () => fetchHistoricalWeather({ city: baseCity, offsetYears: 0, period: basePeriod }),
    (err: Error) => {
      assert.equal(err.message, "Parameter end_date is in the future");
      return true;
    }
  );

  mock.restoreAll();
});

test("fetchHistoricalWeather throws generic error when response not ok and no reason", async () => {
  mock.method(globalThis, "fetch", async () =>
    new Response(JSON.stringify({}), { status: 500 })
  );

  await assert.rejects(
    () => fetchHistoricalWeather({ city: baseCity, offsetYears: 0, period: basePeriod }),
    (err: Error) => {
      assert.equal(err.message, "Weather fetch failed");
      return true;
    }
  );

  mock.restoreAll();
});
