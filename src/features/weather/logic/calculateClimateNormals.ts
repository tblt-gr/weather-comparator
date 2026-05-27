import {
  CLIMATE_NORMAL_START_YEAR,
  CLIMATE_NORMAL_YEAR_COUNT,
} from "@/features/weather/logic/climateNormalYears";
import type { OpenMeteoArchiveResponse } from "@/features/weather/api";
import {
  type DatePeriod,
  getComparableDateRangeByOffset,
} from "@/features/weather/logic/dateRange";
import { normalizeWeatherData } from "@/features/weather/logic/normalizeWeatherData";
import type {
  ClimateNormal,
  TemperatureMode,
  WeatherYearDataset,
} from "@/features/weather/types";

export function calculateClimateNormals(
  datasets: WeatherYearDataset[],
  temperatureMode: TemperatureMode
): ClimateNormal[] {
  const maxDays = Math.max(0, ...datasets.map((dataset) => dataset.values.length));
  const datasetsByDay = datasets.map(
    (dataset) => new Map(dataset.values.map((value) => [value.day, value] as const))
  );

  return Array.from({ length: maxDays }, (_, index) => {
    const day = index + 1;
    const values = datasetsByDay
      .map((dataset) => dataset.get(day)?.[temperatureMode])
      .filter((value): value is number => typeof value === "number");

    return {
      day,
      value:
        values.length > 0
          ? values.reduce((total, value) => total + value, 0) / values.length
          : null,
    };
  });
}

export function averageDatasetTemperature(
  dataset: WeatherYearDataset | undefined,
  temperatureMode: TemperatureMode
) {
  const values =
    dataset?.values
      .map((value) => value[temperatureMode])
      .filter((value): value is number => typeof value === "number") ?? [];

  if (values.length === 0) {
    return null;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function buildClimateDatasetsFromRange(
  response: OpenMeteoArchiveResponse,
  period: DatePeriod
): WeatherYearDataset[] {
  const referenceYear = Number(period.startDate.slice(0, 4));

  return Array.from({ length: CLIMATE_NORMAL_YEAR_COUNT }, (_, i) => CLIMATE_NORMAL_START_YEAR + i).flatMap((year) => {
    const offsetYears = referenceYear - year;
    const range = getComparableDateRangeByOffset({ offsetYears, period });

    if (range === null) return [];

    return [normalizeWeatherData({ offsetYears, range, response })];
  });
}
