import assert from "node:assert/strict";
import test from "node:test";

import type { City } from "@/types/weather";

import {
  decodeCityParam,
  encodeCityParam,
  parseCompareParam,
  parseWeatherUrlState,
  serializeWeatherUrlState,
} from "./urlState";

const paris: City = {
  id: "2988507",
  name: "Paris",
  latitude: 48.85341,
  longitude: 2.3488,
  country: "France",
  admin1: "Ile-de-France",
};

test("parseWeatherUrlState restores a valid full URL state", () => {
  const params = new URLSearchParams({
    city: encodeCityParam(paris),
    start: "2026-05-01",
    end: "2026-05-26",
    compare: "3,1,5",
    normals: "1",
    temp: "tmin",
  });

  assert.deepEqual(parseWeatherUrlState(params), {
    city: paris,
    period: {
      startDate: "2026-05-01",
      endDate: "2026-05-26",
    },
    comparisonOffsets: [1, 3, 5],
    showNormals: true,
    temperatureMode: "tmin",
  });
});

test("decodeCityParam ignores invalid payloads", () => {
  assert.equal(decodeCityParam("%7Binvalid"), null);
  assert.equal(
    decodeCityParam(
      encodeURIComponent(JSON.stringify({ id: "1", name: "Paris", country: "France" }))
    ),
    null
  );
});

test("parseWeatherUrlState ignores an invalid period and keeps valid partial fields", () => {
  const params = new URLSearchParams({
    city: encodeCityParam(paris),
    start: "bad-date",
    end: "2026-05-26",
    temp: "unknown",
  });

  assert.deepEqual(parseWeatherUrlState(params), {
    city: paris,
    temperatureMode: "tmax",
  });
});

test("parseCompareParam filters invalid and unavailable offsets", () => {
  assert.deepEqual(
    parseCompareParam("3,2,0,3,-1,999,foo", {
      endDate: "2026-05-26",
      startDate: "2026-05-01",
    }),
    [2, 3]
  );
});

test("serializeWeatherUrlState omits default values and canonicalizes compare ordering", () => {
  const params = serializeWeatherUrlState({
    city: paris,
    comparisonOffsets: [5, 3, 3, 1],
    period: {
      startDate: "2026-05-01",
      endDate: "2026-05-26",
    },
    showNormals: false,
    temperatureMode: "tmax",
  });

  assert.equal(params.get("city"), encodeCityParam(paris));
  assert.equal(params.get("start"), "2026-05-01");
  assert.equal(params.get("end"), "2026-05-26");
  assert.equal(params.get("compare"), "1,3,5");
  assert.equal(params.has("normals"), false);
  assert.equal(params.has("temp"), false);
});
