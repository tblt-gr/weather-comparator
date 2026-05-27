import assert from "node:assert/strict";
import { mock, test } from "node:test";

import {
  aggregateWeatherQueryErrors,
  fetchWeatherDataset,
  getWeatherQueryKey,
  shouldIgnoreWeatherError,
} from "./useWeatherData";

const baseCity = {
  id: "paris",
  name: "Paris",
  latitude: 48.8566,
  longitude: 2.3522,
  country: "France",
};

test("getWeatherQueryKey includes the fetch strategy for the current year only", () => {
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
    ["weather", "paris", "2025-05-01", "2025-05-25", 2, "archive-only"]
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
    ["weather", "paris", "2025-05-01", "2025-05-25", 2, "archive-only"]
  );
});

test("getWeatherQueryKey marks the current year query as forecast-aware", () => {
  assert.deepEqual(
    getWeatherQueryKey(
      {
        id: "paris",
        name: "Paris",
        latitude: 48.8566,
        longitude: 2.3522,
        country: "France",
      },
      {
        startDate: "2025-05-01",
        endDate: "2025-05-25",
      },
      0
    ),
    ["weather", "paris", "2025-05-01", "2025-05-25", 0, "forecast-aware"]
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

test("shouldIgnoreWeatherError only suppresses forecast failures on the current year", () => {
  assert.equal(shouldIgnoreWeatherError({ stage: "forecast", offsetYears: 0 }), true);
  assert.equal(shouldIgnoreWeatherError({ stage: "archive", offsetYears: 0 }), false);
  assert.equal(shouldIgnoreWeatherError({ stage: "forecast", offsetYears: 2 }), false);
});

test("fetchWeatherDataset keeps archive-only data when the period does not extend into the future", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () =>
    new Response(
      JSON.stringify({
        daily: {
          time: ["2025-05-24", "2025-05-25"],
          temperature_2m_max: [22, 23],
          temperature_2m_min: [12, 13],
        },
      })
    )
  );

  const dataset = await fetchWeatherDataset({
    city: baseCity,
    offsetYears: 0,
    period: {
      startDate: "2025-05-24",
      endDate: "2025-05-25",
    },
    signal: new AbortController().signal,
    today: "2025-05-25",
  });

  assert.equal(fetchMock.mock.callCount(), 1);
  assert.deepEqual(
    dataset.values.map((value) => ({ date: value.date, isForecast: value.isForecast })),
    [
      { date: "2025-05-24", isForecast: false },
      { date: "2025-05-25", isForecast: false },
    ]
  );

  mock.restoreAll();
});

test("fetchWeatherDataset falls back to archive data when the forecast request fails", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    const url = String(input);

    if (url.startsWith("https://archive-api.open-meteo.com")) {
      return new Response(
        JSON.stringify({
          daily: {
            time: ["2025-05-24", "2025-05-25"],
            temperature_2m_max: [22, 23],
            temperature_2m_min: [12, 13],
          },
        })
      );
    }

    return new Response(JSON.stringify({ reason: "forecast unavailable" }), { status: 503 });
  });

  const dataset = await fetchWeatherDataset({
    city: baseCity,
    offsetYears: 0,
    period: {
      startDate: "2025-05-24",
      endDate: "2025-05-27",
    },
    signal: new AbortController().signal,
    today: "2025-05-25",
  });

  assert.equal(fetchMock.mock.callCount(), 2);
  assert.deepEqual(
    dataset.values.map((value) => ({
      date: value.date,
      tmax: value.tmax,
      isForecast: value.isForecast,
    })),
    [
      { date: "2025-05-24", tmax: 22, isForecast: false },
      { date: "2025-05-25", tmax: 23, isForecast: false },
    ]
  );

  mock.restoreAll();
});
