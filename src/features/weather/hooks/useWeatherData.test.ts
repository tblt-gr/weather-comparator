import assert from "node:assert/strict";
import { mock, test } from "node:test";

import {
  aggregateWeatherQueryErrors,
  fetchWeatherDataset,
  getForecastQueryKey,
  getWeatherQueryKey,
  mergeCurrentDatasetWithForecast,
} from "./useWeatherData";

const baseCity = {
  id: "paris",
  name: "Paris",
  latitude: 48.8566,
  longitude: 2.3522,
  country: "France",
};

test("getWeatherQueryKey identifies an archive series by city, period and offset", () => {
  const period = {
    startDate: "2025-05-01",
    endDate: "2025-05-25",
  };

  assert.deepEqual(getWeatherQueryKey(baseCity, period, 2), [
    "weather",
    "paris",
    "2025-05-01",
    "2025-05-25",
    2,
  ]);

  assert.deepEqual(
    getWeatherQueryKey({ ...baseCity, latitude: 48.9, longitude: 2.4 }, period, 2),
    ["weather", "paris", "2025-05-01", "2025-05-25", 2]
  );
});

test("getForecastQueryKey carries the forecast model so only forecast refetches", () => {
  const period = {
    startDate: "2025-05-01",
    endDate: "2025-05-25",
  };

  assert.deepEqual(getForecastQueryKey(baseCity, period, "best_match"), [
    "weather-forecast",
    "paris",
    "2025-05-01",
    "2025-05-25",
    "best_match",
  ]);

  assert.deepEqual(getForecastQueryKey(baseCity, period, "meteofrance_seamless"), [
    "weather-forecast",
    "paris",
    "2025-05-01",
    "2025-05-25",
    "meteofrance_seamless",
  ]);
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

test("fetchWeatherDataset returns archive-only data and never fetches the forecast", async () => {
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

    throw new Error("forecast should not be fetched by fetchWeatherDataset");
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

  assert.equal(fetchMock.mock.callCount(), 1);
  assert.deepEqual(
    dataset.values.map((value) => ({
      date: value.date,
      tmax: value.tmax,
      isForecast: value.isForecast,
    })),
    [
      { date: "2025-05-24", tmax: 22, isForecast: false },
      { date: "2025-05-25", tmax: 23, isForecast: false },
      { date: "2025-05-26", tmax: null, isForecast: false },
      { date: "2025-05-27", tmax: null, isForecast: false },
    ]
  );

  mock.restoreAll();
});

test("fetchWeatherDataset normalizes a shifted comparison year over its own range", async () => {
  mock.method(globalThis, "fetch", async () =>
    new Response(
      JSON.stringify({
        daily: {
          time: ["2024-05-24", "2024-05-25"],
          temperature_2m_max: [18, 19],
          temperature_2m_min: [8, 9],
        },
      })
    )
  );

  const dataset = await fetchWeatherDataset({
    city: baseCity,
    offsetYears: 1,
    period: {
      startDate: "2025-05-24",
      endDate: "2025-05-25",
    },
    signal: new AbortController().signal,
    today: "2025-05-25",
  });

  assert.equal(dataset.offsetYears, 1);
  assert.deepEqual(
    dataset.values.map((value) => ({ date: value.date, tmax: value.tmax })),
    [
      { date: "2024-05-24", tmax: 18 },
      { date: "2024-05-25", tmax: 19 },
    ]
  );

  mock.restoreAll();
});

test("mergeCurrentDatasetWithForecast overlays forecast days on the reference dataset", () => {
  assert.deepEqual(
    mergeCurrentDatasetWithForecast({
      currentDataset: {
        id: "current",
        label: "2025-05-24 - 2025-05-27",
        offsetYears: 0,
        values: [
          {
            date: "2025-05-24",
            day: 1,
            year: 2025,
            tmax: 22,
            tmin: 12,
            isForecast: false,
          },
          {
            date: "2025-05-25",
            day: 2,
            year: 2025,
            tmax: 23,
            tmin: 13,
            isForecast: false,
          },
        ],
      },
      forecastResponse: {
        daily: {
          time: ["2025-05-25", "2025-05-26", "2025-05-27"],
          temperature_2m_max: [24, 25, 26],
          temperature_2m_min: [14, 15, 16],
        },
      },
      period: {
        startDate: "2025-05-24",
        endDate: "2025-05-27",
      },
    })?.values.map((value) => ({
      date: value.date,
      tmax: value.tmax,
      isForecast: value.isForecast,
    })),
    [
      { date: "2025-05-24", tmax: 22, isForecast: false },
      { date: "2025-05-25", tmax: 24, isForecast: true },
      { date: "2025-05-26", tmax: 25, isForecast: true },
      { date: "2025-05-27", tmax: 26, isForecast: true },
    ]
  );
});
