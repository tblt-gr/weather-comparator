import assert from "node:assert/strict";
import test from "node:test";

import type { City } from "@/features/weather/types";

import { getInitialWeatherState, loadPersistedCity, useWeatherStore } from "./weather-store";

const storage = new Map<string, string>();
const originalWindow = globalThis.window;
const originalDate = globalThis.Date;
const initialState = useWeatherStore.getState();

const baseCity: City = {
  id: "1",
  name: "Paris",
  latitude: 48.85,
  longitude: 2.35,
  country: "France",
};

function installWindowMock() {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem(key: string) {
          return storage.get(key) ?? null;
        },
        setItem(key: string, value: string) {
          storage.set(key, value);
        },
        removeItem(key: string) {
          storage.delete(key);
        },
      },
    },
  });
}

function resetStore() {
  useWeatherStore.setState({
    city: initialState.city,
    period: initialState.period,
    comparisonOffsets: [...initialState.comparisonOffsets],
    temperatureMode: initialState.temperatureMode,
    hiddenSeries: [...initialState.hiddenSeries],
    showNormals: initialState.showNormals,
  });
}

test.beforeEach(() => {
  storage.clear();
  installWindowMock();
  resetStore();
});

test.after(() => {
  globalThis.Date = originalDate;

  if (originalWindow === undefined) {
    Reflect.deleteProperty(globalThis, "window");
    return;
  }

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: originalWindow,
  });
});

test("loadPersistedCity returns null when storage is empty or invalid", () => {
  assert.equal(loadPersistedCity(), null);

  storage.set("weather-compare.city", "{invalid-json");

  assert.equal(loadPersistedCity(), null);
});

test("getInitialWeatherState does not read the persisted city during initial render", () => {
  storage.set("weather-compare.city", JSON.stringify(baseCity));

  const initialState = getInitialWeatherState();
  assert.equal(initialState.city, null);

  useWeatherStore.getState().setCity(null);

  assert.equal(useWeatherStore.getState().city, null);
  assert.equal(loadPersistedCity(), null);
});

test("getInitialWeatherState computes the default period from the current date at call time", () => {
  class MockDate extends Date {
    constructor(value?: string | number | Date) {
      super(value ?? "2026-05-26T12:00:00.000Z");
    }

    static now() {
      return new originalDate("2026-05-26T12:00:00.000Z").getTime();
    }
  }

  globalThis.Date = MockDate as DateConstructor;
  const firstPeriod = getInitialWeatherState().period;

  class NextDayDate extends Date {
    constructor(value?: string | number | Date) {
      super(value ?? "2026-05-27T12:00:00.000Z");
    }

    static now() {
      return new originalDate("2026-05-27T12:00:00.000Z").getTime();
    }
  }

  globalThis.Date = NextDayDate as DateConstructor;
  const secondPeriod = getInitialWeatherState().period;

  assert.deepEqual(firstPeriod, {
    startDate: "2026-05-11",
    endDate: "2026-06-10",
  });
  assert.deepEqual(secondPeriod, {
    startDate: "2026-05-12",
    endDate: "2026-06-11",
  });
});

test("setCity persists the city and clearing it removes the storage entry", () => {
  useWeatherStore.getState().setCity(baseCity);

  assert.deepEqual(loadPersistedCity(), baseCity);
  assert.deepEqual(useWeatherStore.getState().city, baseCity);

  useWeatherStore.getState().setCity(null);

  assert.equal(loadPersistedCity(), null);
  assert.equal(storage.has("weather-compare.city"), false);
});

test("toggleComparisonOffset keeps offsets sorted and unhides the related series", () => {
  useWeatherStore.setState({
    comparisonOffsets: [3, 1],
    hiddenSeries: ["minus-2", "current"],
  });

  useWeatherStore.getState().toggleComparisonOffset(2);

  assert.deepEqual(useWeatherStore.getState().comparisonOffsets, [1, 2, 3]);
  assert.deepEqual(useWeatherStore.getState().hiddenSeries, ["current"]);

  useWeatherStore.getState().toggleComparisonOffset(2);

  assert.deepEqual(useWeatherStore.getState().comparisonOffsets, [1, 3]);
});

test("clearComparisonOffsets removes compared periods and related hidden series", () => {
  useWeatherStore.setState({
    comparisonOffsets: [1, 3],
    hiddenSeries: ["minus-1", "current", "minus-3"],
  });

  useWeatherStore.getState().clearComparisonOffsets();

  assert.deepEqual(useWeatherStore.getState().comparisonOffsets, []);
  assert.deepEqual(useWeatherStore.getState().hiddenSeries, ["current"]);
});

test("hydrateFromUrl updates URL-managed fields atomically without touching hidden series", () => {
  useWeatherStore.setState({
    city: null,
    comparisonOffsets: [1],
    hiddenSeries: ["current"],
    period: {
      startDate: "2026-05-01",
      endDate: "2026-05-26",
    },
    showNormals: false,
    temperatureMode: "tmax",
  });

  useWeatherStore.getState().hydrateFromUrl({
    city: baseCity,
    comparisonOffsets: [3, 1],
    period: {
      startDate: "2025-06-01",
      endDate: "2025-06-30",
    },
    showNormals: true,
    temperatureMode: "tmin",
  });

  assert.deepEqual(useWeatherStore.getState().city, baseCity);
  assert.deepEqual(useWeatherStore.getState().period, {
    startDate: "2025-06-01",
    endDate: "2025-06-30",
  });
  assert.deepEqual(useWeatherStore.getState().comparisonOffsets, [1, 3]);
  assert.equal(useWeatherStore.getState().temperatureMode, "tmin");
  assert.equal(useWeatherStore.getState().showNormals, true);
  assert.deepEqual(useWeatherStore.getState().hiddenSeries, ["current"]);
  assert.deepEqual(loadPersistedCity(), baseCity);
});

test("toggleHiddenSeries adds and removes a series id", () => {
  useWeatherStore.getState().toggleHiddenSeries("current");
  assert.deepEqual(useWeatherStore.getState().hiddenSeries, ["current"]);

  useWeatherStore.getState().toggleHiddenSeries("current");
  assert.deepEqual(useWeatherStore.getState().hiddenSeries, []);
});
