import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

// This project runs tests with Node's built-in runner, so this file covers only
// pure helpers exported by WeatherChart. Rendering tests need a DOM environment.
import {
  buildChartRows,
  formatChartDateTick,
  formatExtremeTooltipLabel,
  formatTooltipDate,
  getCurrentSeriesAnimation,
  getExtremeAreaSegments,
  getTooltipExtremeEntries,
  getDisplayedForecastBoundaryDay,
  getForecastBoundaryDay,
  getHeatwaveFill,
  getTodayBoundaryDay,
  getMonthBoundaryDays,
  getNormalsLineConfig,
  sortTooltipEntries,
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

test("formats extreme tooltip labels with severity and dataset year", () => {
  assert.equal(formatExtremeTooltipLabel("canicule", "2022", "fr"), "Canicule • 2022");
  assert.equal(formatExtremeTooltipLabel("vague_de_froid", "2021", "fr"), "Vague de froid • 2021");
  assert.equal(formatExtremeTooltipLabel("grand_froid", "2020", "en"), "Severe cold • 2020");
});

test("sorts tooltip entries from highest to lowest temperature", () => {
  assert.deepEqual(
    sortTooltipEntries([
      { dataKey: "minus-1", graphicalItemId: "minus-1", name: "2024", value: 24.1 },
      { dataKey: "currentObserved", graphicalItemId: "currentObserved", name: "2025", value: 30.5 },
      { dataKey: "normal", graphicalItemId: "normal", name: "Normal 1991-2020", value: 27.2 },
      { dataKey: "currentForecast", graphicalItemId: "currentForecast", name: "2025 forecast", value: 30.5 },
    ]).map((entry) => entry.dataKey),
    ["currentObserved", "currentForecast", "normal", "minus-1"]
  );
});

test("returns active extreme events for the hovered day", () => {
  assert.deepEqual(
    getTooltipExtremeEntries(
      12,
      [
        {
          averageMax: 35.2,
          datasetId: "minus-3",
          datasetLabel: "2022",
          duration: 4,
          end: "2022-08-13",
          endDay: 13,
          forecastStartDay: null,
          includesForecast: false,
          kind: "canicule",
          start: "2022-08-10",
          startDay: 10,
        },
      ],
      [
        {
          averageMin: -8.4,
          datasetId: "minus-1",
          datasetLabel: "2024",
          duration: 3,
          end: "2024-01-12",
          endDay: 12,
          forecastStartDay: null,
          includesForecast: false,
          kind: "vague_de_froid",
          start: "2024-01-10",
          startDay: 10,
        },
      ],
      "fr"
    ),
    [
      {
        color: "oklch(0.62 0.24 28)",
        key: "heat-minus-3-2022-08-10",
        label: "Canicule • 2022",
      },
      {
        color: "oklch(0.68 0.18 230)",
        key: "cold-minus-1-2024-01-10",
        label: "Vague de froid • 2024",
      },
    ]
  );
});

test("ignores extreme events that do not cover the hovered day", () => {
  assert.deepEqual(
    getTooltipExtremeEntries(
      20,
      [
        {
          averageMax: 35.2,
          datasetId: "minus-3",
          datasetLabel: "2022",
          duration: 4,
          end: "2022-08-13",
          endDay: 13,
          forecastStartDay: null,
          includesForecast: false,
          kind: "canicule",
          start: "2022-08-10",
          startDay: 10,
        },
      ],
      [],
      "fr"
    ),
    []
  );
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

test("returns today's chart day when today is within the displayed range", () => {
  assert.equal(
    getTodayBoundaryDay(
      [
        { day: 1, label: "2026-05-01", tickLabel: "01/05/26" },
        { day: 2, label: "2026-05-02", tickLabel: "02/05/26" },
        { day: 3, label: "2026-05-03", tickLabel: "03/05/26" },
      ],
      "2026-05-02"
    ),
    2
  );
});

test("returns null when today is outside the displayed range", () => {
  assert.equal(
    getTodayBoundaryDay(
      [
        { day: 1, label: "2026-05-01", tickLabel: "01/05/26" },
        { day: 2, label: "2026-05-02", tickLabel: "02/05/26" },
      ],
      "2026-05-03"
    ),
    null
  );
});

test("uses red for canicules and orange for heatwaves", () => {
  assert.equal(getHeatwaveFill("canicule"), "oklch(0.62 0.24 28)");
  assert.equal(getHeatwaveFill("vague_de_chaleur"), "oklch(0.74 0.18 62)");
});

test("splits a mixed extreme area at the displayed forecast boundary day", () => {
  assert.deepEqual(
    getExtremeAreaSegments({
      startDay: 10,
      endDay: 14,
      includesForecast: true,
      forecastStartDay: 12,
    }),
    [
      { x1: 10, x2: 11, isForecast: false },
      { x1: 11, x2: 14, isForecast: true },
    ]
  );
});

test("returns a single forecast segment for a forecast-only extreme area", () => {
  assert.deepEqual(
    getExtremeAreaSegments({
      startDay: 10,
      endDay: 14,
      includesForecast: true,
      forecastStartDay: 10,
    }),
    [{ x1: 10, x2: 14, isForecast: true }]
  );
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

test("hides the forecast boundary when it overlaps today", () => {
  assert.equal(getDisplayedForecastBoundaryDay(3, 3), null);
  assert.equal(getDisplayedForecastBoundaryDay(3, 4), 4);
  assert.equal(getDisplayedForecastBoundaryDay(null, 4), 4);
});

test("delays the forecast animation until the observed segment is fully drawn", () => {
  assert.deepEqual(
    getCurrentSeriesAnimation({
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
          tmax: 29,
          tmin: 17,
          isForecast: false,
        },
        {
          date: "2025-06-03",
          day: 3,
          year: 2025,
          tmax: 28,
          tmin: 16,
          isForecast: true,
        },
      ],
    }),
    {
      observedDuration: 1000,
      forecastBegin: 1000,
      forecastDuration: 500,
    }
  );
});

test("starts the forecast animation immediately when the selected period has no observed segment", () => {
  assert.deepEqual(
    getCurrentSeriesAnimation({
      id: "current",
      label: "2025",
      offsetYears: 0,
      values: [
        {
          date: "2025-06-03",
          day: 3,
          year: 2025,
          tmax: 28,
          tmin: 16,
          isForecast: true,
        },
        {
          date: "2025-06-04",
          day: 4,
          year: 2025,
          tmax: 27,
          tmin: 15,
          isForecast: true,
        },
      ],
    }),
    {
      observedDuration: 0,
      forecastBegin: 0,
      forecastDuration: 1500,
    }
  );
});

test("keeps the climate normals line dashed from the first frame", () => {
  assert.deepEqual(getNormalsLineConfig(), {
    isAnimationActive: false,
    strokeDasharray: "6 5",
    strokeWidth: 2,
  });
});

test("disables the recharts accessibility focus layer on the main chart", () => {
  const source = readFileSync(
    path.join(process.cwd(), "src/features/weather/components/chart/WeatherChart.tsx"),
    "utf8"
  );

  assert.equal(source.includes("accessibilityLayer={false}"), true);
});
