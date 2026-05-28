import assert from "node:assert/strict";
import test from "node:test";

// This project runs tests with Node's built-in runner, so this file covers only
// pure helpers exported by WeatherChart. Rendering tests need a DOM environment.
import {
  buildChartRows,
  formatChartDateTick,
  formatTooltipDate,
  getForecastBoundaryDay,
  getHeatwaveFill,
  hasForecastData,
  getMonthBoundaryDays,
} from "./WeatherChart";

function stripDiacritics(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

test("formats ISO chart dates as dd/mm/yy", () => {
  assert.equal(formatChartDateTick("2026-05-25"), "25/05/26");
  assert.equal(formatChartDateTick("1999-12-01"), "01/12/99");
});

test("returns the input unchanged when the chart tick is not an ISO date", () => {
  assert.equal(formatChartDateTick("3"), "3");
  assert.equal(formatChartDateTick(3), "3");
});

test("formats tooltip dates as readable french dates without day number", () => {
  assert.equal(formatTooltipDate("2025-05-18"), "18 mai");
  assert.equal(stripDiacritics(formatTooltipDate("1999-12-01")), "1 decembre");
});

test("extracts month boundary days from chart rows", () => {
  assert.deepEqual(
    getMonthBoundaryDays([
      { day: 1, label: "2026-01-01", tickLabel: "01/01/26" },
      { day: 2, label: "2026-01-02", tickLabel: "02/01/26" },
      { day: 31, label: "2026-01-31", tickLabel: "31/01/26" },
      { day: 32, label: "2026-02-01", tickLabel: "01/02/26" },
      { day: 33, label: "2026-02-02", tickLabel: "02/02/26" },
    ]),
    [1, 32]
  );
});

test("uses red for canicules and orange for heatwaves", () => {
  assert.equal(getHeatwaveFill("canicule"), "oklch(0.62 0.24 28)");
  assert.equal(getHeatwaveFill("vague_de_chaleur"), "oklch(0.74 0.18 62)");
});

test("buildChartRows reuses matching day labels and temperatures across datasets", () => {
  assert.deepEqual(
    buildChartRows(
      [
        {
          id: "current",
          label: "2025",
          offsetYears: 0,
          values: [
            {
              date: "2025-06-01",
              day: 1,
              year: 2025,
              tmax: 30,
              tmin: 18,
              isForecast: false,
            },
            {
              date: "2025-06-03",
              day: 3,
              year: 2025,
              tmax: 24,
              tmin: 15,
              isForecast: true,
            },
          ],
        },
        {
          id: "minus-1",
          label: "2024",
          offsetYears: 1,
          values: [
            {
              date: "2024-06-01",
              day: 1,
              year: 2024,
              tmax: 28,
              tmin: 17,
              isForecast: false,
            },
            {
              date: "2024-06-02",
              day: 2,
              year: 2024,
              tmax: 26,
              tmin: 16,
              isForecast: false,
            },
          ],
        },
      ],
      "tmax",
      [{ day: 2, value: 27 }]
    ),
    [
      {
        day: 1,
        label: "2025-06-01",
        tickLabel: "01/06/25",
        normal: null,
        currentObserved: 30,
        currentForecast: null,
        "minus-1": 28,
      },
      {
        day: 2,
        label: "2024-06-02",
        tickLabel: "02/06/24",
        normal: 27,
        currentObserved: null,
        currentForecast: null,
        "minus-1": 26,
      },
    ]
  );
});

test("buildChartRows bridges the forecast segment from the last observed current-day value", () => {
  assert.deepEqual(
    buildChartRows(
      [
        {
          id: "current",
          label: "2025",
          offsetYears: 0,
          values: [
            {
              date: "2025-06-01",
              day: 1,
              year: 2025,
              tmax: 30,
              tmin: 18,
              isForecast: false,
            },
            {
              date: "2025-06-02",
              day: 2,
              year: 2025,
              tmax: 28,
              tmin: 17,
              isForecast: true,
            },
            {
              date: "2025-06-03",
              day: 3,
              year: 2025,
              tmax: 26,
              tmin: 16,
              isForecast: true,
            },
          ],
        },
      ],
      "tmax"
    ),
    [
      {
        day: 1,
        label: "2025-06-01",
        tickLabel: "01/06/25",
        normal: null,
        currentObserved: 30,
        currentForecast: 30,
      },
      {
        day: 2,
        label: "2025-06-02",
        tickLabel: "02/06/25",
        normal: null,
        currentObserved: null,
        currentForecast: 28,
      },
      {
        day: 3,
        label: "2025-06-03",
        tickLabel: "03/06/25",
        normal: null,
        currentObserved: null,
        currentForecast: 26,
      },
    ]
  );
});

test("returns the first forecast boundary day for the current dataset", () => {
  assert.equal(
    getForecastBoundaryDay([
      {
        id: "current",
        label: "2025",
        offsetYears: 0,
        values: [
          {
            date: "2025-06-01",
            day: 1,
            year: 2025,
            tmax: 30,
            tmin: 18,
            isForecast: false,
          },
          {
            date: "2025-06-02",
            day: 2,
            year: 2025,
            tmax: 28,
            tmin: 17,
            isForecast: true,
          },
        ],
      },
    ]),
    2
  );
});

test("detects when the current year dataset includes forecast values", () => {
  assert.equal(
    hasForecastData([
      {
        id: "current",
        label: "2025",
        offsetYears: 0,
        values: [
          {
            date: "2025-06-01",
            day: 1,
            year: 2025,
            tmax: 30,
            tmin: 18,
            isForecast: false,
          },
          {
            date: "2025-06-02",
            day: 2,
            year: 2025,
            tmax: 28,
            tmin: 17,
            isForecast: true,
          },
        ],
      },
    ]),
    true
  );

  assert.equal(
    hasForecastData([
      {
        id: "current",
        label: "2025",
        offsetYears: 0,
        values: [
          {
            date: "2025-06-01",
            day: 1,
            year: 2025,
            tmax: 30,
            tmin: 18,
            isForecast: false,
          },
        ],
      },
    ]),
    false
  );
});
