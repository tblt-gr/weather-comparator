import { formatLocalDate } from "@/features/weather/logic/dates";
import { EXTREME_KIND_COLORS } from "@/features/weather/logic/extremes";
import type {
  ClimateNormal,
  ColdWavePeriod,
  HeatwavePeriod,
  TemperatureMode,
  WeatherYearDataset,
} from "@/features/weather/types";

export type ChartRow = {
  day: number;
  label: string;
  tickLabel: string;
  normal?: number | null;
  [year: string]: number | string | null | undefined;
};

type ExtremeAreaSegment = {
  x1: number;
  x2: number;
  isForecast: boolean;
};

export function getChartRowValue(row: ChartRow, datasetId: string) {
  if (datasetId !== "current") {
    return typeof row[datasetId] === "number" ? row[datasetId] : null;
  }

  const value = row.currentObserved ?? row.currentForecast;
  return typeof value === "number" ? value : null;
}

export function formatAccessibleTemperature(value: number | null | undefined) {
  return typeof value === "number" ? `${value.toFixed(1)} °C` : "—";
}

export function buildChartRows(
  datasets: WeatherYearDataset[],
  temperatureMode: TemperatureMode,
  normals?: ClimateNormal[]
) {
  const maxDays = Math.max(0, ...datasets.map((dataset) => dataset.values.length));
  const normalByDay = new Map(normals?.map((normal) => [normal.day, normal.value]));
  const labelsByDay = new Map<number, string>();
  datasets.forEach((dataset) => {
    dataset.values.forEach((value) => {
      if (!labelsByDay.has(value.day)) {
        labelsByDay.set(value.day, value.date);
      }
    });
  });
  const datasetValuesByDay = datasets.map((dataset) => ({
    id: dataset.id,
    firstForecastDay: dataset.values.find((value) => value.isForecast)?.day ?? null,
    valuesByDay: new Map(dataset.values.map((value) => [value.day, value] as const)),
  }));

  return Array.from({ length: maxDays }, (_, index) => {
    const day = index + 1;
    const row: ChartRow = {
      day,
      label: labelsByDay.get(day) ?? "",
      tickLabel: formatChartDateTick(labelsByDay.get(day) ?? ""),
      normal: normalByDay.get(day) ?? null,
    };

    datasetValuesByDay.forEach((dataset) => {
      const value = dataset.valuesByDay.get(day);

      if (dataset.id === "current") {
        const isForecastBridgeDay =
          dataset.firstForecastDay !== null && day === dataset.firstForecastDay;

        row.currentObserved =
          !value?.isForecast || isForecastBridgeDay ? (value?.[temperatureMode] ?? null) : null;
        row.currentForecast = value?.isForecast ? (value?.[temperatureMode] ?? null) : null;
        return;
      }

      row[dataset.id] = value?.[temperatureMode] ?? null;
    });

    return row;
  });
}

export function getForecastBoundaryDay(datasets: WeatherYearDataset[]) {
  const currentDataset = datasets.find((dataset) => dataset.id === "current");
  const firstForecastDay = currentDataset?.values.find((value) => value.isForecast)?.day;

  return typeof firstForecastDay === "number" ? firstForecastDay : null;
}

export function getDisplayedForecastBoundaryDay(
  todayBoundaryDay: number | null,
  forecastBoundaryDay: number | null
) {
  if (forecastBoundaryDay === null) {
    return null;
  }

  return forecastBoundaryDay === todayBoundaryDay ? null : forecastBoundaryDay;
}

// All curves must read at the same on-screen speed. Recharts reveals a line over
// its own path length in `animationDuration`, so equal speed means duration must
// scale with length. We budget by SEGMENT count and normalize every series to the
// longest visible one (referenceSegmentCount): the longest takes `fullMs`, shorter
// curves finish sooner but sweep at the identical segments-per-ms.
export function getMonthBoundaryDays(rows: ChartRow[]) {
  return rows
    .filter((row) => typeof row.label === "string" && row.label.slice(8, 10) === "01")
    .map((row) => row.day);
}

export function getTodayBoundaryDay(rows: ChartRow[], today = formatLocalDate(new Date())) {
  const matchingRow = rows.find((row) => row.label === today);

  return matchingRow?.day ?? null;
}

export function getChartTickFontWeight(
  day: number | string | undefined,
  todayBoundaryDay: number | null
) {
  if (todayBoundaryDay === null) {
    return 400;
  }

  return Number(day) === todayBoundaryDay ? 700 : 400;
}

export function formatChartDateTick(value: string | number) {
  const text = String(value);
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);

  if (!parts) {
    return text;
  }

  const [, year, month, day] = parts;

  return `${day}/${month}/${year.slice(2)}`;
}

export function getHeatwaveFill(kind: HeatwavePeriod["kind"]) {
  return EXTREME_KIND_COLORS[kind];
}

export function getColdWaveFill(kind: ColdWavePeriod["kind"]) {
  return EXTREME_KIND_COLORS[kind];
}

export function getExtremeAreaSegments(
  period: {
    startDay: number;
    endDay: number;
    includesForecast: boolean;
    forecastStartDay: number | null;
  },
  bridgeToDay?: number | null
): ExtremeAreaSegment[] {
  // When a hot spell is split into adjacent vague de chaleur and canicule
  // periods, each fills [startDay, endDay], leaving a one-day gap between the
  // two bands. The earlier band extends up to its successor's start day so the
  // boundary is filled with the earlier (less severe) color, with no gap.
  const endDay = bridgeToDay ?? period.endDay;

  if (!period.includesForecast || period.forecastStartDay === null) {
    return [{ x1: period.startDay, x2: endDay, isForecast: false }];
  }

  if (period.forecastStartDay <= period.startDay) {
    return [{ x1: period.startDay, x2: endDay, isForecast: true }];
  }

  const displayedForecastStartDay = Math.max(period.startDay, period.forecastStartDay);

  return [
    { x1: period.startDay, x2: displayedForecastStartDay, isForecast: false },
    { x1: displayedForecastStartDay, x2: endDay, isForecast: true },
  ];
}

export function getExtremeBridgeDay(
  period: { datasetId: string; endDay: number },
  periods: { datasetId: string; startDay: number }[]
): number | null {
  const successor = periods.find(
    (candidate) =>
      candidate.datasetId === period.datasetId && candidate.startDay === period.endDay + 1
  );

  return successor ? successor.startDay : null;
}
