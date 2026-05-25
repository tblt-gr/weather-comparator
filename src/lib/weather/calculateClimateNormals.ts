import type { OpenMeteoArchiveResponse } from "@/lib/api/openMeteo";
import { type DatePeriod, getComparableDateRangeByOffset } from "@/lib/weather/dateRange";
import { normalizeWeatherData } from "@/lib/weather/normalizeWeatherData";
import type { ClimateNormal, TemperatureMode, WeatherYearDataset } from "@/types/weather";

export function calculateClimateNormals(
  datasets: WeatherYearDataset[],
  temperatureMode: TemperatureMode
): ClimateNormal[] {
  const maxDays = Math.max(0, ...datasets.map((dataset) => dataset.values.length));

  return Array.from({ length: maxDays }, (_, index) => {
    const day = index + 1;
    const values = datasets
      .map((dataset) => dataset.values.find((value) => value.day === day)?.[temperatureMode])
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

  return Array.from({ length: 30 }, (_, i) => 1991 + i).flatMap((year) => {
    const offsetYears = referenceYear - year;
    const range = getComparableDateRangeByOffset({ offsetYears, period });

    if (range === null) return [];

    return [normalizeWeatherData({ offsetYears, range, response })];
  });
}
