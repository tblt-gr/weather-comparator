import assert from "node:assert/strict";
import { mock, test } from "node:test";

import {
  fetchClimateNormalsRange,
  fetchHistoricalWeather,
  searchCities,
} from "./openMeteo";

const baseCity = {
  id: "1",
  name: "Paris",
  latitude: 48.85,
  longitude: 2.35,
  country: "France",
};

test("searchCities returns no result and does not call fetch for short queries", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () => new Response());

  assert.deepEqual(await searchCities(" p "), []);
  assert.equal(fetchMock.mock.callCount(), 0);

  mock.restoreAll();
});

test("searchCities trims the query and maps geocoding results", async () => {
  mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    const url = String(input);
    assert.match(url, /name=Paris/);

    return new Response(
      JSON.stringify({
        results: [
          {
            id: 123,
            name: "Paris",
            latitude: 48.8566,
            longitude: 2.3522,
            country: "France",
            admin1: "Ile-de-France",
          },
        ],
      })
    );
  });

  assert.deepEqual(await searchCities("  Paris  "), [
    {
      id: "123",
      name: "Paris",
      latitude: 48.8566,
      longitude: 2.3522,
      country: "France",
      admin1: "Ile-de-France",
    },
  ]);

  mock.restoreAll();
});

test("searchCities forwards the abort signal to fetch", async () => {
  const signal = new AbortController().signal;

  mock.method(globalThis, "fetch", async (_input: string | URL | Request, init?: RequestInit) => {
    assert.equal(init?.signal, signal);
    return new Response(JSON.stringify({ results: [] }));
  });

  await searchCities("Paris", signal);

  mock.restoreAll();
});

test("fetchHistoricalWeather returns an empty payload when the shifted range is unavailable", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () => new Response());

  const response = await fetchHistoricalWeather({
    city: baseCity,
    offsetYears: 1,
    period: {
      startDate: "1940-01-01",
      endDate: "1940-01-03",
    },
  });

  assert.deepEqual(response, {
    daily: {
      time: [],
      temperature_2m_max: [],
      temperature_2m_min: [],
    },
  });
  assert.equal(fetchMock.mock.callCount(), 0);

  mock.restoreAll();
});

test("fetchClimateNormalsRange uses 2021 as the end year for cross-year periods", async () => {
  mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    const url = new URL(String(input));
    assert.equal(url.searchParams.get("start_date"), "1991-12-15");
    assert.equal(url.searchParams.get("end_date"), "2021-01-10");

    return new Response(JSON.stringify({ daily: { time: [] } }));
  });

  await fetchClimateNormalsRange({
    city: baseCity,
    period: {
      startDate: "2025-12-15",
      endDate: "2026-01-10",
    },
  });

  mock.restoreAll();
});

test("fetchClimateNormalsRange keeps 2020 as the end year for single-day periods", async () => {
  mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    const url = new URL(String(input));
    assert.equal(url.searchParams.get("start_date"), "1991-12-31");
    assert.equal(url.searchParams.get("end_date"), "2020-12-31");

    return new Response(JSON.stringify({ daily: { time: [] } }));
  });

  await fetchClimateNormalsRange({
    city: baseCity,
    period: {
      startDate: "2025-12-31",
      endDate: "2025-12-31",
    },
  });

  mock.restoreAll();
});

test("fetchClimateNormalsRange surfaces the API reason when the request fails", async () => {
  mock.method(globalThis, "fetch", async () =>
    new Response(JSON.stringify({ reason: "Out of range" }), { status: 400 })
  );

  await assert.rejects(
    () =>
      fetchClimateNormalsRange({
        city: baseCity,
        period: {
          startDate: "2025-05-01",
          endDate: "2025-05-25",
        },
      }),
    (err: Error) => {
      assert.equal(err.message, "Out of range");
      return true;
    }
  );

  mock.restoreAll();
});

test("fetchHistoricalWeather forwards the abort signal to fetch", async () => {
  const signal = new AbortController().signal;

  mock.method(globalThis, "fetch", async (_input: string | URL | Request, init?: RequestInit) => {
    assert.equal(init?.signal, signal);
    return new Response(JSON.stringify({ daily: { time: [] } }));
  });

  await fetchHistoricalWeather({
    city: baseCity,
    offsetYears: 0,
    period: {
      startDate: "2025-05-01",
      endDate: "2025-05-25",
    },
    signal,
  });

  mock.restoreAll();
});

test("fetchClimateNormalsRange forwards the abort signal to fetch", async () => {
  const signal = new AbortController().signal;

  mock.method(globalThis, "fetch", async (_input: string | URL | Request, init?: RequestInit) => {
    assert.equal(init?.signal, signal);
    return new Response(JSON.stringify({ daily: { time: [] } }));
  });

  await fetchClimateNormalsRange({
    city: baseCity,
    period: {
      startDate: "2025-05-01",
      endDate: "2025-05-25",
    },
    signal,
  });

  mock.restoreAll();
});
