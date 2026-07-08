import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

// This project runs tests with Node's built-in runner, so this file covers only
// pure helpers exported by WeatherChart. Rendering tests need a DOM environment.
import {
  buildChartRows,
  formatChartDateTick,
  formatExtremeDateRange,
  formatExtremeTooltipLabel,
  formatTooltipDate,
  getChartTickFontWeight,
  getCurrentForecastLineAnimation,
  getCurrentObservedLineAnimation,
  getCurrentSeriesAnimation,
  getFreshSeriesKeysFromSignatures,
  getSeriesAnimationDuration,
  getSeriesLineSignatures,
  getUniformDrawDuration,
  getSeriesLineKeysDependency,
  getSeriesLineKeys,
  getFreshSeriesKeys,
  getExtremeAreaSegments,
  getTooltipExtremeEntries,
  getTooltipTropicalNightEntries,
  getDisplayedForecastBoundaryDay,
  getForecastBoundaryDay,
  getHeatwaveFill,
  getTodayBoundaryDay,
  getMonthBoundaryDays,
  getNormalsLineConfig,
  getVisibleTooltipEntries,
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

test("formats an extreme date range, collapsing single-day events", () => {
  assert.equal(formatExtremeDateRange("2022-08-10", "2022-08-13"), "10/08/2022 - 13/08/2022");
  assert.equal(formatExtremeDateRange("2022-08-10", "2022-08-10"), "10/08/2022");
});

test("formats extreme tooltip labels with severity and detail", () => {
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

test("hides the current observed bridge point from tooltip entries", () => {
  assert.deepEqual(
    getVisibleTooltipEntries([
      {
        dataKey: "currentObserved",
        graphicalItemId: "currentObserved",
        name: "2025",
        payload: { day: 3 },
        value: 30.5,
      },
      {
        dataKey: "currentForecast",
        graphicalItemId: "currentForecast",
        name: "2025",
        payload: { day: 3 },
        value: 30.5,
      },
      {
        dataKey: "minus-1",
        graphicalItemId: "minus-1",
        name: "2024",
        payload: { day: 3 },
        value: 24.1,
      },
    ]).map((entry) => entry.dataKey),
    ["currentForecast", "minus-1"]
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
        label: "Canicule • 10/08/2022 - 13/08/2022",
      },
      {
        color: "oklch(0.68 0.18 230)",
        key: "cold-minus-1-2024-01-10",
        label: "Vague de froid • 10/01/2024 - 12/01/2024",
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

test("returns a tropical night entry per dataset whose night stays at or above 20 on the hovered day", () => {
  assert.deepEqual(
    getTooltipTropicalNightEntries(
      2,
      [
        {
          id: "current",
          label: "2025",
          offsetYears: 0,
          values: [
            { date: "2025-07-01", day: 1, year: 2025, tmax: 31, tmin: 19, isForecast: false },
            { date: "2025-07-02", day: 2, year: 2025, tmax: 33, tmin: 21, isForecast: false },
          ],
        },
        {
          id: "minus-1",
          label: "2024",
          offsetYears: 1,
          values: [
            { date: "2024-07-02", day: 2, year: 2024, tmax: 30, tmin: 20, isForecast: false },
          ],
        },
        {
          id: "minus-2",
          label: "2023",
          offsetYears: 2,
          values: [
            { date: "2023-07-02", day: 2, year: 2023, tmax: 28, tmin: 18, isForecast: false },
          ],
        },
      ],
      { current: "#aaa", "minus-1": "#bbb", "minus-2": "#ccc" },
      "Nuit tropicale"
    ),
    [
      { color: "#aaa", key: "tropical-night-current", label: "Nuit tropicale" },
      { color: "#bbb", key: "tropical-night-minus-1", label: "Nuit tropicale" },
    ]
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

test("uses a bold font weight only for today's x-axis tick", () => {
  assert.equal(getChartTickFontWeight(3, 3), 700);
  assert.equal(getChartTickFontWeight("3", 3), 700);
  assert.equal(getChartTickFontWeight(2, 3), 400);
  assert.equal(getChartTickFontWeight(3, null), 400);
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
      { x1: 10, x2: 12, isForecast: false },
      { x1: 12, x2: 14, isForecast: true },
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

test("buildChartRows bridges the forecast segment from the first forecast current-day value", () => {
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
        currentForecast: null,
      },
      {
        day: 2,
        label: "2025-06-02",
        tickLabel: "02/06/25",
        normal: null,
        currentObserved: 28,
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
    },
      2,
      1500
    ),
    {
      observedDuration: 563,
      forecastBegin: 563,
      forecastDuration: 562,
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
    },
      2,
      1500
    ),
    {
      observedDuration: 0,
      forecastBegin: 0,
      forecastDuration: 1500,
    }
  );
});

test("keeps observed and forecast segments aligned on non-fresh rerenders", () => {
  const currentSeriesAnimation = getCurrentSeriesAnimation(
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
    },
    2,
    1500
  );

  assert.deepEqual(
    getCurrentObservedLineAnimation({
      currentSeriesAnimation,
      freshLineKeys: new Set<string>(),
      reducedMotion: false,
      updateAnimationMs: 400,
    }),
    {
      animationDuration: 400,
      isAnimationActive: true,
    }
  );

  assert.deepEqual(
    getCurrentForecastLineAnimation({
      currentSeriesAnimation,
      freshLineKeys: new Set<string>(),
      reducedMotion: false,
      updateAnimationMs: 400,
    }),
    {
      animationBegin: 0,
      animationDuration: 400,
      isAnimationActive: true,
    }
  );
});

test("scales the current curve down when it is shorter than the longest series", () => {
  // 2 observed + 1 forecast = 2 segments, against a 4-segment reference.
  // The current series keeps its observed->forecast stagger, but its total
  // budget is compressed to avoid reading slower than a single-line series.
  assert.deepEqual(
    getCurrentSeriesAnimation(
      {
        id: "current",
        label: "2025",
        offsetYears: 0,
        values: [
          { date: "2025-06-01", day: 1, year: 2025, tmax: 30, tmin: 18, isForecast: false },
          { date: "2025-06-02", day: 2, year: 2025, tmax: 29, tmin: 17, isForecast: false },
          { date: "2025-06-03", day: 3, year: 2025, tmax: 28, tmin: 16, isForecast: true },
        ],
      },
      4,
      1500
    ),
    {
      observedDuration: 282,
      forecastBegin: 282,
      forecastDuration: 281,
    }
  );
});

test("compresses the fresh current series total duration while keeping forecast staggered", () => {
  const animation = getCurrentSeriesAnimation(
    {
      id: "current",
      label: "2025",
      offsetYears: 0,
      values: [
        { date: "2025-06-01", day: 1, year: 2025, tmax: 30, tmin: 18, isForecast: false },
        { date: "2025-06-02", day: 2, year: 2025, tmax: 29, tmin: 17, isForecast: false },
        { date: "2025-06-03", day: 3, year: 2025, tmax: 28, tmin: 16, isForecast: true },
      ],
    },
    2,
    1500
  );

  assert.equal(animation.forecastBegin, animation.observedDuration);
  assert.equal(animation.forecastBegin > 0, true);
  assert.equal(animation.observedDuration + animation.forecastDuration < 1500, true);
});

test("gives every series the same per-segment speed via getUniformDrawDuration", () => {
  // reference 4 segments over 1500ms -> 375ms/segment.
  assert.equal(getUniformDrawDuration(4, 4, 1500), 1500);
  assert.equal(getUniformDrawDuration(2, 4, 1500), 750);
  assert.equal(getUniformDrawDuration(1, 4, 1500), 375);
});

test("falls back to the full duration when there is no reference segment", () => {
  assert.equal(getUniformDrawDuration(0, 0, 1500), 1500);
});

test("plays the full draw-in for a fresh series key at the reference length", () => {
  assert.equal(getSeriesAnimationDuration("minus-1", new Set(["minus-1"]), false, 1500, 400, 10, 10), 1500);
});

test("scales a fresh series shorter than the reference to keep equal speed", () => {
  assert.equal(getSeriesAnimationDuration("minus-1", new Set(["minus-1"]), false, 1500, 400, 5, 10), 750);
});

test("uses the shorter update duration for a non-fresh series key", () => {
  assert.equal(getSeriesAnimationDuration("minus-1", new Set(), false, 1500, 400, 10, 10), 400);
});

test("forces zero duration under reduced motion regardless of freshness", () => {
  assert.equal(getSeriesAnimationDuration("minus-1", new Set(["minus-1"]), true, 1500, 400, 10, 10), 0);
  assert.equal(getSeriesAnimationDuration("minus-1", new Set(), true, 1500, 400, 10, 10), 0);
});

test("treats the two current sub-lines as independent keys", () => {
  const fresh = new Set<string>(["currentObserved"]);
  assert.equal(getSeriesAnimationDuration("currentObserved", fresh, false, 1500, 400, 10, 10), 1500);
  assert.equal(getSeriesAnimationDuration("currentForecast", fresh, false, 1500, 400, 10, 10), 400);
});

test("expands the current dataset into its two sub-line keys", () => {
  const keys = getSeriesLineKeys([
    { id: "current", label: "2025", offsetYears: 0, values: [] },
    { id: "minus-1", label: "2024", offsetYears: 1, values: [] },
  ]);
  assert.deepEqual(keys, ["currentObserved", "currentForecast", "minus-1"]);
});

test("builds a stable dependency token from the series keys", () => {
  assert.equal(
    getSeriesLineKeysDependency(["currentObserved", "currentForecast", "minus-1"]),
    '["currentObserved","currentForecast","minus-1"]'
  );
});

test("changes the dependency token when the series key order changes", () => {
  assert.notEqual(
    getSeriesLineKeysDependency(["currentObserved", "currentForecast", "minus-1"]),
    getSeriesLineKeysDependency(["minus-1", "currentObserved", "currentForecast"])
  );
});

test("returns only the keys absent from the previous render", () => {
  const fresh = getFreshSeriesKeys(
    ["currentObserved", "currentForecast", "minus-1", "minus-3"],
    ["currentObserved", "currentForecast", "minus-1"]
  );
  assert.deepEqual([...fresh], ["minus-3"]);
});

test("marks every key fresh when there was no previous render", () => {
  const fresh = getFreshSeriesKeys(["currentObserved", "minus-1"], []);
  assert.deepEqual([...fresh], ["currentObserved", "minus-1"]);
});

test("treats current sub-lines as fresh when their data signature changes", () => {
  const previous = new Map([
    ["currentObserved", "currentObserved|2025-06-01:30|2025-06-02:29"],
    ["currentForecast", "currentForecast|2025-06-02:29|2025-06-03:28"],
  ]);
  const current = new Map([
    ["currentObserved", "currentObserved|2025-07-01:31|2025-07-02:27"],
    ["currentForecast", "currentForecast|2025-07-02:27|2025-07-03:25"],
  ]);

  assert.deepEqual([...getFreshSeriesKeysFromSignatures(current, previous)], [
    "currentObserved",
    "currentForecast",
  ]);
});

test("keeps series non-fresh when only the visible set changes around unchanged current data", () => {
  const datasets = [
    {
      id: "current",
      label: "2025",
      offsetYears: 0,
      values: [
        { date: "2025-06-01", day: 1, year: 2025, tmax: 30, tmin: 18, isForecast: false },
        { date: "2025-06-02", day: 2, year: 2025, tmax: 29, tmin: 17, isForecast: false },
        { date: "2025-06-03", day: 3, year: 2025, tmax: 28, tmin: 16, isForecast: true },
      ],
    },
  ];
  const previous = getSeriesLineSignatures(datasets, "tmax");
  const current = getSeriesLineSignatures(
    [
      ...datasets,
      {
        id: "minus-1",
        label: "2024",
        offsetYears: 1,
        values: [
          { date: "2024-06-01", day: 1, year: 2024, tmax: 27, tmin: 16, isForecast: false },
          { date: "2024-06-02", day: 2, year: 2024, tmax: 26, tmin: 15, isForecast: false },
          { date: "2024-06-03", day: 3, year: 2024, tmax: 25, tmin: 14, isForecast: false },
        ],
      },
    ],
    "tmax"
  );

  assert.deepEqual([...getFreshSeriesKeysFromSignatures(current, previous)], ["minus-1"]);
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
  assert.equal(source.includes('className="weather-chart-shell min-w-[760px]"'), true);
});

test("uses an equidistant x-axis interval to keep date ticks evenly spaced", () => {
  const source = readFileSync(
    path.join(process.cwd(), "src/features/weather/components/chart/WeatherChart.tsx"),
    "utf8"
  );

  assert.equal(source.includes('interval="equidistantPreserveStart"'), true);
});

test("removes focus outline styles from recharts surfaces inside the chart shell", () => {
  const source = readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");

  assert.equal(source.includes(".weather-chart-shell :is(.recharts-wrapper, .recharts-surface):focus"), true);
  assert.equal(source.includes("outline: none;"), true);
});
