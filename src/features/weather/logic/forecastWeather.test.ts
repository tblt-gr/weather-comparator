import assert from "node:assert/strict";
import test from "node:test";

import type { OpenMeteoArchiveResponse } from "@/features/weather/api";

import {
  getForecastDateRangeForPeriod,
  mergeArchiveAndForecastWeather,
} from "./forecastWeather";

test("getForecastDateRangeForPeriod returns today when the selected period ends today", () => {
  assert.deepEqual(
    getForecastDateRangeForPeriod({
      period: {
        startDate: "2025-05-01",
        endDate: "2025-05-25",
      },
      today: "2025-05-25",
    }),
    {
      startDate: "2025-05-25",
      endDate: "2025-05-25",
    }
  );
});

test("getForecastDateRangeForPeriod returns the future slice starting today", () => {
  assert.deepEqual(
    getForecastDateRangeForPeriod({
      period: {
        startDate: "2025-05-20",
        endDate: "2025-05-30",
      },
      today: "2025-05-25",
    }),
    {
      startDate: "2025-05-25",
      endDate: "2025-05-30",
    }
  );
});

test("mergeArchiveAndForecastWeather preserves forecast precedence and markers on overlapping days", () => {
  const archive: OpenMeteoArchiveResponse = {
    daily: {
      time: ["2025-05-24", "2025-05-25", "2025-05-26"],
      temperature_2m_max: [23, 24, 25],
      temperature_2m_min: [14, 15, 16],
    },
  };
  const forecast: OpenMeteoArchiveResponse = {
    daily: {
      time: ["2025-05-26", "2025-05-27"],
      temperature_2m_max: [99, 27],
      temperature_2m_min: [99, 17],
    },
  };

  assert.deepEqual(mergeArchiveAndForecastWeather({ archive, forecast }), {
    daily: {
      time: ["2025-05-24", "2025-05-25", "2025-05-26", "2025-05-27"],
      temperature_2m_max: [23, 24, 99, 27],
      temperature_2m_min: [14, 15, 99, 17],
      is_forecast: [false, false, true, true],
    },
  });
});
