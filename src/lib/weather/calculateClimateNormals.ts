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
