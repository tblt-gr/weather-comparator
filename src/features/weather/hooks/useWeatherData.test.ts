import assert from "node:assert/strict";
import { mock, test } from "node:test";

import {
  aggregateWeatherQueryErrors,
  fetchWeatherDataset,
  getWeatherQueryKey,
  mergeCurrentDatasetWithForecast,
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

test("fetchWeatherDataset uses forecast data for today on the current year dataset", async () => {
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

    return new Response(
      JSON.stringify({
        daily: {
          time: ["2025-05-25"],
          temperature_2m_max: [24],
          temperature_2m_min: [14],
        },
      })
    );
  });

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

  assert.equal(fetchMock.mock.callCount(), 2);
  assert.deepEqual(
    dataset.values.map((value) => ({
      date: value.date,
      tmax: value.tmax,
      isForecast: value.isForecast,
    })),
    [
      { date: "2025-05-24", tmax: 22, isForecast: false },
      { date: "2025-05-25", tmax: 24, isForecast: true },
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
  assert.equal(dataset.forecastFailed, true);
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

test("fetchWeatherDataset keeps future forecast days in the current year dataset", async () => {
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

    return new Response(
      JSON.stringify({
        daily: {
          time: ["2025-05-26", "2025-05-27"],
          temperature_2m_max: [24, 25],
          temperature_2m_min: [14, 15],
        },
      })
    );
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
      { date: "2025-05-26", tmax: 24, isForecast: true },
      { date: "2025-05-27", tmax: 25, isForecast: true },
    ]
  );

  mock.restoreAll();
});

test("mergeCurrentDatasetWithForecast updates the current dataset without blocking archive data", () => {
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
