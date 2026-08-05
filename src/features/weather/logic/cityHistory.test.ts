import assert from "node:assert/strict";
import test from "node:test";

import type { City } from "@/features/weather/types";

import { addCityToHistory, loadCityHistory } from "./cityHistory";

const storage = new Map<string, string>();
const originalWindow = globalThis.window;

function createCity(id: string): City {
  return {
    id,
    name: `City ${id}`,
    latitude: 48,
    longitude: 2,
    country: "France",
  };
}

test.beforeEach(() => {
  storage.clear();
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
      },
    },
  });
});

test.after(() => {
  if (originalWindow === undefined) {
    Reflect.deleteProperty(globalThis, "window");
    return;
  }

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: originalWindow,
  });
});

test("loadCityHistory returns an empty list for missing or invalid data", () => {
  assert.deepEqual(loadCityHistory(), []);

  storage.set("weather-compare.cityHistory", "{invalid-json");
  assert.deepEqual(loadCityHistory(), []);

  storage.set("weather-compare.cityHistory", JSON.stringify([{ id: "incomplete" }]));
  assert.deepEqual(loadCityHistory(), []);
});

test("loadCityHistory returns an empty list when localStorage is unavailable", () => {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem() {
          throw new Error("Storage unavailable");
        },
      },
    },
  });

  assert.deepEqual(loadCityHistory(), []);
});

test("addCityToHistory stores the most recent unique cities first", () => {
  const paris = createCity("paris");
  const lyon = createCity("lyon");

  addCityToHistory(paris);
  addCityToHistory(lyon);
  addCityToHistory(paris);

  assert.deepEqual(loadCityHistory(), [paris, lyon]);
});

test("addCityToHistory keeps at most five cities", () => {
  for (let index = 1; index <= 6; index += 1) {
    addCityToHistory(createCity(String(index)));
  }

  assert.deepEqual(
    loadCityHistory().map((city) => city.id),
    ["6", "5", "4", "3", "2"]
  );
});
