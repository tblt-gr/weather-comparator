import assert from "node:assert/strict";
import test from "node:test";

import type { OpenMeteoArchiveResponse } from "@/features/weather/api/openMeteo";

import {
  addForecastDays,
  buildForecastOutlook,
  formatWindCardinal,
  getUvRiskLevel,
  getWeatherCondition,
} from "./forecastOutlook";

for (const availableDays of [0, 3, 7, 10, 14, 15]) {
  test(`buildForecastOutlook omits empty dates after ${availableDays} forecast days`, () => {
    const today = "2026-09-05";
    const time = Array.from({ length: 15 }, (_, index) => addForecastDays(today, index));
    const days = buildForecastOutlook({
      response: {
        daily: {
          time,
          temperature_2m_max: time.map((_, index) => (index < availableDays ? 20 : null)),
          temperature_2m_min: time.map((_, index) => (index < availableDays ? 10 : null)),
          weather_code: time.map((_, index) => (index < availableDays ? 0 : null)),
        },
      },
      period: { startDate: today, endDate: time[14] },
      today,
      horizonDays: 15,
    });

    assert.deepEqual(days.map((day) => day.date), time.slice(0, availableDays));
  });
}

test("buildForecastOutlook keeps partial forecasts and zero values, but drops missing values", () => {
  const days = buildForecastOutlook({
    response: {
      daily: {
        time: ["2026-09-05", "2026-09-06", "2026-09-07", "2026-09-08", "2026-09-09"],
        temperature_2m_max: [0, null, null, Number.NaN],
        weather_code: [null, 0],
        precipitation_sum: [null, null, 0],
      },
    },
    period: { startDate: "2026-09-05", endDate: "2026-09-19" },
    today: "2026-09-05",
    horizonDays: 15,
  });

  assert.deepEqual(days.map((day) => day.date), ["2026-09-05", "2026-09-06", "2026-09-07"]);
  assert.equal(days[0].tmax, 0);
  assert.equal(days[1].condition.kind, "clear");
  assert.equal(days[2].precipitationSum, 0);
});

test("getWeatherCondition maps WMO codes to the matching weather kind", () => {
  assert.equal(getWeatherCondition(0).kind, "clear");
  assert.equal(getWeatherCondition(1).kind, "mainly_clear");
  assert.equal(getWeatherCondition(2).kind, "partly_cloudy");
  assert.equal(getWeatherCondition(3).kind, "overcast");
  assert.equal(getWeatherCondition(45).kind, "fog");
  assert.equal(getWeatherCondition(48).kind, "fog");
  assert.equal(getWeatherCondition(51).kind, "drizzle");
  assert.equal(getWeatherCondition(56).kind, "freezing_drizzle");
  assert.equal(getWeatherCondition(61).kind, "rain");
  assert.equal(getWeatherCondition(66).kind, "freezing_rain");
  assert.equal(getWeatherCondition(71).kind, "snow");
  assert.equal(getWeatherCondition(77).kind, "snow_grains");
  assert.equal(getWeatherCondition(80).kind, "rain_showers");
  assert.equal(getWeatherCondition(85).kind, "snow_showers");
  assert.equal(getWeatherCondition(95).kind, "thunderstorm");
  assert.equal(getWeatherCondition(99).kind, "thunderstorm_hail");
  assert.equal(getWeatherCondition(null).kind, "unknown");
  assert.equal(getWeatherCondition(123).kind, "unknown");
});

function forecastResponse(): OpenMeteoArchiveResponse {
  return {
    daily: {
      time: [
        "2026-09-05",
        "2026-09-06",
        "2026-09-07",
        "2026-09-08",
        "2026-09-09",
        "2026-09-10",
        "2026-09-11",
        "2026-09-12",
        "2026-09-13",
        "2026-09-19",
      ],
      weather_code: [0, 2, 3, 61, 95, 3, 61, 1, 2, 3],
      temperature_2m_max: [24, 29, 26, 19, 21, 22, 20, 23, 24, 18],
      temperature_2m_min: [16, 15, 19, 15, 13, 11, 14, 14, 15, 12],
      precipitation_sum: [0, 0, 0, 1.8, 4.2, 0, 2.1, 0, 0, 0],
      precipitation_probability_max: [10, 3, 5, 48, 80, 10, 15, 5, 8, 20],
      uv_index_max: [5.5, 5.5, 5.4, 3.3, 5.2, 2.9, 2.1, 4, 4.2, 3],
      wind_speed_10m_max: [12, 10, 15, 10, 18, 9, 14, 11, 12, 16],
      wind_gusts_10m_max: [29, 23, 38, 26, 45, 26, 35, 24, 28, 40],
      wind_direction_10m_dominant: [311, 111, 265, 246, 288, 260, 232, 200, 180, 90],
      relative_humidity_2m_mean: [59, 48, 60, 73, 66, 61, 76, 55, 50, 70],
    },
  };
}

test("buildForecastOutlook returns no days when the selected period has no upcoming forecast", () => {
  assert.deepEqual(
    buildForecastOutlook({
      response: forecastResponse(),
      period: { startDate: "2026-07-01", endDate: "2026-07-15" },
      today: "2026-09-05",
      horizonDays: 7,
    }),
    []
  );
});

test("buildForecastOutlook keeps only days inside the selected period and the 7-day horizon", () => {
  const days = buildForecastOutlook({
    response: forecastResponse(),
    period: { startDate: "2026-09-01", endDate: "2026-09-20" },
    today: "2026-09-05",
    horizonDays: 7,
  });

  assert.deepEqual(
    days.map((day) => day.date),
    [
      "2026-09-05",
      "2026-09-06",
      "2026-09-07",
      "2026-09-08",
      "2026-09-09",
      "2026-09-10",
      "2026-09-11",
    ]
  );
  assert.equal(days[0]?.condition.kind, "clear");
  assert.equal(days[3]?.condition.kind, "rain");
  assert.equal(days[4]?.condition.kind, "thunderstorm");
  assert.equal(days[0]?.tmax, 24);
  assert.equal(days[0]?.tmin, 16);
  assert.equal(days[3]?.precipitationSum, 1.8);
  assert.equal(days[3]?.precipitationProbability, 48);
});

test("buildForecastOutlook extends to 15 days when the horizon and period allow it", () => {
  const days = buildForecastOutlook({
    response: forecastResponse(),
    period: { startDate: "2026-09-01", endDate: "2026-09-20" },
    today: "2026-09-05",
    horizonDays: 15,
  });

  assert.deepEqual(
    days.map((day) => day.date),
    [
      "2026-09-05",
      "2026-09-06",
      "2026-09-07",
      "2026-09-08",
      "2026-09-09",
      "2026-09-10",
      "2026-09-11",
      "2026-09-12",
      "2026-09-13",
      "2026-09-19",
    ]
  );
});

test("getUvRiskLevel follows the WHO / Meteo-France UV index bands", () => {
  assert.equal(getUvRiskLevel(null), null);
  assert.equal(getUvRiskLevel(Number.NaN), null);
  assert.equal(getUvRiskLevel(-0.2), null);
  assert.equal(getUvRiskLevel(0), "low");
  assert.equal(getUvRiskLevel(2), "low");
  assert.equal(getUvRiskLevel(2.4), "low");
  assert.equal(getUvRiskLevel(2.5), "moderate");
  assert.equal(getUvRiskLevel(5), "moderate");
  assert.equal(getUvRiskLevel(5.5), "high");
  assert.equal(getUvRiskLevel(7), "high");
  assert.equal(getUvRiskLevel(7.5), "very_high");
  assert.equal(getUvRiskLevel(10), "very_high");
  assert.equal(getUvRiskLevel(10.5), "extreme");
  assert.equal(getUvRiskLevel(14), "extreme");
});

test("formatWindCardinal maps degrees onto eight compass points", () => {
  assert.equal(formatWindCardinal(0), "N");
  assert.equal(formatWindCardinal(45), "NE");
  assert.equal(formatWindCardinal(90), "E");
  assert.equal(formatWindCardinal(180), "S");
  assert.equal(formatWindCardinal(225), "SW");
  assert.equal(formatWindCardinal(311), "NW");
  assert.equal(formatWindCardinal(null), null);
});

test("buildForecastOutlook clips to the selected period when it ends before the horizon", () => {
  const days = buildForecastOutlook({
    response: forecastResponse(),
    period: { startDate: "2026-09-05", endDate: "2026-09-07" },
    today: "2026-09-05",
    horizonDays: 15,
  });

  assert.deepEqual(
    days.map((day) => day.date),
    ["2026-09-05", "2026-09-06", "2026-09-07"]
  );
});
